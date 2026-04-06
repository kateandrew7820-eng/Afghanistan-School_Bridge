

# Production Fix Plan — RLS, Storage, Master Tables, Demo Mode

## Root Cause Analysis

**School Creation Error**: The network logs show that the `authorization` header on POST requests to `/schools` contains the **anon key**, not a user JWT. This means either:
1. The user's session expired or was never properly established
2. The Supabase client is not attaching the authenticated user's JWT

The RLS policies themselves are correct (`has_role(auth.uid(), 'district_admin')`) but `auth.uid()` returns null when using the anon key, so the policy evaluates to false. The fix requires ensuring the client sends authenticated requests AND adding a fallback "ministry_admin can do ALL" policy that covers INSERT (current `is_admin()` ALL policy only checks `admin` role, not `ministry_admin`).

**Storage Upload (center-documents bucket)**: No INSERT/DELETE policies exist on `storage.objects` for the `center-documents` bucket. The `school-reports` bucket also lacks INSERT policies for authenticated users.

**Console Errors**: `DashboardStatCard` receives refs but doesn't use `forwardRef`, causing React warnings.

---

## Phase 1: Database Migration — Fix RLS & Add Master Tables

### 1A. Fix Schools RLS
- The existing `is_admin()` function only checks for `'admin'` role, not `'ministry_admin'`. The "Admins can manage schools" ALL policy works for `admin` but not `ministry_admin`. Fix by updating `is_admin()` to check both, OR add explicit ministry_admin policies.
- Verify `get_user_district()` and `get_user_province()` return the correct values for the logged-in user.

### 1B. Add Storage Policies
- `center-documents` bucket: Add INSERT policy for admin/ministry_admin roles, SELECT for all authenticated users, DELETE for admin/ministry_admin.
- `school-reports` bucket: Add INSERT policy scoped to school folder (`(storage.foldername(name))[1] = profile.school_id`).

### 1C. Create Master Province & District Tables
```sql
CREATE TABLE public.provinces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  province_id uuid REFERENCES public.provinces(id) ON DELETE CASCADE,
  code text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, province_id)
);
```
- Seed with Afghanistan's 34 provinces and key districts.
- Add RLS: SELECT for all authenticated, INSERT/UPDATE for admin/ministry_admin.
- Update `profiles`, `schools` tables to reference these tables (add `province_id`, `district_id` columns alongside existing text fields for backward compatibility).

### 1D. Fix `is_admin()` Function
Update to also check `ministry_admin`:
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'ministry_admin')
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
```

---

## Phase 2: Frontend Auth Fix

### 2A. Verify Session Attachment
The network requests show the anon key being used as the Bearer token. This means `supabase.auth.getSession()` is not returning a valid session. Investigate and fix:
- In `AuthContext.tsx`: After `loadUserData`, verify `session.access_token` is present and being sent.
- Add a debug guard in `DistrictSchools.tsx` mutation: check `session` before insert and show login prompt if missing.

### 2B. Guard All Mutation Pages
Add session check before every `.insert()` / `.update()` / `.upload()` call:
- `DistrictSchools.tsx` — check session before school insert
- `ManageSchools.tsx` — check session before school insert
- `AdminDocuments.tsx` — check session before upload and insert
- `SubmitReports.tsx` — check session before upload and insert
- `SubmitStatistics.tsx` — check session before insert
- `SubmitForms.tsx` — check session before insert

---

## Phase 3: Demo Mode — Internal Only

- Remove `/demo` link from the landing page and login page
- Keep the `/demo` route but gate it behind a check: only accessible if `import.meta.env.MODE === 'development'` or if the user is already logged in as admin/ministry_admin.
- Ensure demo mode never calls the real backend — all hooks should check `isDemoMode` and return mock data.

---

## Phase 4: Province/District Selectors

### 4A. Update SetupProfile
Replace the free-text `province` input with a `<Select>` populated from the `provinces` table. When a province is selected, populate a second `<Select>` with districts from the `districts` table filtered by `province_id`.

### 4B. Update District Schools Page
Auto-populate province/district from user profile (already done). No changes needed.

### 4C. Update ManageSchools (Ministry)
Add province/district selects populated from master tables instead of free text inputs.

---

## Phase 5: Fix Console Errors

### 5A. DashboardStatCard
The component is a function component that receives a ref from Recharts. Wrap it with `React.forwardRef` or remove the ref usage.

---

## Files to Create/Edit

| Action | File | Purpose |
|--------|------|---------|
| Migration | SQL | Fix `is_admin()`, add storage policies, create provinces/districts tables, seed data |
| Edit | `src/pages/district/Schools.tsx` | Add session guard before insert |
| Edit | `src/pages/admin/ManageSchools.tsx` | Add session guard, use master table selects |
| Edit | `src/pages/admin/Documents.tsx` | Add session guard before upload |
| Edit | `src/pages/school/SubmitReports.tsx` | Add session guard |
| Edit | `src/pages/school/SubmitStatistics.tsx` | Add session guard |
| Edit | `src/pages/school/SubmitForms.tsx` | Add session guard |
| Edit | `src/pages/SetupProfile.tsx` | Replace text inputs with master table selects |
| Edit | `src/pages/Demo.tsx` | Gate behind dev mode or admin role |
| Edit | `src/pages/Index.tsx` | Remove demo link for production |
| Edit | `src/pages/Login.tsx` | Remove demo link for production |
| Edit | `src/components/DashboardStatCard.tsx` | Add forwardRef |
| Edit | `src/contexts/AuthContext.tsx` | Add session validation logging |

## Implementation Order

1. Database migration (fix `is_admin()`, storage policies, master tables)
2. Frontend session guards (all mutation pages)
3. Province/district selectors (SetupProfile, ManageSchools)
4. Demo mode restriction
5. Console error fixes

