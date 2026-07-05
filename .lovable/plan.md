# Smarter Platform + Demo Readiness

Scope covers four areas from your message. Signup/OTP work stays deferred until email domain is ready.

---

## 1) Smarter forms (Statistics submission)

Goal: reduce typing, catch mistakes early, auto-derive whatever can be computed.

Changes in `src/pages/school/SubmitStatistics.tsx`:

- **Auto-total students**: when male + female change, `total_students` fills automatically; the field becomes read-only with a small "محاسبه خودکار" badge. User can override by clicking an "ویرایش دستی" link (kept for edge cases).
- **Live derived KPIs** shown under the form (recomputed on every keystroke, memoized):
  - Ratio of students per teacher (`total_students / total_teachers`)
  - % female (`female / total * 100`)
  - Class-size warning if ratio > 40 (soft yellow banner, non-blocking)
- **Smart validation**: mismatch between typed total and male+female shows an inline hint with a one-click "اصلاح" button that resyncs — instead of the current hard error.
- **Number input polish**: strip non-digits, format thousands with Persian digits for display only, keep raw value in state.
- **Draft autosave** already exists via `useDraft`; add a "پاک کردن پیش‌نویس" button next to the header.

New tiny helper `src/lib/smartCalc.ts` for the derived fields so it can be reused later in Reports.

Out of scope this round: Reports and generic Forms auto-calc (per your answer).

---

## 2) Demo content + 6 test accounts + general-admin powers

### 2a. Test users (order: teacher → ministry)


| Email                                                         | Role                                   |
| ------------------------------------------------------------- | -------------------------------------- |
| [masoudsalik2024@gmail.com](mailto:masoudsalik2024@gmail.com) | ministry_admin (General Administrator) |
| [manotofaza@gmail.com](mailto:manotofaza@gmail.com)           | ministry_admin (secondary)             |
| [zahrasalik87@gmail.com](mailto:zahrasalik87@gmail.com)       | province_admin (Kabul)                 |
| [salikmasoud621@gmail.com](mailto:salikmasoud621@gmail.com)   | district_admin (Kabul → کابل ۱)        |
| [kateandrew78.20@gmail.com](mailto:kateandrew78.20@gmail.com) | principal (demo school)                |
| [salikmasoud1@gmail.com](mailto:salikmasoud1@gmail.com)       | teacher (demo school)                  |


Wait — your message said "in order, from teacher to ministry" with masoudsalik2024 as General Administrator. I'll map by that order:


| #   | Email                                                         | Role                                                                                                            |
| --- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | [salikmasoud1@gmail.com](mailto:salikmasoud1@gmail.com)       | teacher                                                                                                         |
| 2   | [kateandrew78.20@gmail.com](mailto:kateandrew78.20@gmail.com) | principal                                                                                                       |
| 3   | [salikmasoud621@gmail.com](mailto:salikmasoud621@gmail.com)   | district_admin                                                                                                  |
| 4   | [zahrasalik87@gmail.com](mailto:zahrasalik87@gmail.com)       | province_admin                                                                                                  |
| 5   | [manotofaza@gmail.com](mailto:manotofaza@gmail.com)           | country admin                                                                                                   |
| 6   | [masoudsalik2024@gmail.com](mailto:masoudsalik2024@gmail.com) | (General Administrator, full Developer powers -> can add or change anything as owner of platform and developer) |


If mapping is wrong, tell me before I run.

Implementation:

- New edge function `seed-demo-users` (service-role, one-shot, JWT-protected to ministry_admin OR gated by a one-time secret token). It:
  1. Creates each auth user via admin API with `email_confirm: true` and a per-account 16-char random password.
  2. Upserts `profiles` (full_name, province, district, school_id, status='verified', verified_at=now()).
  3. Inserts matching `user_roles` row.
  4. Returns the 6 email/password pairs as JSON — I'll paste them back to you once, in chat. Store in a temporary secret as backup too.
- I'll invoke the function once after deploy and hand you the credentials.

### 2b. General Administrator = ministry_admin + explicit school/province/district CRUD

The `ministry_admin` role already has broad access. Gaps to close:

- **Provinces/districts CRUD UI**: no current page. Add `src/pages/ministry/Regions.tsx` with two tabs (ولایت‌ها / ولسوالی‌ها), inline add/edit/delete, guarded by RLS.
- **Schools CRUD**: `ManageSchools.tsx` already has add. Add edit + soft-delete (toggle `is_active`) + real delete for ministry_admin only.
- RLS migration: allow `ministry_admin` full write on `provinces`, `districts`, `schools`. Currently only read is broad. Add policies + GRANT statements.

