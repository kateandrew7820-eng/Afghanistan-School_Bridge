# Phase 3F: Close Out 3C, Clean House, then Student Profile

The audit found the repository structurally sound but **not clean**: Phase 3C has unfinished wiring, and ~3,100 lines of superseded code remain. This plan finishes 3C, removes the dead code, and then adds the next logical feature.

No database migration is required at any step. All existing tables, RLS policies, and schema stay untouched.

## Step 1 — Finish Phase 3C (the blocker)

`Enrollments.tsx` is fully built and already lazy-imported in `App.tsx`, but has no route and no sidebar link, so no one can reach it. Enrolling a student into a section is currently impossible through the UI even though Attendance and Report Cards both depend on enrollment records existing.

- `src/App.tsx` — add the `/school/academic/enrollments` route, matching the surrounding pattern (`ProtectedRoute` + `SchoolLayout` + `Suspense`). The import already exists.
- `src/components/layouts/SchoolLayout.tsx` — add the sidebar entry "ثبت‌نام شاگردان" between "شاگردان" and "حاضری".

## Step 2 — Remove dead code

Nine superseded pages/layouts, four unused components, two unused hooks. Every one confirmed to have zero importers. Deletions only; no rewrites.

Pages and layouts:
- `src/pages/school/SubmitForms.tsx`, `SubmitReports.tsx`, `SubmitStatistics.tsx` (replaced by `Submit.tsx` tabs)
- `src/pages/district/Submissions.tsx`, `src/pages/district/VerifyData.tsx` (replaced by `district/Inbox.tsx`)
- `src/pages/province/Submissions.tsx` (replaced by `province/Inbox.tsx`)
- `src/pages/admin/Dashboard.tsx`, `src/pages/admin/Submissions.tsx` (`/admin/*` redirects to `/ministry`)
- `src/components/layouts/AdminLayout.tsx`

Components and hooks:
- `src/components/DashboardCards.tsx`, `SubmissionStatusCard.tsx`, `Breadcrumb.tsx`, `SignupProgress.tsx`
- `src/hooks/useRecentItems.ts`, `src/hooks/useSmartNotifications.ts`

Kept deliberately: `admin/Announcements.tsx`, `admin/Documents.tsx`, `admin/Deadlines.tsx`, `admin/ManageSchools.tsx` are live under `/ministry/*`. The legacy redirect routes stay for back-compat.

## Step 3 — Student Profile page (the new phase)

This is the correct next phase because every academic table now exists and is populated through the UI, but the data is only viewable **per-section**: attendance by section-day, marks by assessment, report cards by section. There is no way to answer "how is this one student doing?" — the question a principal or teacher actually asks. It composes existing hooks rather than adding logic, and it is the natural consumer of 3C/3D/3E.

New route `/school/academic/students/:studentId`, reached by clicking a row in the existing Students table.

Four sections, all reusing current patterns:
- **Header** — name, student code, status badge, current section/grade, guardian contact. Uses `PageHeader` and `StatusBadge`.
- **Attendance summary** — present/absent/late/excused totals and rate for the active year, with a `Sparkline` trend.
- **Academic performance** — per-subject weighted averages and overall percentage, with the same colour-coded grade bands as `ReportCards.tsx`.
- **Enrollment history** — `Timeline` of enrollment records across academic years.

## Technical notes

- New file: `src/pages/school/academic/StudentProfile.tsx`.
- Modified: `src/App.tsx` (two routes), `src/components/layouts/SchoolLayout.tsx` (one sidebar entry), `src/pages/school/academic/Students.tsx` (make rows navigate to the profile).
- `src/hooks/useAcademic.ts` gains one hook, `useStudentProfile(studentId)`, that composes the existing per-student queries. The grade-band and weighted-average logic already living in `useReportCard` is reused, not duplicated — extracted to a shared helper only if that is needed to avoid a second copy.
- No migration. Reads go through existing RLS: `students`, `enrollments`, `attendance_records`, `marks`, and `assessments` are all already scoped by `school_id` for teachers and principals, so a school user can only load students from their own school.
- Dari RTL, existing design tokens, TypeScript strict throughout.
- Closing checks: typecheck and lint, fixing anything the new work introduces.

## Roadmap after this

- ✅ Phases 1, 2, 2.5A/B, 3A, 3B, 3D, 3E
- 🟨 Phase 3C — closed by Step 1
- 🟨 Phase 3F — cleanup + Student Profile (this plan)
- ⬜ Phase 4 — academic data rollup into district/province/ministry dashboards

Separately noted, not included here: the `signup_challenges` table is orphaned schema with no code referencing it. Removing it is a database change and belongs in its own decision, so I have left it alone.
