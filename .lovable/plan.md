
## 1. Why the second tab is blank (root cause)

The white page in your screenshot is **not** an empty component — it's React failing to boot. Three signals confirm it:

- Runtime errors keep saying `Cannot read properties of null (reading 'useContext' / 'useRef')` inside `useNavigate`, `useQueryClient`, and `useSearchParams`. That happens when the `react` module evaluates to `null` — which is what happens when the browser loads `index.html` but the JS chunk URLs it references no longer exist (so React itself never loads).
- `public/service-worker.js` registers in **every** environment, including the Lovable preview, and uses a "cache-then-network" strategy that **stores `index.html` in `CACHE_DYNAMIC`** on every navigation.
- When you open the app in a second tab, the SW serves the cached `index.html` that points to old Vite hashed chunks (`?v=950d690a`). Those chunks were replaced on the server, so the browser 404s on the scripts → React = null → blank screen.

This is exactly the "broken existing PWA" pattern: a hand-written app-shell service worker that out-lives deploys and traps users on stale HTML.

## 2. Plan overview

```text
┌──────────────────────────────────────────────────────────────┐
│  A. Recovery: kill-switch SW + safer registration            │
│  B. Default dark theme (with light fallback ready)           │
│  C. Native split-flow auth                                   │
│     /login • /signup • /forgot-password                      │
│     /reset-password • /verify-email • /auth/callback         │
└──────────────────────────────────────────────────────────────┘
```

You chose **"Keep aggressive offline"**, so we keep offline behavior — but only after the broken worker is evicted, and with a safer policy that can never strand users on dead HTML again.

---

## A. Fix the blank tab (highest priority)

### A1. Replace `public/service-worker.js` with a one-shot kill switch
Following the PWA skill exactly: same path, self-unregisters, deletes only its own caches, navigates open clients. This evicts the bad SW from every browser that already has it. Ship for one cycle.

### A2. Rebuild offline support cleanly with `vite-plugin-pwa`
- `registerType: "autoUpdate"`, `injectRegister: null`.
- HTML / navigations → **NetworkFirst** (never cache-first — this is the rule the old SW violated).
- Hashed JS/CSS/font assets → CacheFirst (safe because filenames are hashed).
- Supabase REST → StaleWhileRevalidate with a small TTL.
- Single registration wrapper at `src/lib/registerSW.ts` that **refuses to register** in dev, inside iframes, and on any Lovable preview host (`*.lovableproject.com`, `id-preview--*`, `preview--*`, `*.beta.lovable.dev`). Supports `?sw=off` kill switch.

### A3. Remove SW registration from `src/main.tsx`
Replace the unguarded `navigator.serviceWorker.register('/service-worker.js')` with the wrapper. Result: previews stop registering workers (your second-tab bug literally cannot reproduce in preview again), published builds still get offline.

### A4. Defensive routing guard
Add a Suspense+ErrorBoundary at the route level so a single lazy-chunk fetch failure shows a Persian "بارگذاری دوباره" recovery card with a hard reload button — instead of a white screen — even if a chunk ever goes missing again.

---

## B. Default dark theme

Tokens already exist in `src/index.css` (`.dark { … }`) and `next-themes` is already installed. Light is **kept as a fallback** because some flows (printable exports, Ministry PDF previews) read better light.

### B1. Add `ThemeProvider` (next-themes)
- `defaultTheme="dark"`, `enableSystem={false}`, `attribute="class"`, `disableTransitionOnChange`.
- Wraps the app inside `App.tsx`, above `AuthProvider`.

### B2. Polish dark tokens for our brand
Tune `--background`, `--card`, `--primary`, `--accent`, `--sidebar-*`, and add `--gradient-hero`, `--shadow-glow` to match the inspiration screenshot (deep slate, teal/cyan accent, soft neon glow). All edits stay in `index.css` — no component-level color hardcoding.

