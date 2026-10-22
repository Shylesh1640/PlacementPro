-- PlacementPro Performance Indexes
-- Run after 001_initial_schema.sql

-- Students
create index if not exists idx_students_profile_id     on public.students(profile_id);
create index if not exists idx_students_department      on public.students(department);
create index if not exists idx_students_placement_status on public.students(placement_status);
create index if not exists idx_students_readiness_status on public.students(readiness_status);

-- Assessments & attempts
create index if not exists idx_attempts_student_id     on public.assessment_attempts(student_id);
create index if not exists idx_attempts_assessment_id  on public.assessment_attempts(assessment_id);
create index if not exists idx_answers_attempt_id      on public.attempt_answers(attempt_id);
create index if not exists idx_results_student_id      on public.assessment_results(student_id);

-- Readiness & skill gaps
create index if not exists idx_readiness_student_id    on public.readiness_scores(student_id);
create index if not exists idx_skillgap_student_id     on public.skill_gap_reports(student_id);
create index if not exists idx_sskills_student_id      on public.student_skills(student_id);

-- Jobs & matching
create index if not exists idx_jobs_company_id         on public.jobs(company_id);
create index if not exists idx_jobs_is_open            on public.jobs(is_open);
create index if not exists idx_matches_student_id      on public.job_matches(student_id);
create index if not exists idx_matches_job_id          on public.job_matches(job_id);
create index if not exists idx_matches_pct             on public.job_matches(match_percentage desc);

-- Applications & interviews
create index if not exists idx_apps_student_id         on public.applications(student_id);
create index if not exists idx_apps_job_id             on public.applications(job_id);
create index if not exists idx_apps_status             on public.applications(status);
create index if not exists idx_apps_connection_status  on public.applications(connection_status);
create index if not exists idx_interviews_student_id   on public.interviews(student_id);
create index if not exists idx_interviews_company_id   on public.interviews(company_id);
create index if not exists idx_interviews_scheduled_at on public.interviews(scheduled_at);

-- Proctoring
create index if not exists idx_pevents_attempt_id      on public.proctoring_events(attempt_id);
create index if not exists idx_pevents_severity        on public.proctoring_events(severity);
create index if not exists idx_pevents_reviewed        on public.proctoring_events(reviewed);

-- Notifications
create index if not exists idx_notifs_user_id          on public.notifications(user_id);
create index if not exists idx_notifs_is_read          on public.notifications(is_read);
create index if not exists idx_notifs_created_at       on public.notifications(created_at desc);

-- Companies
create index if not exists idx_companies_profile_id    on public.companies(profile_id);
create index if not exists idx_companies_verified      on public.companies(verified);
