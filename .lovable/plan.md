

# Production Upgrade Plan — SchoolBridge Afghanistan

## Summary

A comprehensive upgrade covering 8 areas: auth reliability, data pipeline integrity, dashboard differentiation, RLS security, routing stability, UI consistency, performance, and code cleanup.

---

## Phase 1: Fix Critical Auth & Routing (Blockers)

### 1A. Auth Flow Hardening
- **AuthContext**: Add `onAuthStateChange` event filtering — only react to `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED` events (ignore `INITIAL_SESSION` to avoid double-load)
- **Login page**: Add password reset link + `/reset-password` route with `supabase.auth.updateUser({ password })`
- **AuthCallback**: Add timeout fallback UI if token exchange takes >10s; handle `access_denied` error param
- **Session refresh**: Ensure `autoRefreshToken: true` is working (already set in client.ts) — add a silent re-auth check on app mount

### 1B. Routing & Redirect Fix
- **Root cause**: `useVerification` returns `needsSetup: true` when `profile?.status` is falsy, which forces redirect to `/setup-profile` even for logged-in users whose profile hasn't loaded yet
- **Fix**: Add a `profileLoading` state to AuthContext; `useVerification` should return `needsSetup: false` while profile is still loading
- **ProtectedRoute**: Show loading spinner while profile is being fetched, not redirect
- **PendingVerification redirect**: Change `/school/dashboard` to `/school` (correct route)

---

## Phase 2: Differentiate Dashboards (School vs District vs Province vs Ministry)

### 2A. School Dashboard (Teacher/Principal View)
- Use `useSubmissions({ district: profile.district, schoolId: profile.school_id })` — add `school_id` filter to `useSubmissions` hook
- Show: own school's submission history, status of each submission, quick-submit cards
- Remove `VerificationPanel` from school dashboard (principals don't verify teachers here)
- Add submission count badges per type (statistics/reports/forms)

### 2B. District Dashboard
- Already uses `useSubmissions({ district })` — keep this
- Add: list of schools in district with submission status per school
- Add: approve/reject actions for pending submissions
- Add: aggregated stats (total schools, completion rate)

### 2C. Province Dashboard  
- Already uses `useSubmissions({ province })` — keep this
- Add: district breakdown table showing submission counts per district
- Add: province-level aggregation charts
- Remove duplicate code with district dashboard

### 2D. Ministry Dashboard
- Already uses `useSubmissions({})` for national view — keep this  
- Add: province-level breakdown table
- Add: national completion metrics
- Add: export capability placeholder

---

## Phase 3: Data Pipeline & Submission Flow

### 3A. Extend `useSubmissions` Hook
- Add optional `school_id` filter for school-level dashboard
- Add `approve` and `reject` mutation functions using React Query `useMutation`
- Mutation updates `status` column + invalidates cache
- Add optimistic updates for approve/reject actions

### 3B. Submission Insert Validation
- In `SubmitStatistics`, `SubmitReports`, `SubmitForms`: validate that `profile.school_id` exists before insert
- Ensure `school_id` is always passed; trigger auto-populates `province`/`district`
- Add error UI if user has no school assigned

### 3C. Approval Actions (New)
- Create `useSubmissionActions` hook with `approveSubmission(id, table)` and `rejectSubmission(id, table, reason)`
- Wire into District and Province dashboards
- Add confirmation dialog before approve/reject

---

## Phase 4: Database & Security

### 4A. RLS Policy Audit & Fix
- Run security scan to identify gaps
- Ensure submission tables have proper policies:
  - School users: `SELECT/INSERT` only where `school_id = get_user_school_id(auth.uid())`
  - District admins: `SELECT/UPDATE` where `district = get_user_district(auth.uid())`
  - Province admins: `SELECT/UPDATE` where `province = get_user_province(auth.uid())`
  - Ministry admins: `SELECT/UPDATE` on all rows
- Add `UPDATE` policies for status changes (approve/reject) restricted by tier

### 4B. Migration: Add Missing Constraints
- Add `total_teachers` column to `statistics_submissions` if missing
- Ensure `status` defaults to `'pending'` on all submission tables (already done)

---

## Phase 5: UI Consistency & Polish

### 5A. Light Theme Enforcement
- Verify all layouts have `dark` class removed (done for District/Province/Ministry)
- Audit `SchoolLayout` — ensure no dark classes
- Replace any remaining hardcoded colors (`text-cyan-300`, `bg-green-100`) with design tokens

### 5B. Consistent Card & Badge Styles
- Unify status badge colors across all dashboards using shared `STATUS_CONFIG` from district dashboard
- Extract to shared `src/lib/statusConfig.ts`

### 5C. Loading & Error States
- Ensure all dashboards show `Skeleton` components while loading
- Add retry button on error states consistently
- Add empty state messages when no submissions exist

---

## Phase 6: Performance & Code Cleanup

### 6A. Remove Dead Files
- Delete ~30 markdown documentation files from project root (not needed in production)
- Remove `ENHANCED_DASHBOARD_EXAMPLE.tsx`, `ENHANCED_FORM_EXAMPLE.tsx`, `SERVER_CONFIG.js`

### 6B. Code Deduplication
- Extract shared dashboard stat cards into `src/components/DashboardStatCard.tsx`
- Extract submission list component into `src/components/SubmissionList.tsx`
- Remove `src/hooks/useMockData.ts`, `src/hooks/useMockSubmission.ts` — replace with real data paths

### 6C. Query Optimization
- Province dashboard's district count query: use `select('district')` with distinct — already done
- Ministry dashboard's province count: same pattern — already done
- Remove any `.limit()` calls that cap stats queries

---

## Files to Create/Edit

| Action | File | Purpose |
|--------|------|---------|
| Edit | `src/contexts/AuthContext.tsx` | Add profileLoading state, filter auth events |
| Edit | `src/hooks/useVerification.ts` | Respect profileLoading |
| Edit | `src/App.tsx` | Fix ProtectedRoute loading logic |
| Create | `src/pages/ResetPassword.tsx` | Password reset page |
| Edit | `src/pages/Login.tsx` | Add forgot password link |
| Edit | `src/hooks/useSubmissions.ts` | Add school_id filter, approve/reject mutations |
| Create | `src/hooks/useSubmissionActions.ts` | Approve/reject hook |
| Edit | `src/pages/school/Dashboard.tsx` | Own-school data, remove verification panel |
| Edit | `src/pages/district/Dashboard.tsx` | Add school list, approve/reject UI |
| Edit | `src/pages/province/Dashboard.tsx` | Add district breakdown |
| Edit | `src/pages/ministry/Dashboard.tsx` | Add province breakdown |
| Create | `src/lib/statusConfig.ts` | Shared status badge config |
| Create | `src/components/SubmissionList.tsx` | Reusable submission table |
| Edit | `src/pages/PendingVerification.tsx` | Fix redirect path |
| Migration | RLS policies | Tier-based access for submissions |
| Delete | Root `.md` files, example files | Cleanup |

---

## Implementation Order

1. Auth + routing fix (unblocks everything)
2. RLS migration (security before features)
3. `useSubmissions` extensions + `useSubmissionActions`
4. Dashboard rebuilds (school → district → province → ministry)
5. UI polish + shared components
6. Cleanup dead files

