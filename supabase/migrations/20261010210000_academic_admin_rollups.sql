CREATE INDEX IF NOT EXISTS statistics_rollup_source_idx
  ON public.statistics_submissions (school_id, academic_year, updated_at DESC, created_at DESC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS academic_assessment_rollup_idx
  ON public.form_submissions (school_id, form_type, status, created_at DESC);

CREATE TABLE public.academic_school_year_rollups (
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year text NOT NULL,
  submission_id uuid NOT NULL UNIQUE REFERENCES public.statistics_submissions(id) ON DELETE CASCADE,
  total_students integer NOT NULL DEFAULT 0,
  male_students integer NOT NULL DEFAULT 0,
  female_students integer NOT NULL DEFAULT 0,
  attendance_rate numeric(5, 2),
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (school_id, academic_year)
);
CREATE INDEX academic_school_year_rollups_year_idx
  ON public.academic_school_year_rollups (academic_year, school_id);
ALTER TABLE public.academic_school_year_rollups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_school_year_rollups FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.refresh_academic_school_year_rollup(_school_id uuid, _academic_year text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.academic_school_year_rollups
  WHERE school_id = _school_id AND academic_year = _academic_year;

  INSERT INTO public.academic_school_year_rollups (
    school_id, academic_year, submission_id, total_students,
    male_students, female_students, attendance_rate, updated_at
  )
  SELECT
    stats.school_id,
    stats.academic_year,
    stats.id,
    greatest(coalesce(stats.total_students, 0), 0),
    greatest(coalesce(stats.male_students, 0), 0),
    greatest(coalesce(stats.female_students, 0), 0),
    stats.attendance_rate,
    stats.updated_at
  FROM public.statistics_submissions AS stats
  WHERE stats.school_id = _school_id
    AND stats.academic_year = _academic_year
    AND stats.status = 'approved'
  ORDER BY stats.updated_at DESC, stats.created_at DESC
  LIMIT 1;
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_academic_school_year_rollup(uuid, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.sync_academic_school_year_rollup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP <> 'INSERT' THEN
    PERFORM public.refresh_academic_school_year_rollup(OLD.school_id, OLD.academic_year);
  END IF;
  IF TG_OP <> 'DELETE'
     AND (TG_OP = 'INSERT' OR OLD.school_id IS DISTINCT FROM NEW.school_id
       OR OLD.academic_year IS DISTINCT FROM NEW.academic_year) THEN
    PERFORM public.refresh_academic_school_year_rollup(NEW.school_id, NEW.academic_year);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.refresh_academic_school_year_rollup(NEW.school_id, NEW.academic_year);
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_academic_school_year_rollup() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_sync_academic_school_year_rollup
AFTER INSERT OR UPDATE OR DELETE ON public.statistics_submissions
FOR EACH ROW EXECUTE FUNCTION public.sync_academic_school_year_rollup();

INSERT INTO public.academic_school_year_rollups (
  school_id, academic_year, submission_id, total_students,
  male_students, female_students, attendance_rate, updated_at
)
SELECT DISTINCT ON (stats.school_id, stats.academic_year)
  stats.school_id,
  stats.academic_year,
  stats.id,
  greatest(coalesce(stats.total_students, 0), 0),
  greatest(coalesce(stats.male_students, 0), 0),
  greatest(coalesce(stats.female_students, 0), 0),
  stats.attendance_rate,
  stats.updated_at
FROM public.statistics_submissions AS stats
WHERE stats.status = 'approved'
ORDER BY stats.school_id, stats.academic_year, stats.updated_at DESC, stats.created_at DESC
ON CONFLICT (school_id, academic_year) DO UPDATE SET
  submission_id = excluded.submission_id,
  total_students = excluded.total_students,
  male_students = excluded.male_students,
  female_students = excluded.female_students,
  attendance_rate = excluded.attendance_rate,
  updated_at = excluded.updated_at;

CREATE OR REPLACE FUNCTION public.get_academic_admin_rollup(
  _level text,
  _academic_year text DEFAULT NULL,
  _gender text DEFAULT 'all',
  _subject text DEFAULT NULL,
  _province text DEFAULT NULL,
  _district text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller uuid := auth.uid();
  user_district text;
  user_province text;
  user_district_id uuid;
  user_province_id uuid;
  result jsonb;
BEGIN
  IF caller IS NULL OR _level IS NULL OR _gender IS NULL
     OR _level NOT IN ('district', 'province', 'ministry')
     OR _gender NOT IN ('all', 'male', 'female') THEN
    RAISE EXCEPTION 'Invalid academic rollup request.' USING ERRCODE = '22023';
  END IF;

  SELECT profile.district, profile.province, profile.district_id, profile.province_id
  INTO user_district, user_province, user_district_id, user_province_id
  FROM public.profiles AS profile
  WHERE profile.user_id = caller;

  IF _level = 'district' AND NOT (
    (public.has_role(caller, 'district_admin')
      AND user_district IS NOT NULL AND btrim(user_district) <> ''
      AND (_district IS NULL OR _district = user_district OR _district = user_district_id::text))
    OR (public.has_role(caller, 'province_admin')
      AND user_province IS NOT NULL AND btrim(user_province) <> '' AND _district IS NOT NULL)
    OR ((public.has_role(caller, 'admin') OR public.has_role(caller, 'ministry_admin'))
      AND _province IS NOT NULL AND _district IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'District academic rollups are not available to this account or scope.' USING ERRCODE = '42501';
  ELSIF _level = 'province' AND NOT (
    (public.has_role(caller, 'province_admin')
      AND user_province IS NOT NULL AND btrim(user_province) <> ''
      AND (_province IS NULL OR _province = user_province OR _province = user_province_id::text))
    OR ((public.has_role(caller, 'admin') OR public.has_role(caller, 'ministry_admin'))
      AND _province IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'Province academic rollups are not available to this account or scope.' USING ERRCODE = '42501';
  ELSIF _level = 'ministry' AND NOT (
    public.has_role(caller, 'admin') OR public.has_role(caller, 'ministry_admin')
  ) THEN
    RAISE EXCEPTION 'National academic rollups are not available to this account.' USING ERRCODE = '42501';
  END IF;

  IF (_academic_year IS NOT NULL AND length(_academic_year) > 30)
     OR (_subject IS NOT NULL AND length(_subject) > 100)
     OR (_province IS NOT NULL AND length(_province) > 100)
     OR (_district IS NOT NULL AND length(_district) > 100) THEN
    RAISE EXCEPTION 'Invalid academic rollup filter.' USING ERRCODE = '22023';
  END IF;

  WITH scoped_schools AS MATERIALIZED (
    SELECT
      school.id,
      school.name,
      coalesce(district.name, school.district, 'ولسوالی نامشخص') AS district_name,
      coalesce(province.name, school.province, 'ولایت نامشخص') AS province_name
    FROM public.schools AS school
    LEFT JOIN public.districts AS district ON district.id = school.district_id
    LEFT JOIN public.provinces AS province
      ON province.id = coalesce(school.province_id, district.province_id)
    WHERE coalesce(school.is_active, true)
      AND (
        (_level = 'ministry')
        OR (_level = 'province' AND (
          (public.has_role(caller, 'province_admin') AND (
            (user_province_id IS NOT NULL AND coalesce(school.province_id, district.province_id) = user_province_id)
            OR (school.province_id IS NULL AND district.province_id IS NULL AND school.province = user_province)
          ))
          OR ((public.has_role(caller, 'admin') OR public.has_role(caller, 'ministry_admin'))
            AND _province IS NOT NULL)
        ))
        OR (_level = 'district' AND (
          (public.has_role(caller, 'district_admin') AND (
            (user_district_id IS NOT NULL AND school.district_id = user_district_id)
            OR (school.district_id IS NULL AND school.district = user_district
              AND (user_province IS NULL OR school.province = user_province))
          ))
          OR (public.has_role(caller, 'province_admin') AND _district IS NOT NULL AND (
            (user_province_id IS NOT NULL AND coalesce(school.province_id, district.province_id) = user_province_id)
            OR (school.province_id IS NULL AND district.province_id IS NULL AND school.province = user_province)
          ))
          OR ((public.has_role(caller, 'admin') OR public.has_role(caller, 'ministry_admin'))
            AND _province IS NOT NULL AND _district IS NOT NULL)
        ))
      )
      AND (_province IS NULL OR coalesce(province.name, school.province) = _province
        OR province.id::text = _province OR school.province_id::text = _province
        OR district.province_id::text = _province)
      AND (_district IS NULL OR coalesce(district.name, school.district) = _district
        OR district.id::text = _district OR school.district_id::text = _district)
  ),
  period_options AS (
    SELECT coalesce(jsonb_agg(years.academic_year ORDER BY years.academic_year DESC), '[]'::jsonb) AS years
    FROM (
      SELECT DISTINCT rollup.academic_year
      FROM public.academic_school_year_rollups AS rollup
      JOIN scoped_schools AS school ON school.id = rollup.school_id
    ) AS years
  ),
  ranked_periods AS (
    SELECT
      rollup.*,
      school.name,
      school.district_name,
      school.province_name,
      row_number() OVER (
        PARTITION BY rollup.school_id
        ORDER BY rollup.academic_year DESC, rollup.updated_at DESC
      ) AS period_rank
    FROM public.academic_school_year_rollups AS rollup
    JOIN scoped_schools AS school ON school.id = rollup.school_id
  ),
  current_period AS (
    SELECT *
    FROM ranked_periods
    WHERE (_academic_year IS NULL AND period_rank = 1)
      OR (_academic_year IS NOT NULL AND academic_year = _academic_year)
  ),
  previous_period AS (
    SELECT
      snapshot.school_id,
      previous.academic_year,
      previous.attendance_rate,
      previous.total_students
    FROM current_period AS snapshot
    LEFT JOIN LATERAL (
      SELECT rollup.academic_year, rollup.attendance_rate, rollup.total_students
      FROM public.academic_school_year_rollups AS rollup
      WHERE rollup.school_id = snapshot.school_id
        AND rollup.academic_year < snapshot.academic_year
      ORDER BY rollup.academic_year DESC
      LIMIT 1
    ) AS previous ON true
  ),
  assessments AS (
    SELECT
      form.school_id,
      avg((form.form_data->>'score')::numeric) AS average_score,
      count(*) AS assessment_count
    FROM public.form_submissions AS form
    JOIN scoped_schools AS school ON school.id = form.school_id
    JOIN current_period AS snapshot
      ON snapshot.school_id = form.school_id
      AND snapshot.academic_year = form.form_data->>'academic_year'
    WHERE form.form_type = 'student_assessment'
      AND form.status = 'approved'
      AND coalesce(form.form_data->>'score', '') ~ '^-?[0-9]+([.][0-9]+)?$'
      AND (_subject IS NULL OR form.form_data->>'subject' = _subject)
    GROUP BY form.school_id
  ),
  subject_options AS (
    SELECT coalesce(jsonb_agg(subjects.subject ORDER BY subjects.subject), '[]'::jsonb) AS subjects
    FROM (
      SELECT DISTINCT form.form_data->>'subject' AS subject
      FROM public.form_submissions AS form
      JOIN scoped_schools AS school ON school.id = form.school_id
      JOIN current_period AS snapshot
        ON snapshot.school_id = form.school_id
        AND snapshot.academic_year = form.form_data->>'academic_year'
      WHERE form.form_type = 'student_assessment'
        AND form.status = 'approved'
        AND nullif(form.form_data->>'subject', '') IS NOT NULL
      ORDER BY form.form_data->>'subject'
      LIMIT 100
    ) AS subjects
  ),
  school_metrics AS (
    SELECT
      snapshot.school_id,
      snapshot.name,
      snapshot.district_name,
      snapshot.province_name,
      snapshot.academic_year,
      CASE _gender
        WHEN 'male' THEN snapshot.male_students
        WHEN 'female' THEN snapshot.female_students
        ELSE snapshot.total_students
      END AS students,
      snapshot.total_students,
      snapshot.male_students,
      snapshot.female_students,
      snapshot.attendance_rate,
      previous.attendance_rate AS previous_attendance_rate,
      previous.total_students AS previous_total_students,
      coalesce(assessments.average_score, 0) AS average_score,
      coalesce(assessments.assessment_count, 0) AS assessment_count
    FROM current_period AS snapshot
    LEFT JOIN previous_period AS previous ON previous.school_id = snapshot.school_id
    LEFT JOIN assessments ON assessments.school_id = snapshot.school_id
  ),
  group_metrics AS (
    SELECT
      CASE _level
        WHEN 'district' THEN school.id::text
        WHEN 'province' THEN school.district_name
        ELSE school.province_name
      END AS group_id,
      CASE _level
        WHEN 'district' THEN school.name
        WHEN 'province' THEN school.district_name
        ELSE school.province_name
      END AS label,
      count(*) FILTER (WHERE metrics.school_id IS NOT NULL)::bigint AS reporting_schools,
      count(*)::bigint AS total_schools,
      coalesce(sum(metrics.students), 0)::bigint AS students,
      coalesce(sum(metrics.male_students), 0)::bigint AS male_students,
      coalesce(sum(metrics.female_students), 0)::bigint AS female_students,
      CASE WHEN sum(metrics.total_students) FILTER (WHERE metrics.attendance_rate IS NOT NULL) > 0
        THEN sum(metrics.attendance_rate * metrics.total_students) FILTER (WHERE metrics.attendance_rate IS NOT NULL)
          / sum(metrics.total_students) FILTER (WHERE metrics.attendance_rate IS NOT NULL)
        ELSE NULL END AS attendance_rate,
      CASE WHEN sum(metrics.previous_total_students) FILTER (WHERE metrics.previous_attendance_rate IS NOT NULL) > 0
        THEN sum(metrics.previous_attendance_rate * metrics.previous_total_students) FILTER (WHERE metrics.previous_attendance_rate IS NOT NULL)
          / sum(metrics.previous_total_students) FILTER (WHERE metrics.previous_attendance_rate IS NOT NULL)
        ELSE NULL END AS previous_attendance_rate,
      CASE WHEN sum(metrics.assessment_count) > 0
        THEN sum(metrics.average_score * metrics.assessment_count) / sum(metrics.assessment_count)
        ELSE NULL END AS average_score,
      coalesce(sum(metrics.assessment_count), 0)::bigint AS assessment_count,
      count(*) FILTER (
        WHERE metrics.attendance_rate IS NOT NULL AND metrics.previous_attendance_rate IS NOT NULL
          AND metrics.attendance_rate <= metrics.previous_attendance_rate - 5
      )::bigint AS declining_schools
    FROM scoped_schools AS school
    LEFT JOIN school_metrics AS metrics ON metrics.school_id = school.id
    GROUP BY 1, 2
  ),
  summary AS (
    SELECT
      count(*) FILTER (WHERE snapshot.school_id IS NOT NULL)::bigint AS reporting_schools,
      (SELECT count(*) FROM scoped_schools)::bigint AS total_schools,
      coalesce(sum(CASE _gender
        WHEN 'male' THEN snapshot.male_students
        WHEN 'female' THEN snapshot.female_students
        ELSE snapshot.total_students
      END), 0)::bigint AS students,
      coalesce(sum(snapshot.male_students), 0)::bigint AS male_students,
      coalesce(sum(snapshot.female_students), 0)::bigint AS female_students,
      CASE WHEN sum(snapshot.total_students) FILTER (WHERE snapshot.attendance_rate IS NOT NULL) > 0
        THEN sum(snapshot.attendance_rate * snapshot.total_students) FILTER (WHERE snapshot.attendance_rate IS NOT NULL)
          / sum(snapshot.total_students) FILTER (WHERE snapshot.attendance_rate IS NOT NULL)
        ELSE NULL END AS attendance_rate,
      CASE WHEN sum(previous.total_students) FILTER (WHERE previous.attendance_rate IS NOT NULL) > 0
        THEN sum(previous.attendance_rate * previous.total_students) FILTER (WHERE previous.attendance_rate IS NOT NULL)
          / sum(previous.total_students) FILTER (WHERE previous.attendance_rate IS NOT NULL)
        ELSE NULL END AS previous_attendance_rate,
      CASE WHEN sum(assessments.assessment_count) > 0
        THEN sum(assessments.average_score * assessments.assessment_count) / sum(assessments.assessment_count)
        ELSE NULL END AS average_score,
      coalesce(sum(assessments.assessment_count), 0)::bigint AS assessment_count,
      count(*) FILTER (
        WHERE snapshot.attendance_rate IS NOT NULL AND previous.attendance_rate IS NOT NULL
          AND snapshot.attendance_rate <= previous.attendance_rate - 5
      )::bigint AS declining_schools
    FROM scoped_schools AS school
    LEFT JOIN current_period AS snapshot ON snapshot.school_id = school.id
    LEFT JOIN previous_period AS previous ON previous.school_id = school.id
    LEFT JOIN assessments ON assessments.school_id = school.id
  )
  SELECT jsonb_build_object(
    'level', _level,
    'academicYear', _academic_year,
    'years', period_options.years,
    'subjects', subject_options.subjects,
    'summary', jsonb_build_object(
      'totalSchools', summary.total_schools,
      'reportingSchools', summary.reporting_schools,
      'students', summary.students,
      'maleStudents', summary.male_students,
      'femaleStudents', summary.female_students,
      'attendanceRate', round(summary.attendance_rate, 1),
      'previousAttendanceRate', round(summary.previous_attendance_rate, 1),
      'averageScore', round(summary.average_score, 1),
      'assessmentCount', summary.assessment_count,
      'decliningSchools', summary.declining_schools
    ),
    'groups', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', group_metrics.group_id,
        'label', group_metrics.label,
        'totalSchools', group_metrics.total_schools,
        'reportingSchools', group_metrics.reporting_schools,
        'students', group_metrics.students,
        'maleStudents', group_metrics.male_students,
        'femaleStudents', group_metrics.female_students,
        'attendanceRate', round(group_metrics.attendance_rate, 1),
        'previousAttendanceRate', round(group_metrics.previous_attendance_rate, 1),
        'averageScore', round(group_metrics.average_score, 1),
        'assessmentCount', group_metrics.assessment_count,
        'decliningSchools', group_metrics.declining_schools
      ) ORDER BY group_metrics.attendance_rate ASC NULLS LAST, group_metrics.label)
      FROM group_metrics
    ), '[]'::jsonb)
  )
  INTO result
  FROM summary
  CROSS JOIN period_options
  CROSS JOIN subject_options;

  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_academic_admin_rollup(text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_academic_admin_rollup(text, text, text, text, text, text) TO authenticated;
