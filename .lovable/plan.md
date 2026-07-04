# Auth Overhaul: Number-Matching Signup + OTP Password Reset

## Goals

1. Replace the broken "Verify Email" button with a **number-matching** confirmation flow (like Google/Microsoft MFA prompts).
2. Replace the password-reset magic link with a **6-digit OTP** flow that stays inside the app.
3. Give the user clear fallback options at every failure point (Resend, Return to Login, Go to Afghanistan Info main page).

---

## Part 1 — Signup: Number-Matching Confirmation

### User experience

1. User submits signup form (email + password + profile).
2. Signup page moves to a new **"Confirm It's You"** step showing **one large number** (e.g. `47`) on screen with a live "waiting…" state.
3. User receives an email titled **"تأیید ثبت‌نام — شماره را انتخاب کنید"** containing **three big buttons/numbers** (one is `47`, two are decoys like `12` and `83`).
4. User taps the number that matches their screen on their phone.
  - **Match** → screen advances **in real time** (no refresh) to the next signup step (profile setup / success).
  - **Mismatch** → email page shows "Wrong number", and the signup page shows a red **"شماره اشتباه انتخاب شد"** state with 3 buttons:
    - **ارسال مجدد ایمیل** (Resend, with 60s cooldown)
    - **بازگشت به ورود** (Go to Login)
    - **صفحه اصلی افغانستان** (Go to `/afghanistan-info`)
5. If the user does nothing for 10 minutes, the challenge expires and shows the same 3 options.

### Technical design

**New DB table** `public.signup_challenges`:

```
id uuid pk, user_id uuid fk auth.users, email text,
correct_number int, decoys int[],   -- 3 numbers total, 10–99
status text ('pending'|'matched'|'mismatched'|'expired'),
created_at timestamptz, expires_at timestamptz (now()+10 min)
```

- RLS: user can `select` own row by `user_id`; edge functions use service role.
- Grants: `select` to `authenticated`, `all` to `service_role`.

**New edge function** `signup-challenge`:

- `POST /create` → after `supabase.auth.signUp()`, called with the new user id + email. Generates correct number + 2 decoys, stores row, sends custom email with three signed links: `https://<app>/confirm-signup?cid=<uuid>&pick=<number>&sig=<hmac>`.
- Email is sent via existing Lovable email infrastructure (reuse `send-approval-email` pattern; scaffold auth email templates only if the infra path requires it — otherwise send directly from this function).

**New edge function** `signup-challenge-verify` (public, no JWT required):

- Handles the link click. Verifies HMAC, looks up challenge, marks `matched` or `mismatched`, and (on match) calls admin API to `email_confirm: true` on the user.
- Returns a small styled HTML page in Dari confirming the choice ("درست بود، برگردید به صفحه ثبت‌نام" / "شماره اشتباه بود").

**Realtime bridge**:

- Signup page subscribes to `postgres_changes` on `signup_challenges` filtered by `id=eq.<cid>`.
- On `status` change → advance step or show mismatch UI.

**Files to add**:

- `supabase/migrations/<ts>_signup_challenges.sql`
- `supabase/functions/signup-challenge/index.ts`
- `supabase/functions/signup-challenge-verify/index.ts`
- `src/pages/auth/ConfirmSignup.tsx` (the "pick the number on your screen" step; realtime listener + fallback UI)
- `src/pages/auth/SignupConfirmed.tsx` optional success view

**Files to change**:

- `src/pages/auth/Signup.tsx` — after successful `signUp()`, call `signup-challenge/create`, push to `/confirm-signup?cid=…`, remove reliance on Supabase's default confirm email.
- `src/App.tsx` — register `/confirm-signup` route (public).
- `src/pages/auth/VerifyEmail.tsx` — retire or redirect to new flow (kept for legacy links but deep-links to `/confirm-signup` if a `cid` is present).
- Disable Supabase's built-in confirmation email for signup so users only receive our number-match email (configure via `supabase--configure_auth` — keep `auto_confirm_email: false`, and skip default template by using the auth-email-hook to no-op signup type, OR simpler: leave default off and rely solely on our edge function email).

---

## Part 2 — Login: Forgot Password with 6-digit OTP

### User experience

1. On `/login`, the user types their email in the email field, then clicks **"رمز عبور را فراموش کرده‌اید؟"**.
2. **Immediately** (no page nav) an inline panel expands under the button showing 6 OTP input boxes plus "کد به ایمیل شما ارسال شد".
3. Backend sends `supabase.auth.resetPasswordForEmail()` — email template updated to show `{{ .Token }}` (6-digit) prominently instead of just a link.
4. User types the 6 digits:
  - **Match** → verified via `supabase.auth.verifyOtp({ type: 'recovery', email, token })`, session created, navigate to `/reset-password` for new password entry.
  - **Mismatch / 3 wrong attempts / expired** → panel switches to a fallback with three buttons:
    - **بازگشت به صفحه اصلی** (`/afghanistan-info`)
    - **ارسال مجدد کد** (60s cooldown, resets attempt counter)
    - **بازگشت به ورود** (collapse panel back to login form)

### Technical design

- No new tables. Uses Supabase's built-in recovery OTP.
- Auth email template (`supabase/functions/_shared/email-templates/recovery.tsx`) is updated to feature the 6-digit token as the primary content, keeping the link as a small secondary "or click here" for accessibility. Scaffold via `email_domain--scaffold_auth_email_templates` first (only if not already scaffolded).
- `PasswordField` reused for the new-password screen.

**Files to add**:

- `src/components/auth/ForgotPasswordPanel.tsx` — inline expandable panel with email pre-fill, OTP inputs (6 boxes), resend cooldown, fallback state.
- `src/components/auth/OtpInput.tsx` — small 6-box RTL-aware digit input with paste support.

**Files to change**:

- `src/pages/auth/Login.tsx` — replace `<Link to="/forgot-password">` with a button that expands `ForgotPasswordPanel` inline; pass current `email` value.
- `src/pages/auth/ForgotPassword.tsx` — either delete or make it a thin wrapper around `ForgotPasswordPanel` for direct-link users.
- `src/pages/auth/ResetPassword.tsx` — trust the session established by `verifyOtp`; drop the URL-hash `type=recovery` check.
- Auth email `recovery.tsx` template — token-first layout.

---

## Part 3 — Small hardening also included

- `Signup.tsx`: ensure `emailRedirectTo` is unused (we're not relying on the link).
- `Login.tsx`: on "email not confirmed" error, redirect to `/confirm-signup?email=…` to trigger a fresh challenge instead of the old `/verify-email`.
- `AuthCallback.tsx`: keep OAuth handling untouched; add a branch that if the URL is our old confirm link, redirect users to the new number-match page.

---

## Out of scope (will not touch)

- Google/OAuth login flow.
- Existing role/tier redirect logic in `AuthContext`.
- `AdminLayout`, dashboards, RLS on unrelated tables.

---

## Rollout order (once approved)

1. Migration for `signup_challenges` (+ grants + RLS).
2. Edge functions `signup-challenge` and `signup-challenge-verify`, deploy.
3. Signup UI (`Signup.tsx` + new `ConfirmSignup.tsx` + route).
4. Scaffold auth email templates (if not already) and rewrite `recovery.tsx` for OTP-first.
5. Login UI (`Login.tsx` + `ForgotPasswordPanel` + `OtpInput`).
6. Reset password page trimmed to just "set new password".
7. Manual verification via Playwright (signup happy path + wrong-number path + forgot-password OTP path).

Confirm and I'll build it.