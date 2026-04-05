

# Production Upgrade Plan — SchoolBridge Afghanistan

## Current State Assessment

The codebase has a solid foundation: auth flow with email verification, four-tier dashboards (school/district/province/ministry), RLS policies, real-time subscriptions, and submission CRUD. However, several gaps remain before production readiness.

## Phase 1: Security Fixes (Critical)

### 1A. Self-Approval Vulnerability
Users can currently call `supabase.from('profiles').update({ status: 'verified' })` on their own row and bypass admin approval entirely.

**Fix**: Create a migration that drops the current "Users can update own profile" policy and replaces it with one that prevents modifying `status`, `verified_at`, `verified_by_user_id`, and `rejection_reason` columns. Use a SECURITY DEFINER function for admin-only status changes.

### 1B. Edge Function Authentication
`send-approval-email` has no JWT check and wildcard CORS, allowing anyone to enumerate user emails by UUID.

**Fix**: Add `Authorization` header validation, verify caller is admin via `user_roles`, remove `emailTo` from response, restrict CORS origin.

### 1C. Realtime Channel Authorization
Any authenticated user can subscribe to any channel and receive row-change events for all schools.

**Fix**: Remove the broad realtime publication. Instead, use client-side filtered channels with RLS-protected queries (the existing approach of invalidating React Query on change is safe since the query itself respects RLS).

### 1D. Error Sanitization
Raw database errors (table names, constraint names) are leaked to users across 10+ files.

**Fix**: Create `src/lib/sanitizeError.ts` with a code-to-Persian-message map. Replace all `description: error.message` calls.

### 1E. Input Length Constraints
Profile text fields have no length limits; `handle_new_user()` inserts unbounded metadata.

**Fix**: Migration to add VARCHAR constraints (full_name 255, phone_number 50, district/province/school_name 255). Update trigger to truncate.

### 1F. Leaked Password Protection
Enable HIBP password check via Cloud auth settings.

### 1G. Storage DELETE Policy
Add missing DELETE policy on `storage.objects` for `school-reports` bucket scoped to school folder.

## Phase 2: Placeholder Pages Replacement

Multiple routes still render generic `PlaceholderPage` components:
- `/district/submissions`, `/district/verify`, `/district/schools`
- `/province/districts`, `/province/analytics`, `/province/submissions`
- `/ministry/analytics`, `/ministry/provinces`, `/ministry/users`, `/ministry/export`

**Fix**: Build real pages for each:

| Route | Content |
|-------|---------|
| `/district/submissions` | Full submission list with filters (type, status, date), pagination, approve/reject actions |
| `/district/verify` | Pending submissions only, batch approve/reject |
| `/district/schools` | School management table (name, code, contact, submission count) |
| `/province/districts` | District list with school counts and submission stats per district |
| `/province/analytics` | Charts (recharts): submissions over time, approval rates, district comparison |
| `/province/submissions` | All province submissions with district filter |
| `/ministry/analytics` | National charts: province comparison, trend lines, KPIs |
| `/ministry/provinces` | All 34 provinces table with key metrics |
| `/ministry/users` | User management: list profiles, approve/reject pending accounts, assign roles |
| `/ministry/export` | Export submissions as CSV/Excel using client-side generation |

## Phase 3: Data Pipeline Hardening

### 3A. Submission Validation
Currently `SubmitStatistics`, `SubmitReports`, `SubmitForms` don't check if `profile.school_id` exists before insert. If null, the insert fails silently or with a confusing RLS error.

**Fix**: Add guard at top of each submit page — if no `school_id`, show an alert directing user to contact admin. Also ensure `submitted_by: user.id` is always set.

### 3B. Form Data JSONB Validation
Add a Postgres trigger to validate `form_data` size (<100KB) and required fields before insert.

### 3C. Confirmation Dialog for Approve/Reject
The `SubmissionList` currently fires approve/reject on single click with no confirmation. Add a confirmation dialog (using existing `SmartConfirmationDialog`) with optional rejection reason input.

## Phase 4: Auth & UX Polish

### 4A. SetupProfile → School Linking
`SetupProfile` currently saves `school_name` as text but never links to an actual `schools` table record. This means `school_id` stays null, breaking submission inserts.

