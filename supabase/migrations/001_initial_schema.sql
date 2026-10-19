-- PlacementPro Initial Schema v3
-- Simple RLS: no subqueries, no cross-table comparisons, no uuid/text ambiguity

create extension if not exists "uuid-ossp";

-- ── PROFILES (created first so helper functions can reference it) ──
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  full_name  text not null,
  role       text not null default 'student' check (role in ('student','admin','partner')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Security helpers (SECURITY DEFINER, defined after profiles table exists)
-- Using plpgsql so body is validated at call-time, not creation-time.
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return coalesce(
    (select true from public.profiles where id = auth.uid() and role = 'admin' limit 1),
    false
  );
end;
$$;

create or replace function public.is_partner()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return coalesce(
    (select true from public.profiles where id = auth.uid() and role = 'partner' limit 1),
    false
  );
end;
$$;

-- Now enable RLS + policies on profiles
alter table public.profiles enable row level security;
create policy "profiles_own"   on public.profiles for all using (id = auth.uid());
create policy "profiles_admin" on public.profiles for all using (public.is_admin());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as
$$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'role','student')
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── STUDENTS ─────────────────────────────────────────────────
create table if not exists public.students (
  id                uuid primary key default uuid_generate_v4(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  student_id        text unique,
  department        text not null default '',
  cgpa              numeric(4,2) default 0 check (cgpa >= 0 and cgpa <= 10),
  tenth_percent     numeric(5,2) default 0,
  twelfth_percent   numeric(5,2) default 0,
  backlogs          integer default 0,
  contact_phone     text,
  contact_address   text,
  resume_url        text,
  readiness_score   numeric(5,2),
  readiness_status  text check (readiness_status in ('placement_ready','needs_improvement','at_risk')),
  proctoring_status text default 'normal' check (proctoring_status in ('normal','review_required','flagged')),
  placement_status  text default 'pending' check (placement_status in ('pending','assessment_completed','matched','interview_scheduled','interview_completed','placed')),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
alter table public.students enable row level security;
create policy "students_own"   on public.students for all using (profile_id = auth.uid());
create policy "students_admin" on public.students for all using (public.is_admin());

-- ── SKILLS ───────────────────────────────────────────────────
create table if not exists public.skills (
  id       uuid primary key default uuid_generate_v4(),
  name     text not null unique,
  category text default 'technical'
);
alter table public.skills enable row level security;
create policy "skills_read"  on public.skills for select using (true);
create policy "skills_write" on public.skills for all    using (auth.uid() is not null);

create table if not exists public.student_skills (
  id                uuid primary key default uuid_generate_v4(),
  student_id        uuid not null references public.students(id) on delete cascade,
  skill_id          uuid not null references public.skills(id),
  proficiency_level text default 'intermediate' check (proficiency_level in ('beginner','intermediate','advanced')),
  unique(student_id, skill_id)
);
alter table public.student_skills enable row level security;
create policy "sskills_all" on public.student_skills for all using (auth.uid() is not null);

-- ── PROJECTS ─────────────────────────────────────────────────
create table if not exists public.projects (
  id           uuid primary key default uuid_generate_v4(),
  student_id   uuid not null references public.students(id) on delete cascade,
  title        text not null,
  description  text,
  technologies text[],
  url          text,
  created_at   timestamptz default now()
);
alter table public.projects enable row level security;
create policy "projects_all" on public.projects for all using (auth.uid() is not null);

-- ── INTERNSHIPS ──────────────────────────────────────────────
create table if not exists public.internships (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid not null references public.students(id) on delete cascade,
  company         text not null,
  role            text not null,
  duration_months integer,
  completed       boolean default false,
  start_date      date,
  end_date        date
);
alter table public.internships enable row level security;
create policy "intern_all" on public.internships for all using (auth.uid() is not null);

-- ── CERTIFICATIONS ───────────────────────────────────────────
create table if not exists public.certifications (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid not null references public.students(id) on delete cascade,
  name            text not null,
  issuer          text,
  issue_date      date,
  certificate_url text
);
alter table public.certifications enable row level security;
create policy "certs_all" on public.certifications for all using (auth.uid() is not null);

-- ── QUESTION BANK ────────────────────────────────────────────
create table if not exists public.question_bank (
  id             uuid primary key default uuid_generate_v4(),
  question       text not null,
  option_a       text not null,
  option_b       text not null,
  option_c       text not null,
  option_d       text not null,
  correct_answer text not null check (correct_answer in ('A','B','C','D')),
  topic          text not null,
  difficulty     text not null check (difficulty in ('easy','medium','hard')),
  category       text not null check (category in ('aptitude','programming','communication')),
  created_at     timestamptz default now()
);
alter table public.question_bank enable row level security;
create policy "qb_read"  on public.question_bank for select using (auth.uid() is not null);
create policy "qb_admin" on public.question_bank for all    using (public.is_admin());

-- ── ASSESSMENTS ──────────────────────────────────────────────
create table if not exists public.assessments (
  id                   uuid primary key default uuid_generate_v4(),
  title                text not null,
  description          text,
  category             text not null check (category in ('aptitude','programming','communication')),
  duration_minutes     integer not null default 60,
  total_marks          integer not null default 100,
  pass_marks           integer not null default 40,
  is_active            boolean default true,
  eligible_departments text[] default '{}',
  created_at           timestamptz default now()
);
alter table public.assessments enable row level security;
create policy "assess_read"  on public.assessments for select using (auth.uid() is not null);
create policy "assess_admin" on public.assessments for all    using (public.is_admin());

-- ── ASSESSMENT QUESTIONS ─────────────────────────────────────
create table if not exists public.assessment_questions (
  id            uuid primary key default uuid_generate_v4(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  question_id   uuid not null references public.question_bank(id),
  order_index   integer,
  unique(assessment_id, question_id)
);
alter table public.assessment_questions enable row level security;
create policy "aq_all" on public.assessment_questions for all using (auth.uid() is not null);

-- ── ASSESSMENT ATTEMPTS ──────────────────────────────────────
create table if not exists public.assessment_attempts (
  id            uuid primary key default uuid_generate_v4(),
  assessment_id uuid not null references public.assessments(id),
  student_id    uuid not null references public.students(id) on delete cascade,
  started_at    timestamptz default now(),
  submitted_at  timestamptz,
  score         numeric(5,2),
  percentage    numeric(5,2),
  status        text default 'in_progress' check (status in ('in_progress','submitted','auto_submitted')),
  unique(assessment_id, student_id)
);
alter table public.assessment_attempts enable row level security;
create policy "attempts_all" on public.assessment_attempts for all using (auth.uid() is not null);

-- ── ATTEMPT ANSWERS ──────────────────────────────────────────
create table if not exists public.attempt_answers (
  id              uuid primary key default uuid_generate_v4(),
  attempt_id      uuid not null references public.assessment_attempts(id) on delete cascade,
  question_id     uuid not null references public.question_bank(id),
  selected_answer text check (selected_answer in ('A','B','C','D')),
  is_correct      boolean,
  answered_at     timestamptz default now(),
  unique(attempt_id, question_id)
);
alter table public.attempt_answers enable row level security;
create policy "answers_all" on public.attempt_answers for all using (auth.uid() is not null);

-- ── ASSESSMENT RESULTS ───────────────────────────────────────
create table if not exists public.assessment_results (
  id                  uuid primary key default uuid_generate_v4(),
  attempt_id          uuid not null references public.assessment_attempts(id),
  student_id          uuid not null references public.students(id),
  assessment_id       uuid not null references public.assessments(id),
  aptitude_score      numeric(5,2),
  programming_score   numeric(5,2),
  communication_score numeric(5,2),
  total_score         numeric(5,2) not null,
  percentage          numeric(5,2) not null,
  grade               text,
  created_at          timestamptz default now()
);
alter table public.assessment_results enable row level security;
create policy "results_all" on public.assessment_results for all using (auth.uid() is not null);

-- ── READINESS SCORES ─────────────────────────────────────────
create table if not exists public.readiness_scores (
  id                  uuid primary key default uuid_generate_v4(),
  student_id          uuid not null references public.students(id) on delete cascade,
  academic_score      numeric(5,2) not null default 0,
  aptitude_score      numeric(5,2) not null default 0,
  programming_score   numeric(5,2) not null default 0,
  communication_score numeric(5,2) not null default 0,
  internship_score    numeric(5,2) not null default 0,
  projects_score      numeric(5,2) not null default 0,
  total_score         numeric(5,2) not null default 0,
  status              text check (status in ('placement_ready','needs_improvement','at_risk')),
  calculated_at       timestamptz default now(),
  unique(student_id)
);
alter table public.readiness_scores enable row level security;
create policy "readiness_all" on public.readiness_scores for all using (auth.uid() is not null);

-- ── SKILL GAP REPORTS ────────────────────────────────────────
create table if not exists public.skill_gap_reports (
  id             uuid primary key default uuid_generate_v4(),
  student_id     uuid not null references public.students(id) on delete cascade,
  skill_name     text not null,
  current_score  numeric(5,2) not null,
  target_score   numeric(5,2) not null default 80,
  gap            numeric(5,2),
  recommendation text,
  created_at     timestamptz default now()
);
alter table public.skill_gap_reports enable row level security;
create policy "gaps_all" on public.skill_gap_reports for all using (auth.uid() is not null);

-- ── PROCTORING RULES ─────────────────────────────────────────
create table if not exists public.proctoring_rules (
  id           uuid primary key default uuid_generate_v4(),
  rule_name    text not null,
  event_type   text not null,
  threshold    integer default 1,
  severity     text not null check (severity in ('low','medium','high')),
  notify_admin boolean default true,
  is_active    boolean default true,
  created_at   timestamptz default now()
);
alter table public.proctoring_rules enable row level security;
create policy "prules_all" on public.proctoring_rules for all using (auth.uid() is not null);

-- ── PROCTORING EVENTS ────────────────────────────────────────
create table if not exists public.proctoring_events (
  id           uuid primary key default uuid_generate_v4(),
  attempt_id   uuid not null references public.assessment_attempts(id) on delete cascade,
  event_type   text not null,
  severity     text not null check (severity in ('low','medium','high')),
  timestamp    timestamptz default now(),
  snapshot_url text,
  reviewed     boolean default false,
  review_note  text,
  reviewed_by  uuid references public.profiles(id),
  reviewed_at  timestamptz
);
alter table public.proctoring_events enable row level security;
create policy "pevents_all" on public.proctoring_events for all using (auth.uid() is not null);

-- ── COMPANIES ────────────────────────────────────────────────
create table if not exists public.companies (
  id                uuid primary key default uuid_generate_v4(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  logo_url          text,
  industry          text,
  description       text,
  website           text,
  verified          boolean default false,
  verification_note text,
  created_at        timestamptz default now()
);
alter table public.companies enable row level security;
create policy "companies_own"   on public.companies for all    using (profile_id = auth.uid());
create policy "companies_read"  on public.companies for select using (auth.uid() is not null);
create policy "companies_admin" on public.companies for all    using (public.is_admin());

-- ── JOBS ─────────────────────────────────────────────────────
create table if not exists public.jobs (
  id                   uuid primary key default uuid_generate_v4(),
  company_id           uuid not null references public.companies(id) on delete cascade,
  title                text not null,
  description          text,
  required_skills      text[],
  preferred_skills     text[],
  min_cgpa             numeric(4,2) default 0,
  max_backlogs         integer default 0,
  eligible_departments text[],
  experience_level     text default 'fresher',
  location             text,
  work_mode            text default 'on-site',
  employment_type      text default 'full-time',
  is_open              boolean default true,
  created_at           timestamptz default now()
);
alter table public.jobs enable row level security;
create policy "jobs_all" on public.jobs for all using (auth.uid() is not null);

-- ── JOB SKILLS ───────────────────────────────────────────────
create table if not exists public.job_skills (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid not null references public.jobs(id) on delete cascade,
  skill_id    uuid not null references public.skills(id),
  is_required boolean default true,
  unique(job_id, skill_id)
);
alter table public.job_skills enable row level security;
create policy "jskills_all" on public.job_skills for all using (auth.uid() is not null);

-- ── JOB MATCHES ──────────────────────────────────────────────
create table if not exists public.job_matches (
  id                 uuid primary key default uuid_generate_v4(),
  student_id         uuid not null references public.students(id) on delete cascade,
  job_id             uuid not null references public.jobs(id) on delete cascade,
  match_percentage   numeric(5,2) not null default 0,
  matched_skills     text[],
  missing_skills     text[],
  eligibility_status text not null check (eligibility_status in ('eligible','not_eligible','review_required')),
  explanation        text,
  recommendations    text[],
  created_at         timestamptz default now(),
  unique(student_id, job_id)
);
alter table public.job_matches enable row level security;
create policy "matches_all" on public.job_matches for all using (auth.uid() is not null);

-- ── APPLICATIONS ─────────────────────────────────────────────
create table if not exists public.applications (
  id                uuid primary key default uuid_generate_v4(),
  student_id        uuid not null references public.students(id) on delete cascade,
  job_id            uuid not null references public.jobs(id) on delete cascade,
  status            text default 'applied' check (status in ('applied','under_review','shortlisted','rejected','offered')),
  applied_at        timestamptz default now(),
  reviewed_at       timestamptz,
  reviewer_note     text,
  connection_status text default 'pending' check (connection_status in ('pending','approved','connected')),
  unique(student_id, job_id)
);
alter table public.applications enable row level security;
create policy "apps_all" on public.applications for all using (auth.uid() is not null);

-- ── INTERVIEWS ───────────────────────────────────────────────
create table if not exists public.interviews (
  id           uuid primary key default uuid_generate_v4(),
  student_id   uuid not null references public.students(id),
  job_id       uuid not null references public.jobs(id),
  company_id   uuid not null references public.companies(id),
  round        integer default 1,
  scheduled_at timestamptz not null,
  mode         text not null check (mode in ('online','on_campus','hybrid')),
  meeting_link text,
  location     text,
  status       text default 'scheduled' check (status in ('scheduled','completed','rescheduled','withdrawn')),
  outcome      text check (outcome in ('selected','rejected','pending')),
  feedback     text,
  created_at   timestamptz default now()
);
alter table public.interviews enable row level security;
create policy "interviews_all" on public.interviews for all using (auth.uid() is not null);

-- ── PLACEMENTS ───────────────────────────────────────────────
create table if not exists public.placements (
  id               uuid primary key default uuid_generate_v4(),
  student_id       uuid not null references public.students(id) on delete cascade unique,
  job_id           uuid not null references public.jobs(id),
  company_id       uuid not null references public.companies(id),
  offer_date       date,
  joining_date     date,
  package_lpa      numeric(8,2),
  offer_letter_url text,
  status           text default 'offered' check (status in ('offered','accepted','declined')),
  created_at       timestamptz default now()
);
alter table public.placements enable row level security;
create policy "placements_all" on public.placements for all using (auth.uid() is not null);

-- ── NOTIFICATIONS ────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  message    text not null,
  type       text default 'info' check (type in ('info','success','warning','error')),
  is_read    boolean default false,
  link       text,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "notifs_own" on public.notifications for all using (user_id = auth.uid());

-- ── AUDIT LOGS ───────────────────────────────────────────────
create table if not exists public.audit_logs (
  id           uuid primary key default uuid_generate_v4(),
  performed_by uuid references public.profiles(id),
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  old_data     jsonb,
  new_data     jsonb,
  created_at   timestamptz default now()
);
alter table public.audit_logs enable row level security;
create policy "audit_all" on public.audit_logs for all using (auth.uid() is not null);

-- ── READINESS WEIGHTS ────────────────────────────────────────
create table if not exists public.readiness_weights (
  id                   uuid primary key default uuid_generate_v4(),
  academic_weight      numeric(5,2) default 25,
  aptitude_weight      numeric(5,2) default 20,
  programming_weight   numeric(5,2) default 20,
  communication_weight numeric(5,2) default 15,
  internship_weight    numeric(5,2) default 10,
  projects_weight      numeric(5,2) default 10,
  updated_at           timestamptz default now(),
  updated_by           uuid references public.profiles(id)
);
alter table public.readiness_weights enable row level security;
create policy "weights_read" on public.readiness_weights for select using (true);
create policy "weights_all"  on public.readiness_weights for all    using (auth.uid() is not null);

insert into public.readiness_weights
  (academic_weight, aptitude_weight, programming_weight, communication_weight, internship_weight, projects_weight)
values (25, 20, 20, 15, 10, 10);