### 2c. Seed demo content (minimal, 1 of each)

Migration inserts:

- 1 `schools` row: "مکتب نمونه دموی کابل" in Kabul → کابل ۱ (used by teacher/principal accounts).
- 1 `announcements` row (visible to all).
- 1 `deadlines` row (30 days out).
- 1 `center_documents` row pointing to a placeholder file in `center-documents` bucket (uploaded via `storage_upload`).
- 1 `statistics_submissions` row (status='approved') so ministry dashboards show non-empty data.
- 1 `report_submissions` row (status='pending') so district inbox has something to approve.
- 1 `submission_comments` row on the pending submission.

All tagged with a `demo=true` marker in a comment column so easy to identify/remove later.

---

## 3) Complete provinces + districts

- Provinces: already 34 (verified). No change.
- Districts: currently only 50 rows. Afghanistan has ~421 official districts. New migration seeds the full list (Dari names) for all 34 provinces, using `ON CONFLICT (province_id, name) DO NOTHING` so existing rows are preserved.
- Every dropdown that today reads from `districts`/`provinces` (ManageSchools, SetupProfile, filters in Analytics, submission location fields) will show the full list automatically — no UI code change needed.

Source: standard Afghan administrative division (IEC 2019 baseline). List will be embedded in the migration.

---

## 4) Reliability sweep — fixable weak spots

Only shipping fixes that are quick and don't expand scope:

- **AdminLayout unused imports** (`useAuth` imported but not used) — clean up small dead code across `AdminLayout`, `MinistryLayout` to prevent warnings.
- **ManageSchools search**: LTR icon offset (`left-3`) inside RTL — flip to `right-3` and `pr-10`. Small but visible bug.
- `**fetchSchools` errors are swallowed** — add toast on error.
- `**schools.province/district` are free-text** while master tables exist — populate `school_id` foreign-key path stays, but add a soft check that warns when a school's province/district doesn't match a master row (helps ministry_admin clean data). Non-blocking.
- **Realtime enablement** for `announcements` and `deadlines` so newly seeded rows appear without refresh (already done for submissions).
- **Empty-state polish** on `Ministry/Users.tsx`, `Ministry/Provinces.tsx` when 0 rows.
- **Console errors from `useEffect` racing on unmount** in `Dashboard.tsx` (school + admin) — wrap async in cancel-guard.

Anything larger (auth flow rewrite, WelcomeGuide, offline sync) stays deferred.

---

## Technical notes

**Migrations (in order):**

1. `xxxxx_regions_rls.sql` — add write policies + GRANTs for ministry_admin on provinces/districts/schools.
2. `xxxxx_seed_districts_full.sql` — full 421-district seed with `ON CONFLICT DO NOTHING`.
3. `xxxxx_demo_content.sql` — announcements/deadlines/documents/submissions demo rows (school seeded first inside same migration).

**Edge function:**

- `supabase/functions/seed-demo-users/index.ts` — POST, requires `x-seed-token` header matching a new `DEMO_SEED_TOKEN` secret (I'll generate). Idempotent: skips if email already exists, returns existing IDs.

**New files:**

- `src/pages/ministry/Regions.tsx` (provinces + districts CRUD)
- `src/lib/smartCalc.ts` (auto-total, ratios)
- Route added to `App.tsx`, nav item added to `MinistryLayout.tsx` under مدیریت.

**Edited files:**

- `src/pages/school/SubmitStatistics.tsx` (auto-calc + smart validation)
- `src/pages/admin/ManageSchools.tsx` (edit/delete, RTL search fix, error toast)
- `src/components/layouts/AdminLayout.tsx`, `MinistryLayout.tsx` (cleanups, Regions nav)
- `src/pages/school/Dashboard.tsx`, `src/pages/admin/Dashboard.tsx` (cancel-guard)

**Not doing this round** (from your prior answers): number-match signup, OTP forgot-password, email domain setup, Reports/Forms auto-calc.

---

## Rollout order

1. Migrations (regions RLS → districts seed → demo content).
2. `seed-demo-users` edge function + deploy + invoke → paste you the 6 credentials.
3. Regions page + ManageSchools upgrades.
4. Smart Statistics form.
5. Reliability sweep.
6. Playwright smoke test: log in as each of the 6 accounts, verify each dashboard loads.

Approve to build, or tell me what to change (role mapping, seed volume, extra pages).