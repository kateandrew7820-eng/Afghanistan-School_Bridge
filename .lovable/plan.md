# Hierarchical Approval Emails + Real Notifications

Turn the pending-verification step into a real approval workflow: the moment a user lands on `/pending-verification`, an email with Accept / Deny / Delay buttons is sent to their hierarchical head, and the applicant sees real in-app notifications.

## 1. Approver routing (defaults per position)

Each role's approval email goes to a preset head email. If the applicant filled a matching principal/district/etc. in the DB later, we still use these defaults for now (as requested).


| Applicant role    | Approver email                               | Approver label     |
| ----------------- | -------------------------------------------- | ------------------ |
| student / teacher | `kateandrew78.20@gmail.com` (principal)      | مدیر مکتب          |
| principal         | `salikmasoud621@gmail.com` (district admin)  | رئیس معارف ولسوالی |
| district_admin    | `zahrasalik87@gmail.com` (province admin)    | رئیس معارف ولایت   |
| province_admin    | `manotofaza@gmail.com` (admin)               | مدیر ملی           |
| admin             | `masoudsalik2024@gmail.com` (ministry)       | وزیر معارف         |
| ministry_admin    | `masoudsalik2024@gmail.com` (platform owner) | مالک پلتفرم        |


Stored in `src/lib/approverRouting.ts` (single source of truth) and mirrored in the edge function.

## 2. Database (one migration)

New table `public.approval_requests`:

- `applicant_user_id`, `applicant_email`, `applicant_full_name`, `applicant_role`, `school_name`, `district`, `province`, `phone_number`
- `approver_email`, `approver_label`
- `status` enum text: `pending` | `approved` | `denied` | `delayed`
- `action_token` uuid unique (signed link param)
- `decided_at`, `decided_by_email`, `decision_note`
- `created_at`, `updated_at`
- Grants: `SELECT, INSERT` to `authenticated`; `ALL` to `service_role`. No anon.
- RLS: applicant can `SELECT` their own rows; admins can select all; only service_role writes decisions.

New table `public.notifications`:

- `user_id`, `title`, `body`, `type` (`approval_approved` | `approval_denied` | `approval_delayed` | `info`), `link` (target route), `read_at`, `created_at`
- Grants: `SELECT, UPDATE` to `authenticated`; `ALL` to `service_role`.
- RLS: user can select/update their own rows (only `read_at`).

Both get `updated_at` trigger and are added to realtime publication.

## 3. Edge functions (public — verify_jwt=false where noted)

- `request-approval` (JWT-protected): called from `/pending-verification` on mount. Reads applicant's `profiles` row, picks approver from routing table, upserts `approval_requests` row (idempotent per `applicant_user_id` while pending), sends the email via Lovable Emails (React Email template `approval-request.tsx`) containing full name, role, school, district, province, phone (or "ثبت نشده"), submission timestamp, and three big buttons linking to `<app>/approve/{token}?action=accept|deny|delay`.
- `handle-approval-decision` (verify_jwt=false, public link target): validates `action_token`, marks decision, inserts a `notifications` row for the applicant, updates `profiles.status` to `verified` on accept (with `verified_by_email = approver_email`) or `rejected` on deny. Shows a small branded confirmation HTML page in Dari to the head.

Both use `SUPABASE_SERVICE_ROLE_KEY` server-side only. Input validated with Zod.

## 4. App email template

`supabase/functions/_shared/transactional-email-templates/approval-request.tsx` — React Email, RTL Dari, brand colors, three inline buttons (green Accept, red Deny, amber Delay) no link, just the fully functional buttons, applicant info table, timestamp. Registered in `registry.ts`.

## 5. In-app notifications

New `useNotifications()` hook (`src/hooks/useNotifications.ts`):

- Fetches `notifications` for `auth.uid()` ordered by `created_at desc`.
- Realtime subscription on INSERT for the current user.
- `markAsRead(id)`, `markAllRead()`.

New `NotificationBell` component (`src/components/NotificationBell.tsx`):

- Bell icon + unread badge.
- Popover with the last 10 notifications; clicking one marks read and navigates to `notification.link`.
- Placement:
  - `PendingVerification.tsx`: top-right corner (RTL → visually top-right of the card header).
  - `AfghanistanInfoPage.tsx` and `Index.tsx` (homepage): top-left corner.

## 6. Pending verification page changes

`src/pages/PendingVerification.tsx`:

- On first mount, if `profile.status === 'pending_verification'` and no active `approval_requests` row exists for this user, call `supabase.functions.invoke('request-approval')`. Guard with a `sessionStorage` flag to avoid duplicate sends across React strict-mode mounts.
- Show a small "درخواست تأیید ارسال شد به {approver_label}" line under the existing message.
- Mount `<NotificationBell />` in the header.
- Keep existing realtime `profiles` listener; on approved → navigate to role's dashboard route; on rejected → show existing rejected state.

## 7. Decision → applicant experience

- Accept → notification "حساب شما تأیید شد" with `link = /school|/district|/province|/ministry` (based on role). Clicking navigates there. Profile status flipped to `verified` so `useVerification()` unlocks access.
- Deny → notification "متأسفانه توسط {approver_label} تأیید نشدید. لطفاً با معلومات دقیق دوباره تلاش کنید." with `link = /setup-profile`.
- Delay → notification "بررسی درخواست شما به تأخیر افتاده است." Applicant stays on pending page.

## 8. Files

**New**

- `supabase/migrations/<ts>_approval_and_notifications.sql`
- `supabase/functions/request-approval/index.ts`
- `supabase/functions/handle-approval-decision/index.ts`
- `supabase/functions/_shared/transactional-email-templates/approval-request.tsx`
- `src/lib/approverRouting.ts`
- `src/hooks/useNotifications.ts`
- `src/components/NotificationBell.tsx`

**Edited**

- `supabase/functions/_shared/transactional-email-templates/registry.ts` (register template)
- `supabase/config.toml` (register two functions; `handle-approval-decision` with `verify_jwt = false`)
- `src/pages/PendingVerification.tsx` (auto-send + bell)
- `src/pages/AfghanistanInfoPage.tsx` (bell top-left)
- `src/pages/Index.tsx` (bell top-left)
- `src/App.tsx` (route `/approve/:token` optional — but decision link points to the edge function directly, so route not needed unless we want a client landing)

## 9. Prerequisites the tool will handle

Approval emails require Lovable Emails. If the domain/infrastructure is not yet set up when we invoke email tools, the setup dialog will appear first; after completion I'll continue with scaffolding and this feature end-to-end in the same run.

## 10. Out of scope

- Editing the applicant's setup form itself.
- Real hierarchical lookup by school/district/province ownership (deferred; using default emails as requested).
- Push notifications / SMS.