### B3. Audit known light-only spots
- `Login`/`Index` gradients: switch hardcoded `from-primary/5` blends to token-based gradients that read in both modes.
- `RoleLayout` top bar `bg-card/95` already works; just verify contrast.
- Demo banner (`bg-warning/10`) already token-based — no change.

### B4. Theme toggle (subtle, header)
Sun/Moon button in `RoleLayout` header and on `/login`. Persists in `localStorage` via next-themes. Default stays dark.

### B5. Update memory
Replace the `Styling: Light theme only` core rule with `Default dark theme; light supported via toggle. Roboto body, Montserrat headings.`

---

## C. Native login experience — split flows

You picked **Split flows**. Here is the full UX contract, designed to feel like Linear / Notion / Vercel: each step is its own screen with one job, one primary action, and zero surprises.

### C1. Route map

```text
/login                  → Sign in (email + password)
/signup                 → Create account (3-step wizard)
/forgot-password        → Request reset email
/reset-password         → Set new password (token from email)
/verify-email           → "Check your inbox" + resend
/auth/callback          → OAuth/magic-link landing (exists, hardened)
/setup-profile          → First-run profile completion (exists)
/pending-verification   → Awaiting admin approval (exists)
```

Each route is a thin page that shares one `<AuthShell>` (logo, gradient backdrop, RTL frame, footer trust stats). Form bodies swap; chrome stays.

### C2. `/login` — Sign in (the front door)

**Layout (RTL):** centered card on a dark hero gradient, brand mark at top, then `email`, `password`, `forgot password` link (left-aligned inside card), big **ورود** button, divider, secondary "**ایجاد حساب جدید**" link to `/signup`.

**Inputs & states:**
- Email: ltr, `autocomplete="email"`, validates on blur, error slides in under field.
- Password: ltr, `autocomplete="current-password"`, eye toggle, Caps-Lock warning when active.
- Submit button is a single source of truth for loading; double-submit guard via `useRef` (already in place — preserved).
- Inline error region replaces the global Alert (cleaner). Toast only for non-form errors (network).

**What happens after click — full state matrix:**
| Outcome | UX response |
| --- | --- |
| Valid creds, verified | Toast "خوش آمدید"; redirect to role-default route (`/school`, `/district`, `/province`, `/ministry`) |
| Valid creds, pending verification | Redirect to `/pending-verification` |
| Valid creds, no profile yet | Redirect to `/setup-profile` |
| Wrong email/password | Inline error under password: "ایمیل یا رمز عبور اشتباه است" (never reveal which) |
| Email not confirmed | Redirect to `/verify-email?email=…` with "ایمیل خود را تأیید کنید" |
| Rate-limited (429) | Inline error + countdown "لطفاً ۳۰ ثانیه صبر کنید" |
| Network down | Toast + Retry; form stays filled |
| Already signed in | `useEffect` redirects on mount to dashboard |

**Keyboard / a11y:** Enter submits; focus auto-moves to first invalid field on error; all fields wired to `<label htmlFor>`; aria-live region announces errors; Esc clears focused field.

### C3. `/signup` — 3-step native wizard
Inspired by Linear/Vercel onboarding. Each step is one decision.

```text
Step 1: Identity        → Full name, email
Step 2: Security        → Password + confirm + live strength meter
Step 3: Done            → "Check your email" with resend + open mail client
```
- Progress dots at top (3 nodes).
- Back button per step except first (which has "بازگشت به ورود").
- Step 1→2 validates before advancing (no server call yet).
- Step 2 is the only network step; on success → Step 3.
- Step 3 has a "**باز کردن ایمیل**" button that tries `mailto:` and falls back to Gmail/Outlook quick links; a **"ارسال مجدد لینک"** button (60s cooldown using `useRef` timer).
- Edge cases: email already registered → jump back to Step 1 with prefilled email + CTA "آیا قبلاً حساب دارید؟ ورود".

### C4. `/forgot-password`
Single field. On submit, **always** shows the same neutral success screen ("اگر این ایمیل ثبت باشد، لینک بازنشانی ارسال شد") — to prevent email-enumeration. Resend cooldown 60s. Link to `/login`.

