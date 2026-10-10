# Academic administrative rollups

The district, province, and ministry dashboards use the `get_academic_admin_rollup` RPC. The RPC scopes schools from the authenticated profile/role and hierarchy tables; the client does not select administrative records directly. From ministry, a province comparison can be opened to inspect its districts, then a district to inspect its schools. Province users can drill into districts and schools within their assigned province. District users see their own schools. The RPC validates the caller's role and scope on every drill-down request.

## Data sources and metric definitions

- School population and attendance use the **latest approved statistics submission per school and academic year**. With no academic-year filter, each school contributes its latest available approved year. Schools without an approved report remain in the comparison with zero reported students and `reportingSchools = 0`.
- Enrollment totals and the male/female breakdown are the values in that statistics snapshot. Gender filtering changes the displayed student count; attendance and assessment scores are not gender-disaggregated by the available source records.
- Attendance is the student-count-weighted mean of reported attendance percentages. For a selected year, the comparison is against each school's nearest earlier available approved year; without a year filter, it is against the second-latest available year. The decline alert counts schools whose attendance is at least five percentage points lower than that prior report. It is a comparison of snapshots, not a time-series trend.
- Assessment average is the arithmetic mean of numeric `score` values on approved `student_assessment` form submissions whose `academic_year` matches the chosen statistics snapshot for that school, weighted by submission count at higher levels. Forms without an academic-year field cannot be reliably aligned and are excluded. A subject filter is supported. Scores are not normalized across different scales; this is not a pass rate or standardized grade average.
- `reportingSchools` counts schools with approved statistics for the selected snapshot year. `totalSchools` counts active schools in the corresponding administrative scope.

These existing submissions do not provide reliable dropped-student, tardy, per-student transfer, grade-level, or per-record attendance measures. Those metrics and true longitudinal academic-decline alerts are intentionally not inferred.

## Cache and performance

The migration maintains `academic_school_year_rollups`, a private, derived cache with one latest-approved statistics snapshot per school/year. A trigger refreshes it when a statistics submission changes, and the migration backfills existing approved submissions. Indexes support the cache refresh and assessment aggregation. The admin RPC returns only summary/group aggregates and filter options.

## Migration and rollback

Apply `supabase/migrations/20261010210000_academic_admin_rollups.sql` through the normal Supabase migration workflow. It does not alter or delete source submissions; the cache is reconstructible from approved statistics submissions.

To roll back the feature, first remove the RPC and trigger, then its helper/cache and indexes:

```sql
DROP FUNCTION IF EXISTS public.get_academic_admin_rollup(text, text, text, text, text, text);
DROP TRIGGER IF EXISTS trg_sync_academic_school_year_rollup ON public.statistics_submissions;
DROP FUNCTION IF EXISTS public.sync_academic_school_year_rollup();
DROP FUNCTION IF EXISTS public.refresh_academic_school_year_rollup(uuid, text);
DROP TABLE IF EXISTS public.academic_school_year_rollups;
DROP INDEX IF EXISTS public.statistics_rollup_source_idx;
DROP INDEX IF EXISTS public.academic_assessment_rollup_idx;
```

The rollback leaves all source submissions untouched. The application dashboard requires this migration to be deployed; a missing RPC is reported as an explicit retryable dashboard error.