**Fix**: Add a school lookup/autocomplete in SetupProfile. If school exists in DB, set `school_id`. If not, create the school record or allow admin to link later.

### 4B. User Management Page (Ministry)
Build `/ministry/users` to allow ministry admins to:
- View all pending profiles
- Approve/reject accounts (updating `status`, `verified_at`, `verified_by_user_id`)
- Assign roles via `user_roles` table
- This replaces the current manual approval flow

### 4C. Demo Mode Cleanup
Demo mode sets a fake user object with `id: 'demo-user'`. This can trigger Supabase queries that fail. Ensure all data-fetching hooks check `isDemoMode` and return mock data instead of querying.

## Phase 5: UI Consistency

### 5A. Responsive Audit
All layouts are already light-themed (no dark classes found). Verify:
- Mobile sidebar behavior is consistent across all four layouts
- Province and Ministry layouts match the School/District pattern (h-14 header, w-64 sidebar)

### 5B. Empty States
Add meaningful empty state illustrations/messages for:
- No submissions yet (school dashboard)
- No schools in district
- No pending verifications

### 5C. Date Localization
`format(new Date(...), 'd MMM')` outputs English month names. Add `date-fns/locale/fa-IR` or use a custom Dari formatter.

## Phase 6: Performance & Cleanup

### 6A. Remove Unused Files
- `src/lib/errorSimulation.tsx` and `ErrorSimulationPanel` (dev-only but still bundled)
- `src/pages/SetupProfileExample.tsx`
- `src/pages/QuickEnter.tsx`
- `src/components/WelcomeGuide.tsx`, `SignupProgress.tsx` if unused

### 6B. Bundle Optimization
Current Vite config uses Terser (slower). Switch to esbuild minification (default, faster). The manual chunks are already good.

### 6C. Query Deduplication
Province and Ministry dashboards both query `schools` table for breakdowns. Add `staleTime` and shared query keys to avoid redundant fetches.

---

## Implementation Order

1. **Security fixes** (Phase 1) — self-approval vulnerability is critical
2. **Auth/profile linking** (Phase 4A, 4B) — unblocks real data flow
3. **Placeholder page replacements** (Phase 2) — biggest user-facing gap
4. **Data pipeline hardening** (Phase 3) — ensures submissions work end-to-end
5. **UI polish** (Phase 5) — dates, empty states, responsive
6. **Cleanup** (Phase 6) — dead code, bundle size

## Files to Create/Edit

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/lib/sanitizeError.ts` | Centralized error sanitization |
| Create | `src/pages/district/Submissions.tsx` | Full submissions page |
| Create | `src/pages/district/VerifyData.tsx` | Pending verification page |
| Create | `src/pages/district/Schools.tsx` | School management |
| Create | `src/pages/province/Districts.tsx` | District breakdown |
| Create | `src/pages/province/Analytics.tsx` | Province analytics charts |
| Create | `src/pages/province/Submissions.tsx` | Province submissions |
| Create | `src/pages/ministry/Analytics.tsx` | National analytics |
| Create | `src/pages/ministry/Provinces.tsx` | Province list |
| Create | `src/pages/ministry/Users.tsx` | User/account management |
| Create | `src/pages/ministry/Export.tsx` | Data export |
| Edit | `src/App.tsx` | Wire new pages to routes |
| Edit | `src/pages/SetupProfile.tsx` | Add school linking |
| Edit | `src/components/SubmissionList.tsx` | Add confirmation dialog |
| Edit | `src/pages/school/SubmitStatistics.tsx` | Add school_id guard |
| Edit | `src/pages/school/SubmitReports.tsx` | Add school_id guard |
| Edit | `src/pages/school/SubmitForms.tsx` | Add school_id guard |
| Edit | `supabase/functions/send-approval-email/index.ts` | Add auth check |
| Migration | Profiles UPDATE policy | Prevent self-approval |
| Migration | VARCHAR constraints | Input length limits |
| Migration | Form data validation trigger | JSONB size limit |
| Migration | Storage DELETE policy | school-reports bucket |