### C5. `/reset-password`
- Reads `type=recovery` and `access_token` from hash, validates with Supabase.
- Two fields: new password + confirm, strength meter (reused component).
- Submit calls `supabase.auth.updateUser({ password })`. On success → toast → redirect to `/login` with prefilled email.
- Invalid/expired token → friendly "این لینک منقضی شده" screen with "ارسال لینک جدید" CTA going back to `/forgot-password`.

### C6. `/verify-email`
- Pulls `email` from query.
- Shows confirmation icon, resend button (60s cooldown), and "ایمیل را اشتباه وارد کردید؟" → returns to `/signup`.
- Polls Supabase session every 5s while tab is visible; if session appears (user clicked the link in another tab), auto-redirect to `/setup-profile` or dashboard.

### C7. `/auth/callback` (harden, keep)
Already prevents redirect loops. Add a clear branded loading state ("در حال تأیید حساب…") instead of the bare spinner.

### C8. Cross-cutting auth polish
- **`AuthShell`** — shared frame with brand, gradient, RTL, helmet meta per page.
- **`AuthCard`** — consistent card width (max-w-md), spacing, divider treatment.
- **`PasswordField`**, **`PasswordStrengthMeter`** — extracted from current `Login.tsx` so all four screens share them.
- **`useCooldown(seconds)`** — small hook for resend timers (signup, forgot, verify).
- **`useAuthRedirect()`** — central "where should this user go right now?" helper used by `/login`, `/signup` final step, `/auth/callback`, `/reset-password`.
- **Trust signals** (3 stats: schools / provinces / students) stay only on `/login` and `/signup` step 1 — they create context without cluttering security screens.
- **Dev quick-enter** stays gated to `import.meta.env.DEV`, repositioned as a subtle footer chip instead of a yellow banner.

### C9. Security hygiene retained
- Double-submit `useRef` guards.
- Generic error messages on sign-in (no "user not found" vs "wrong password" leakage).
- Forgot-password neutral response (no enumeration).
- Password strength gating ≥ 6 chars (existing rule) preserved.
- All redirects use `Navigate replace` to keep history clean.

---

## File changes summary

```text
public/
  service-worker.js                 → REPLACED with kill-switch worker
src/
  main.tsx                          → SW registration uses guarded wrapper
  App.tsx                           → Wrap with <ThemeProvider>; add new auth routes
  index.css                         → Tune dark tokens; add hero gradient + glow
  lib/
    registerSW.ts                   → NEW guarded SW registration
  components/
    ThemeToggle.tsx                 → NEW (Sun/Moon)
    layouts/RoleLayout.tsx          → Add ThemeToggle in header
    auth/
      AuthShell.tsx                 → NEW
      AuthCard.tsx                  → NEW
      PasswordField.tsx             → NEW (extracted)
      PasswordStrengthMeter.tsx     → NEW (extracted)
  hooks/
    useCooldown.ts                  → NEW
    useAuthRedirect.ts              → NEW
  pages/auth/
    Login.tsx                       → REWRITTEN (sign-in only)
    Signup.tsx                      → NEW (3-step wizard)
    ForgotPassword.tsx              → NEW
    ResetPassword.tsx               → MOVED + native polish
    VerifyEmail.tsx                 → NEW
vite.config.ts                      → Add vite-plugin-pwa (generateSW)
```

Old `src/pages/Login.tsx` and `src/pages/ResetPassword.tsx` are deleted after the split lands; redirects from `/admin/*` etc. stay untouched.

---

## Order of work
1. **Stop the bleeding** — kill-switch SW + guarded registration + route-level error fallback.
2. **Dark theme default** — ThemeProvider, token polish, toggle.
3. **Auth split** — shared shell + 5 screens + cross-cutting hooks.
4. **Verify** — read console & network requests in preview; open `/school` in a second tab and confirm no white page; sign-in → dashboard → sign out flow end-to-end; signup → verify-email → callback round-trip.

After you approve, I'll switch to build mode and implement in that order.
