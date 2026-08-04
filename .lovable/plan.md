# Phase 3C — Student Registry & Enrollment

## Documentation check first

There is no phase roadmap file in the repository. The only roadmap artifact is the public `/roadmap` page (`src/pages/Roadmap.tsx`), which lists product-level items (notifications, offline PWA, Pashto) and was never updated for the Academic Management phases. The phase plan itself lives in the project history, and the code confirms the state:

- Academic tables in the database: `academic_years`, `grade_levels`, `sections`, `subjects`, `teacher_assignments` — all present.
- No `students` or `enrollments` table exists.
- `useAcademic.ts` returns `enrollment_count: 0` with the comment "Placeholder until the enrollment module lands", and `Sections.tsx` renders `enrollment_count / capacity` from that placeholder.

Discrepancy to note (not a blocker): `/roadmap` is stale relative to the delivered work. Recommend refreshing it as a small follow-up, not part of this phase.

## Phase 3B confirmed complete

Deliverables in place:
- `subjects` and `teacher_assignments` tables with school scoping, unique constraints, and `can_manage_academics` RLS.
- `useSubjects()`, `useSchoolTeachers()`, `useTeacherAssignments()` in `src/hooks/useAcademic.ts`.
- `src/pages/school/academic/Subjects.tsx` and `TeacherAssignments.tsx` with CRUD, filters, status badges.
- Sidebar entries in `SchoolLayout.tsx` and routes in `App.tsx`.

## Progress checklist

- ✅ Phase 1 — Auth, roles, submission workflow, schools, regions
- ✅ Phase 2 — Chat product experience
- ✅ Phase 2.5A/2.5B — Chat backend hardening (integrity, security, performance)
- ✅ Phase 3A — Academic years, grades, sections
- ✅ Phase 3B — Subjects, teacher assignments
- 🟨 Phase 3C — Student registry & enrollment (this phase)
- ⬜ Phase 3D — Attendance
- ⬜ Phase 3E — Grades/marks and report cards
- ⬜ Phase 4 — Academic data rollup into ministry submissions and analytics

Overall roadmap completion: about 62%.

## Why this is the next highest priority

Sections already display an enrollment count that is hardcoded to zero, so the academic structure is visibly incomplete until students exist. Every downstream module — attendance, marks, and the statistics the ministry actually collects — keys off a student record and its section enrollment. Building the registry now unblocks 3D and 3E; building anything else first would require reworking it.

## What will be built

### Database (one migration)
- `public.students` — `school_id`, `student_code`, `full_name`, `father_name`, `gender`, `date_of_birth`, `national_id`, `guardian_name`, `guardian_phone`, `address`, `status` (`active` / `archived`), timestamps.
- `public.enrollments` — `school_id`, `student_id`, `section_id`, `academic_year_id`, `enrollment_date`, `status` (`active` / `transferred` / `withdrawn` / `completed`), `notes`, timestamps.
- Unique: `student_code` per school; one active enrollment per student per academic year.
- Grants for `authenticated` and `service_role`, RLS enabled, policies mirroring the existing academic tables: read for school members, write via `can_manage_academics`.
- `updated_at` triggers on both tables.
- A capacity guard trigger on `enrollments` refusing an active enrollment when the section is already at `capacity`.

### Hooks — `src/hooks/useAcademic.ts`
- Add `Student`, `Enrollment` types plus `useStudents()` and `useEnrollments()`.
- Extend the `TableName` union so `useAcademicMutation` covers `students` and `enrollments` with no new mutation machinery.
- Replace the `enrollment_count: 0` placeholder in `useSections()` with a real count of active enrollments.

### UI
- `src/pages/school/academic/Students.tsx` — DataTable of students, search by name/code, filter by status and gender, create/edit dialog, archive action.
- `src/pages/school/academic/Enrollments.tsx` — enroll a student into a section for an academic year, filter by year/grade/section, status change, plus a section capacity indicator.
- Both follow the existing pattern in `Subjects.tsx`: Dari RTL labels, semantic tokens, `DataTable`, `Badge` variants, inline validation.

### Wiring
- `src/components/layouts/SchoolLayout.tsx` — two entries in the existing "مدیریت اکادمیک" group (شاگردان, ثبت‌نام).
- `src/App.tsx` — lazy routes `/school/academic/students` and `/school/academic/enrollments` under the same guards as the other academic routes.

## Files touched

| File | Reason |
| --- | --- |
| new migration | students + enrollments tables, grants, RLS, triggers |
| `src/hooks/useAcademic.ts` | new types/hooks, real enrollment counts |
| `src/pages/school/academic/Students.tsx` | new page |
| `src/pages/school/academic/Enrollments.tsx` | new page |
| `src/components/layouts/SchoolLayout.tsx` | sidebar entries |
| `src/App.tsx` | routes |
| `src/integrations/supabase/types.ts` | regenerated after migration |

## Dependencies and risks

- The migration must be approved and applied before the hooks compile against the new types — code work follows the migration, not alongside it.
- The section capacity trigger is the one behavioral risk: too strict and a legitimate enrollment is blocked. It will only apply to `status = 'active'` rows and will be tested against a full section.
- Changing `enrollment_count` from a constant to a real aggregate touches an already-shipped page (`Sections.tsx` reads it); the field name and type stay identical, so the page itself is not modified.
- Students are personal data on minors: no `anon` grant, read restricted to the owning school, and no realtime publication.

## Verification

1. `tsgo` type check.
2. Confirm tables, grants, policies, and triggers exist after the migration.
3. Exercise: create student, edit, archive, enroll into a section, hit the capacity limit, change enrollment status, confirm the sections page shows a real count.
