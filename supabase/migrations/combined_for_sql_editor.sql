-- PlacementPro Initial Schema v3
-- Simple RLS: no subqueries, no cross-table comparisons, no uuid/text ambiguity

create extension if not exists "uuid-ossp";

-- Security helper (SECURITY DEFINER avoids recursive RLS)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select true from public.profiles where id = auth.uid() and role = 'admin' limit 1),
    false
  )
$$;

-- ── PROFILES ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  full_name  text not null,
  role       text not null default 'student' check (role in ('student','admin','partner')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
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

-- ============================================================
-- SEED DATA for PlacementPro Demo
-- ============================================================

-- Skills
insert into public.skills (name, category) values
  ('Python', 'programming'),
  ('Java', 'programming'),
  ('JavaScript', 'programming'),
  ('TypeScript', 'programming'),
  ('React', 'frontend'),
  ('Node.js', 'backend'),
  ('SQL', 'database'),
  ('Machine Learning', 'ai'),
  ('Data Analysis', 'data'),
  ('Data Structures', 'programming'),
  ('Algorithms', 'programming'),
  ('System Design', 'architecture'),
  ('Problem Solving', 'aptitude'),
  ('Communication', 'soft'),
  ('Teamwork', 'soft'),
  ('Leadership', 'soft'),
  ('C++', 'programming'),
  ('Go', 'programming'),
  ('Docker', 'devops'),
  ('Git', 'tools')
on conflict (name) do nothing;

-- Proctoring Rules
insert into public.proctoring_rules (rule_name, event_type, threshold, severity, notify_admin) values
  ('Multiple Persons Detected', 'multiple_persons', 1, 'high', true),
  ('No Face Detected', 'no_face', 3, 'medium', true),
  ('Tab Switch', 'tab_switch', 2, 'medium', true),
  ('Window Blur', 'window_blur', 3, 'low', false),
  ('Prolonged Absence', 'prolonged_absence', 1, 'high', true),
  ('Face Visibility Change', 'face_visibility', 5, 'low', false);

-- Assessments
insert into public.assessments (title, description, category, duration_minutes, total_marks, pass_marks) values
  ('Aptitude Test – Quantitative Section', 'Tests mathematical reasoning, problem solving and quantitative aptitude', 'aptitude', 60, 100, 40),
  ('Programming Skills Assessment', 'Tests programming concepts, DSA and code comprehension', 'programming', 90, 100, 40),
  ('Communication Skills Assessment', 'Tests grammar, vocabulary, reading comprehension and writing', 'communication', 60, 100, 40);

-- Sample Questions (Aptitude)
insert into public.question_bank (question, option_a, option_b, option_c, option_d, correct_answer, topic, difficulty, category) values
  ('If a train travels 120 km in 2 hours, what is its average speed?', '50 km/h', '60 km/h', '70 km/h', '80 km/h', 'B', 'Speed & Distance', 'easy', 'aptitude'),
  ('A man buys a TV for Rs.15,000 and sells it for Rs.18,000. What is his profit percentage?', '15%', '18%', '20%', '25%', 'C', 'Profit & Loss', 'easy', 'aptitude'),
  ('If 8 workers can complete a job in 12 days, how many days will 6 workers take?', '14 days', '16 days', '18 days', '20 days', 'B', 'Work & Time', 'medium', 'aptitude'),
  ('What is the next number in the series: 2, 6, 12, 20, 30, ?', '40', '42', '44', '46', 'B', 'Number Series', 'medium', 'aptitude'),
  ('A pipe can fill a tank in 4 hours. Another pipe can empty it in 6 hours. If both are open together, when will the tank be full?', '8 hours', '10 hours', '12 hours', '14 hours', 'C', 'Pipes & Cisterns', 'hard', 'aptitude'),
  ('The simple interest on Rs.5000 at 8% per annum for 3 years is?', 'Rs.1000', 'Rs.1200', 'Rs.1400', 'Rs.1600', 'B', 'Simple Interest', 'easy', 'aptitude'),
  ('In a 100m race, A beats B by 10m and B beats C by 10m. By how much does A beat C?', '18m', '19m', '20m', '21m', 'B', 'Races', 'medium', 'aptitude'),
  ('Find the missing term: 1, 4, 9, 16, 25, ?', '30', '35', '36', '40', 'C', 'Number Series', 'easy', 'aptitude');

-- Sample Questions (Programming)
insert into public.question_bank (question, option_a, option_b, option_c, option_d, correct_answer, topic, difficulty, category) values
  ('What is the time complexity of binary search?', 'O(n)', 'O(n log n)', 'O(log n)', 'O(1)', 'C', 'Algorithms', 'easy', 'programming'),
  ('Which data structure uses LIFO principle?', 'Queue', 'Stack', 'Linked List', 'Tree', 'B', 'Data Structures', 'easy', 'programming'),
  ('What does OOP stand for?', 'Object Oriented Processing', 'Object Oriented Programming', 'Oriented Object Programming', 'None of the above', 'B', 'OOP Concepts', 'easy', 'programming'),
  ('Which sorting algorithm has best average case complexity?', 'Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort', 'C', 'Sorting', 'medium', 'programming'),
  ('What is a deadlock in operating systems?', 'A process waiting for CPU', 'Two processes waiting for each other indefinitely', 'A process that crashes', 'Memory overflow', 'B', 'OS Concepts', 'medium', 'programming');

-- Sample Questions (Communication)
insert into public.question_bank (question, option_a, option_b, option_c, option_d, correct_answer, topic, difficulty, category) values
  ('Which sentence is grammatically correct?', 'He go to school every day.', 'He goes to school every day.', 'He going to school every day.', 'He gone to school every day.', 'B', 'Grammar', 'easy', 'communication'),
  ('What is the synonym of "Eloquent"?', 'Silent', 'Articulate', 'Confused', 'Hesitant', 'B', 'Vocabulary', 'medium', 'communication'),
  ('The passage says the company was founded in 1990. What type of question is this?', 'Inference question', 'Fact-based question', 'Opinion question', 'Analysis question', 'B', 'Reading Comprehension', 'easy', 'communication');

-- PlacementPro Question Bank: 200 Aptitude + 200 Programming Questions
-- Migration: 003_questions.sql

INSERT INTO public.question_bank (question, option_a, option_b, option_c, option_d, correct_answer, topic, difficulty, category) VALUES

-- ═══════════════════════════════════════════════════════════
-- APTITUDE QUESTIONS (200)
-- ═══════════════════════════════════════════════════════════

-- Speed, Distance & Time (25 questions)
('A train travels 360 km in 4 hours. What is its speed in km/h?', '80', '90', '85', '95', 'B', 'Speed & Distance', 'easy', 'aptitude'),
('A car covers 150 km in 2.5 hours. What is its average speed?', '55 km/h', '60 km/h', '65 km/h', '70 km/h', 'B', 'Speed & Distance', 'easy', 'aptitude'),
('Two trains start simultaneously from stations A and B, 300 km apart, towards each other. Their speeds are 60 km/h and 40 km/h. After how many hours do they meet?', '2', '3', '4', '5', 'B', 'Speed & Distance', 'medium', 'aptitude'),
('A man walks at 5 km/h and reaches his destination in 3 hours. If he walks at 6 km/h, how much time does he save?', '20 min', '30 min', '25 min', '15 min', 'B', 'Speed & Distance', 'easy', 'aptitude'),
('A train 200 m long passes a pole in 10 seconds. What is the speed of the train in km/h?', '60', '72', '80', '54', 'B', 'Speed & Distance', 'medium', 'aptitude'),
('A train 400 m long passes a platform 600 m long in 50 seconds. What is the speed of the train?', '72 km/h', '60 km/h', '80 km/h', '66 km/h', 'A', 'Speed & Distance', 'medium', 'aptitude'),
('Two cyclists start at the same time from opposite ends of a track 180 km long. One travels at 40 km/h and the other at 50 km/h. After how long do they meet?', '2 hours', '3 hours', '2.5 hours', '1.8 hours', 'A', 'Speed & Distance', 'medium', 'aptitude'),
('A boat travels 24 km upstream in 6 hours and 20 km downstream in 4 hours. What is the speed of the boat in still water?', '4.5 km/h', '5 km/h', '4 km/h', '5.5 km/h', 'B', 'Speed & Distance', 'hard', 'aptitude'),
('A person covers a certain distance at 7/5 of his usual speed and reaches 40 minutes early. What is his usual time?', '2h 20min', '2h 00min', '2h 40min', '3h 00min', 'A', 'Speed & Distance', 'hard', 'aptitude'),
('A train passes a 240 m bridge in 24 seconds and a 120 m bridge in 16 seconds. What is the length of the train?', '120 m', '60 m', '80 m', '100 m', 'A', 'Speed & Distance', 'hard', 'aptitude'),
('If a man runs at 9 km/h, he misses a bus by 5 minutes. If he runs at 10 km/h, he reaches 4 minutes before the bus. What is the distance to the bus stop?', '7.5 km', '9 km', '6 km', '8 km', 'A', 'Speed & Distance', 'hard', 'aptitude'),
('A and B start from points X and Y respectively, 300 km apart, at the same time. A drives at 60 km/h and B at 90 km/h. They meet at a point. How far from X is the meeting point?', '120 km', '180 km', '150 km', '200 km', 'A', 'Speed & Distance', 'medium', 'aptitude'),
('A motorist travels from A to B at 60 km/h and returns at 40 km/h. What is the average speed for the whole journey?', '50 km/h', '48 km/h', '52 km/h', '46 km/h', 'B', 'Speed & Distance', 'medium', 'aptitude'),
('A thief is spotted 200 m ahead of a police officer. The police officer runs at 8 km/h and the thief runs at 6 km/h. How long does it take to catch the thief?', '6 min', '8 min', '10 min', '12 min', 'A', 'Speed & Distance', 'medium', 'aptitude'),
('A train covers a distance of 540 km at 90 km/h. If the speed is increased by 30 km/h, how much time is saved?', '1.5 hours', '1 hour', '2 hours', '0.5 hours', 'A', 'Speed & Distance', 'easy', 'aptitude'),
('A person walking at 4 km/h reaches office 6 minutes late. At 5 km/h, he reaches 4 minutes early. How far is his office?', '3.33 km', '4 km', '5 km', '2.5 km', 'A', 'Speed & Distance', 'hard', 'aptitude'),
('Two trains of lengths 110 m and 90 m run in opposite directions at 40 km/h and 50 km/h. How long do they take to cross each other?', '8 sec', '10 sec', '12 sec', '9 sec', 'A', 'Speed & Distance', 'medium', 'aptitude'),
('A bus travels at 60 km/h for the first half of the journey and at 40 km/h for the rest. What is the average speed?', '48 km/h', '50 km/h', '45 km/h', '52 km/h', 'A', 'Speed & Distance', 'medium', 'aptitude'),
('Sound travels at 330 m/s. A gun is fired and the echo is heard after 6 seconds. What is the distance of the reflecting surface?', '990 m', '1980 m', '660 m', '1320 m', 'A', 'Speed & Distance', 'easy', 'aptitude'),
('A stream flows at 3 km/h. A boat goes 12 km upstream in the same time it takes to go 18 km downstream. What is the boat speed in still water?', '12 km/h', '15 km/h', '10 km/h', '8 km/h', 'B', 'Speed & Distance', 'hard', 'aptitude'),
('A runner completes a lap of 400 m in 50 seconds. Another runner completes the same lap in 40 seconds. If they start together, after how long will the faster runner lap the slower?', '200 sec', '150 sec', '100 sec', '250 sec', 'A', 'Speed & Distance', 'medium', 'aptitude'),
('A cyclist rides at 15 km/h for 2 hours then at 10 km/h for 3 hours. What is his average speed?', '12 km/h', '12.5 km/h', '11.5 km/h', '13 km/h', 'A', 'Speed & Distance', 'easy', 'aptitude'),
('A train 100 m long traveling at 60 km/h overtakes another train 200 m long traveling at 40 km/h in the same direction. How long does the overtaking take?', '54 sec', '45 sec', '36 sec', '60 sec', 'A', 'Speed & Distance', 'hard', 'aptitude'),
('A car at 50 km/h takes 20 minutes more than at 60 km/h for the same distance. What is the distance?', '100 km', '80 km', '120 km', '60 km', 'A', 'Speed & Distance', 'medium', 'aptitude'),
('Walking at 3/4 of his usual speed, a man reaches work 20 minutes late. What is his usual time?', '60 min', '50 min', '40 min', '55 min', 'A', 'Speed & Distance', 'medium', 'aptitude'),

-- Profit, Loss & Discount (20 questions)
('A shopkeeper buys an article for ₹800 and sells it for ₹1000. What is the profit percentage?', '20%', '25%', '15%', '30%', 'B', 'Profit & Loss', 'easy', 'aptitude'),
('An item is bought for ₹500 and sold at a 20% loss. What is the selling price?', '₹400', '₹350', '₹450', '₹380', 'A', 'Profit & Loss', 'easy', 'aptitude'),
('A merchant marks goods 40% above cost price and offers a 20% discount. What is the profit percentage?', '12%', '10%', '8%', '15%', 'A', 'Profit & Loss', 'medium', 'aptitude'),
('By selling 12 oranges for ₹10, a fruit seller gains 20%. How many should he sell for ₹10 to gain 25%?', '9.6', '11', '10', '8', 'A', 'Profit & Loss', 'hard', 'aptitude'),
('A trader sells goods at a 10% loss. If cost price is ₹2000, what is the selling price?', '₹1800', '₹1600', '₹2200', '₹1900', 'A', 'Profit & Loss', 'easy', 'aptitude'),
('An article is bought for ₹1200 and sold for ₹1500. What is the profit percentage?', '20%', '25%', '15%', '30%', 'B', 'Profit & Loss', 'easy', 'aptitude'),
('A person sells a chair at ₹880 gaining 10%. At what price should he sell it to gain 20%?', '₹960', '₹970', '₹940', '₹990', 'A', 'Profit & Loss', 'medium', 'aptitude'),
('If cost price is ₹800 and selling price is ₹720, find the loss percentage.', '10%', '8%', '12%', '9%', 'A', 'Profit & Loss', 'easy', 'aptitude'),
('A shopkeeper offers two successive discounts of 20% and 10%. What is the equivalent single discount?', '28%', '30%', '25%', '32%', 'A', 'Profit & Loss', 'medium', 'aptitude'),
('A car is sold for ₹4,50,000 at a 10% profit. What was the cost price?', '₹4,09,090', '₹4,00,000', '₹4,05,000', '₹4,20,000', 'A', 'Profit & Loss', 'medium', 'aptitude'),
('By selling 100 pens for ₹1200, a shopkeeper gains 20%. How many pens were bought for ₹1200?', '150', '100', '120', '140', 'C', 'Profit & Loss', 'medium', 'aptitude'),
('A man sells two watches for ₹1955 each. On one he gains 15% and on the other he loses 15%. What is the net result?', '2.25% loss', '2.25% gain', 'No loss no gain', '1.5% loss', 'A', 'Profit & Loss', 'hard', 'aptitude'),
('Marked price is ₹1500 and a 15% discount is given. What is the selling price?', '₹1275', '₹1300', '₹1250', '₹1350', 'A', 'Profit & Loss', 'easy', 'aptitude'),
('A bicycle is sold at a 25% profit. If cost price was ₹2400, what is the selling price?', '₹3000', '₹2800', '₹3200', '₹2600', 'A', 'Profit & Loss', 'easy', 'aptitude'),
('A shopkeeper buys goods at ₹9 per kg and sells at ₹10 per kg. Additionally, he uses a 900g weight instead of 1 kg. Find actual profit %', '21.1%', '11.1%', '10.0%', '20.0%', 'B', 'Profit & Loss', 'hard', 'aptitude'),
('Cost price of 10 articles = selling price of 8 articles. Find profit or loss %', '25% profit', '20% profit', '20% loss', '25% loss', 'A', 'Profit & Loss', 'hard', 'aptitude'),
('A sells goods to B at 10% profit. B sells to C at 20% profit. If C pays ₹1320, what did A pay?', '₹1000', '₹1100', '₹900', '₹1200', 'A', 'Profit & Loss', 'hard', 'aptitude'),
('If SP = ₹840 at 5% loss, what is CP?', '₹883', '₹900', '₹840', '₹800', 'B', 'Profit & Loss', 'easy', 'aptitude'),
('A trader claims 20% profit but uses weights 20% less. Find actual profit %', '50%', '40%', '45%', '55%', 'A', 'Profit & Loss', 'hard', 'aptitude'),
('A television set is listed at ₹12,000 with a 20% discount. After a 10% service charge, what is the final price?', '₹10,560', '₹9,600', '₹10,000', '₹11,000', 'A', 'Profit & Loss', 'medium', 'aptitude'),

-- Time & Work (20 questions)
('A can do a job in 10 days and B in 15 days. Working together, how long do they take?', '6 days', '5 days', '7 days', '8 days', 'A', 'Time & Work', 'easy', 'aptitude'),
('A can do a work in 12 days, B in 18 days. If they work alternately starting with A, how many days to complete?', '14 days', '15 days', '13 days', '16 days', 'A', 'Time & Work', 'hard', 'aptitude'),
('A does half of a work in 70 days. Together with B they complete it in 52.5 days. How long does B take alone?', '105 days', '100 days', '112 days', '120 days', 'A', 'Time & Work', 'hard', 'aptitude'),
('10 workers can build a wall in 6 days. How many workers are needed to build it in 4 days?', '15', '12', '18', '20', 'A', 'Time & Work', 'easy', 'aptitude'),
('A pipe fills a tank in 3 hours, another drains it in 5 hours. If both are open, when is the tank full?', '7.5 hours', '8 hours', '6 hours', '9 hours', 'A', 'Time & Work', 'medium', 'aptitude'),
('A and B together can do a piece of work in 15 days. A alone can do it in 20 days. How long will B take alone?', '60 days', '50 days', '45 days', '40 days', 'A', 'Time & Work', 'medium', 'aptitude'),
('20 men can do a job in 30 days working 8 hours/day. How many men are needed to finish it in 12 days at 10 hours/day?', '40', '35', '45', '50', 'A', 'Time & Work', 'hard', 'aptitude'),
('A is twice as efficient as B. Together they complete work in 18 days. How long does A take alone?', '27 days', '24 days', '30 days', '36 days', 'A', 'Time & Work', 'medium', 'aptitude'),
('If 6 men and 8 boys can do a job in 10 days while 26 men and 48 boys do it in 2 days, how long for 15 men and 20 boys?', '4 days', '5 days', '3 days', '6 days', 'A', 'Time & Work', 'hard', 'aptitude'),
('A tap can fill a cistern in 8 hours and another can empty it in 12 hours. If both are open simultaneously, when is the cistern full?', '24 hours', '20 hours', '16 hours', '18 hours', 'A', 'Time & Work', 'medium', 'aptitude'),
('A does 1/3 of work in 5 days. B does 2/5 of work in 10 days. Together they finish in?', '9.375 days', '10 days', '8 days', '12 days', 'A', 'Time & Work', 'hard', 'aptitude'),
('12 people can complete a project in 25 days. After 10 days, 4 more people join. How many more days to complete?', '9 days', '10 days', '11 days', '12 days', 'A', 'Time & Work', 'hard', 'aptitude'),
('Three taps A, B, C fill a tank in 12, 15, and 20 hours. If all are opened, how long to fill?', '5 hours', '4 hours', '6 hours', '7 hours', 'A', 'Time & Work', 'medium', 'aptitude'),
('A is 30% more efficient than B. Together they take 13 days. How long does B take alone?', '23 days', '30 days', '26 days', '20 days', 'B', 'Time & Work', 'hard', 'aptitude'),
('X can do a job in 40 days. With help from Y, it''s done in 28 days. Y works alone for how many days after X leaves, to finish?', '17.5 days', '20 days', '14 days', '15 days', 'A', 'Time & Work', 'hard', 'aptitude'),
('5 men and 9 women can do a piece of work in 19 days; 3 men and 6 women can do it in 22 days. How long for 1 man alone?', '110 days', '100 days', '120 days', '90 days', 'A', 'Time & Work', 'hard', 'aptitude'),
('A tank is 7/8 full. Pipe A fills 3/4 of a full tank in 8 hours. Pipe B empties in 10 hours. Time to empty?', '100 hours', '80 hours', '90 hours', '70 hours', 'A', 'Time & Work', 'hard', 'aptitude'),
('Worker A earns ₹200/day and completes work in 10 days. Worker B earns ₹150/day and completes in 15 days. What is the combined daily wage when working together?', '₹350', '₹300', '₹400', '₹250', 'A', 'Time & Work', 'easy', 'aptitude'),
('A alone completes work in 16 days. B is 60% as efficient as A. How long does B take alone?', '25.6 days', '26 days', '24 days', '28 days', 'A', 'Time & Work', 'medium', 'aptitude'),
('A and B together do a work in 20 days. B and C do it in 24 days. A and C do it in 30 days. How long does A take alone?', '48 days', '40 days', '36 days', '60 days', 'B', 'Time & Work', 'hard', 'aptitude'),

-- Percentages (20 questions)
('What is 35% of 240?', '84', '80', '88', '76', 'A', 'Percentages', 'easy', 'aptitude'),
('If 60% of a number is 90, what is the number?', '150', '120', '180', '160', 'A', 'Percentages', 'easy', 'aptitude'),
('A number increases from 200 to 250. What is the percentage increase?', '25%', '20%', '30%', '15%', 'A', 'Percentages', 'easy', 'aptitude'),
('In an election, candidate A got 55% of total valid votes. If invalid votes were 2000 and total votes were 50000, how many valid votes did A get?', '26400', '27500', '25000', '28000', 'A', 'Percentages', 'medium', 'aptitude'),
('A student scored 70% in Math and 80% in Science. If total marks for each subject is 150, what is the combined percentage?', '75%', '70%', '80%', '77%', 'A', 'Percentages', 'easy', 'aptitude'),
('A salary is first increased by 10% and then decreased by 10%. What is the net percentage change?', '-1%', '0%', '+1%', '-2%', 'A', 'Percentages', 'medium', 'aptitude'),
('What is 15% of 80% of 500?', '60', '50', '70', '40', 'A', 'Percentages', 'medium', 'aptitude'),
('If the population of a city increases by 5% per year, what will be the population after 2 years if currently 4,00,000?', '4,41,000', '4,40,000', '4,20,000', '4,50,000', 'A', 'Percentages', 'medium', 'aptitude'),
('A price rises by 25% and then falls by 20%. What is the net change?', '0%', '+5%', '-5%', '+10%', 'A', 'Percentages', 'medium', 'aptitude'),
('If 20% of (x - y) = 15% of (x + y), then x:y = ?', '7:1', '5:1', '3:1', '9:1', 'A', 'Percentages', 'hard', 'aptitude'),
('In a mixture of milk and water, milk is 80%. If 10 litres of water is added, milk becomes 75%. Find initial mixture.', '120 L', '150 L', '100 L', '80 L', 'B', 'Percentages', 'hard', 'aptitude'),
('What percentage is 45 minutes of 3 hours?', '25%', '20%', '33.3%', '15%', 'A', 'Percentages', 'easy', 'aptitude'),
('A shopkeeper reduces prices by 30%. To get original price back, by what % must he increase?', '42.86%', '30%', '43.75%', '40%', 'A', 'Percentages', 'medium', 'aptitude'),
('If 40% of a number added to 40 equals the number, find the number.', '66.67', '80', '60', '70', 'A', 'Percentages', 'medium', 'aptitude'),
('Deepak''s income is 25% more than Neha''s. By what % is Neha''s income less than Deepak''s?', '20%', '25%', '22%', '18%', 'A', 'Percentages', 'medium', 'aptitude'),
('A number is increased by 20% and then decreased by 20%. The net effect on the number is?', '-4%', '0%', '+4%', '-2%', 'A', 'Percentages', 'easy', 'aptitude'),
('If 120% of a number is 84, what is 65% of that number?', '45.5', '42', '48', '52', 'A', 'Percentages', 'medium', 'aptitude'),
('In a class of 50 students, 40% are girls. How many boys are there?', '30', '20', '25', '35', 'A', 'Percentages', 'easy', 'aptitude'),
('Rohit spends 75% of his income. If his income increases by 20% and expenditure by 10%, what is the % increase in savings?', '50%', '40%', '45%', '60%', 'A', 'Percentages', 'hard', 'aptitude'),
('Two numbers A and B are 35% and 65% of a third number C. What percentage is A of B?', '53.85%', '50%', '55%', '60%', 'A', 'Percentages', 'medium', 'aptitude'),

-- Simple & Compound Interest (15 questions)
('Find SI on ₹5000 at 8% per annum for 3 years.', '₹1200', '₹1000', '₹1400', '₹1600', 'A', 'Simple & Compound Interest', 'easy', 'aptitude'),
('A sum of ₹2000 is invested at 10% CI for 2 years. Find the amount.', '₹2420', '₹2400', '₹2200', '₹2500', 'A', 'Simple & Compound Interest', 'easy', 'aptitude'),
('The difference between SI and CI for 2 years at 10% on ₹5000 is?', '₹50', '₹100', '₹500', '₹250', 'A', 'Simple & Compound Interest', 'medium', 'aptitude'),
('At what rate of SI does a sum double in 12.5 years?', '8%', '6%', '10%', '12%', 'A', 'Simple & Compound Interest', 'medium', 'aptitude'),
('A sum of ₹800 amounts to ₹920 in 3 years at SI. What does it amount to in 5 years?', '₹1000', '₹1200', '₹1100', '₹950', 'A', 'Simple & Compound Interest', 'medium', 'aptitude'),
('₹4000 becomes ₹4800 in 4 years at SI. What will ₹7000 become in 5 years at same rate?', '₹8750', '₹8400', '₹9000', '₹8500', 'A', 'Simple & Compound Interest', 'medium', 'aptitude'),
('Find the CI on ₹10000 at 12% for 18 months compounded semi-annually.', '₹1910.16', '₹1800', '₹2000', '₹1850', 'A', 'Simple & Compound Interest', 'hard', 'aptitude'),
('The CI on a certain sum for 2 years at 10% is ₹630. Find the principal.', '₹3000', '₹2500', '₹2000', '₹4000', 'A', 'Simple & Compound Interest', 'hard', 'aptitude'),
('A sum of money doubles at CI in 10 years. In how many years will it become 8 times?', '30', '20', '25', '40', 'A', 'Simple & Compound Interest', 'hard', 'aptitude'),
('The ratio of CI for 3rd year to 2nd year at 10% is?', '1.1:1', '1.2:1', '1:1.1', '1.21:1', 'A', 'Simple & Compound Interest', 'hard', 'aptitude'),
('A man takes a loan at 8% SI per annum and pays ₹12480 after 3 years. How much did he borrow?', '₹10000', '₹9000', '₹11000', '₹8000', 'A', 'Simple & Compound Interest', 'medium', 'aptitude'),
('Simple interest on a sum is 9/16 of the principal. If rate = time, find the rate.', '7.5%', '6%', '9%', '8%', 'A', 'Simple & Compound Interest', 'hard', 'aptitude'),
('Find the effective annual rate if nominal rate is 12% compounded quarterly.', '12.55%', '12%', '13%', '11.5%', 'A', 'Simple & Compound Interest', 'hard', 'aptitude'),
('₹1200 is lent in two parts, one at 5% and other at 6% SI per annum. If total SI is ₹62, what is amount lent at 5%?', '₹800', '₹600', '₹1000', '₹700', 'A', 'Simple & Compound Interest', 'hard', 'aptitude'),
('How much time will ₹8000 take to amount ₹9200 at 5% SI?', '3 years', '2 years', '4 years', '2.5 years', 'A', 'Simple & Compound Interest', 'easy', 'aptitude'),

-- Number Series & Patterns (20 questions)
('Find the next number: 2, 6, 18, 54, ___', '162', '108', '144', '216', 'A', 'Number Series', 'easy', 'aptitude'),
('Find the missing number: 1, 4, 9, 16, ___', '25', '20', '36', '30', 'A', 'Number Series', 'easy', 'aptitude'),
('Complete the series: 5, 11, 23, 47, ___', '95', '96', '94', '93', 'A', 'Number Series', 'medium', 'aptitude'),
('Find the odd one out: 8, 27, 64, 100, 125', '100', '8', '27', '125', 'A', 'Number Series', 'medium', 'aptitude'),
('What comes next: 2, 3, 5, 8, 13, 21, ___', '34', '30', '35', '32', 'A', 'Number Series', 'easy', 'aptitude'),
('Series: 1, 2, 4, 8, 16. What is the 10th term?', '512', '256', '1024', '128', 'A', 'Number Series', 'easy', 'aptitude'),
('Find missing: 3, 7, 15, 31, 63, ___', '127', '125', '128', '126', 'A', 'Number Series', 'medium', 'aptitude'),
('Which term does not fit: 1, 4, 9, 16, 25, 35, 49', '35', '25', '16', '49', 'A', 'Number Series', 'medium', 'aptitude'),
('Series: 0.5, 1.5, 4.5, 13.5, ___', '40.5', '39.5', '41', '42', 'A', 'Number Series', 'medium', 'aptitude'),
('Next term: 6, 11, 21, 36, 56, ___', '81', '76', '91', '86', 'A', 'Number Series', 'hard', 'aptitude'),
('Pattern: 2, 5, 10, 17, 26, ___', '37', '35', '36', '38', 'A', 'Number Series', 'medium', 'aptitude'),
('Find x in: 3, 6, 10, 15, x, 28', '21', '20', '22', '23', 'A', 'Number Series', 'medium', 'aptitude'),
('Series: 1, 8, 27, 64, 125. Find 6th term.', '216', '196', '225', '256', 'A', 'Number Series', 'easy', 'aptitude'),
('What next? 1, 3, 6, 10, 15, ___', '21', '18', '20', '24', 'A', 'Number Series', 'easy', 'aptitude'),
('Series: 100, 90, 81, 73, ___', '66', '65', '67', '68', 'A', 'Number Series', 'medium', 'aptitude'),
('Find the missing: 2, 4, 12, 48, ___', '240', '192', '200', '120', 'A', 'Number Series', 'medium', 'aptitude'),
('Pattern: 1, 2, 6, 24, 120, ___', '720', '600', '840', '960', 'A', 'Number Series', 'easy', 'aptitude'),
('Odd one out: 2, 4, 8, 16, 24, 32', '24', '4', '32', '16', 'A', 'Number Series', 'medium', 'aptitude'),
('Find next: 7, 14, 21, 28, 35, ___', '42', '43', '40', '44', 'A', 'Number Series', 'easy', 'aptitude'),
('Arithmetic series: 3, 9, 15, 21, ___', '27', '25', '28', '30', 'A', 'Number Series', 'easy', 'aptitude'),

-- Ratio & Proportion (15 questions)
('A:B = 3:4 and B:C = 5:6. Find A:C.', '5:8', '3:6', '15:24', '1:2', 'A', 'Ratio & Proportion', 'medium', 'aptitude'),
('If 4 men can earn ₹3200 in 8 days, what can 6 men earn in 10 days?', '₹6000', '₹5000', '₹4800', '₹7200', 'A', 'Ratio & Proportion', 'medium', 'aptitude'),
('Two numbers are in ratio 3:7 and their sum is 210. Find the larger number.', '147', '63', '140', '150', 'A', 'Ratio & Proportion', 'easy', 'aptitude'),
('If 15 kg of sugar cost ₹375, what do 20 kg cost?', '₹500', '₹450', '₹400', '₹550', 'A', 'Ratio & Proportion', 'easy', 'aptitude'),
('A bag has coins in ratio 2:3:5 (1p, 5p, 10p). Total = 1040 coins. Find 10p coins.', '520', '312', '208', '400', 'A', 'Ratio & Proportion', 'medium', 'aptitude'),
('Ratio of ages of father to son is 4:1. After 20 years it will be 2:1. Find current ages.', '40 & 10', '30 & 8', '36 & 9', '44 & 11', 'A', 'Ratio & Proportion', 'hard', 'aptitude'),
('Milk to water ratio in a mixture is 5:3. If 4 litres of water is added, ratio becomes 5:4. Find original quantity.', '40 litres', '32 litres', '20 litres', '36 litres', 'A', 'Ratio & Proportion', 'hard', 'aptitude'),
('A:B:C = 2:3:5. If A''s share in ₹2000 is what?', '₹400', '₹600', '₹1000', '₹800', 'A', 'Ratio & Proportion', 'easy', 'aptitude'),
('If x:y = 5:3, find (4x + 3y):(4x - 3y)', '29:11', '11:29', '20:11', '23:11', 'A', 'Ratio & Proportion', 'hard', 'aptitude'),
('Three partners invest ₹5000, ₹6000, and ₹9000. They earn ₹4000 profit. What is the third partner''s share?', '₹1800', '₹1000', '₹1200', '₹2000', 'A', 'Ratio & Proportion', 'medium', 'aptitude'),
('If 7 men and 5 women work in same ratio and man earns ₹210/day, total wage is ₹2100. Woman earns?', '₹150', '₹175', '₹100', '₹200', 'A', 'Ratio & Proportion', 'medium', 'aptitude'),
('Gold and silver in ratio 7:2. If 7g gold and 2g silver are removed, ratio becomes 3:1. Find original gold.', '77g', '49g', '63g', '70g', 'A', 'Ratio & Proportion', 'hard', 'aptitude'),
('Mean proportion of 4 and 9 is?', '6', '7', '5', '36', 'A', 'Ratio & Proportion', 'easy', 'aptitude'),
('The third proportional to 12 and 18 is?', '27', '24', '36', '30', 'A', 'Ratio & Proportion', 'medium', 'aptitude'),
('Divide ₹1200 in ratio 1:2:3 among A, B, C. B''s share is?', '₹400', '₹200', '₹600', '₹300', 'A', 'Ratio & Proportion', 'easy', 'aptitude'),

-- Averages & Mixtures (15 questions)
('Average of 5 numbers is 30. If a 6th number is added and average becomes 28, what is the 6th number?', '18', '20', '16', '22', 'A', 'Averages & Mixtures', 'easy', 'aptitude'),
('Average marks of 40 students is 60. If top 5 have average 80, what is average of remaining 35?', '57.14', '55', '58', '56', 'A', 'Averages & Mixtures', 'medium', 'aptitude'),
('Find the average of first 50 natural numbers.', '25.5', '25', '26', '24.5', 'A', 'Averages & Mixtures', 'easy', 'aptitude'),
('In a class, average weight is 60 kg. When a new student of 90 kg joins, average becomes 62 kg. How many students were there originally?', '14', '12', '16', '10', 'A', 'Averages & Mixtures', 'medium', 'aptitude'),
('A shopkeeper mixes 20 kg of rice at ₹40/kg with 30 kg at ₹50/kg. Cost per kg of mixture is?', '₹46', '₹45', '₹44', '₹48', 'A', 'Averages & Mixtures', 'easy', 'aptitude'),
('In what proportion should tea at ₹75/kg be mixed with tea at ₹100/kg to get a mixture worth ₹90/kg?', '2:3', '3:2', '1:2', '2:1', 'A', 'Averages & Mixtures', 'medium', 'aptitude'),
('The average of 10 numbers is 15. If each number is multiplied by 2, the new average is?', '30', '15', '25', '20', 'A', 'Averages & Mixtures', 'easy', 'aptitude'),
('Average of x, y, z is 18. Average of x, y is 16. Find z.', '22', '20', '24', '18', 'A', 'Averages & Mixtures', 'easy', 'aptitude'),
('A vessel has 60 litres milk. 20 litres taken out and replaced with water. Repeated 3 times. Milk left?', '26.67 L', '27 L', '30 L', '25 L', 'A', 'Averages & Mixtures', 'hard', 'aptitude'),
('Average income of A, B, C is ₹12000. Average of A, B is ₹10000. C''s income is?', '₹16000', '₹14000', '₹18000', '₹12000', 'A', 'Averages & Mixtures', 'easy', 'aptitude'),
('Alloy A has 60% gold and alloy B has 30% gold. In what ratio should they be mixed to get 45% gold alloy?', '1:1', '2:1', '1:2', '3:2', 'A', 'Averages & Mixtures', 'medium', 'aptitude'),
('Average of 9 observations is 45. If 10th observation is 56, new average is?', '46.1', '45.5', '46.5', '47', 'A', 'Averages & Mixtures', 'easy', 'aptitude'),
('A container has 100 L of mixture (40% milk). How much mixture to replace with milk to make it 60% milk?', '50 L', '40 L', '33.33 L', '25 L', 'A', 'Averages & Mixtures', 'hard', 'aptitude'),
('Average of 6 consecutive even numbers is 15. Find smallest.', '10', '12', '8', '14', 'A', 'Averages & Mixtures', 'medium', 'aptitude'),
('Find weighted average: 10 students score 80 and 20 students score 70.', '73.33', '75', '72', '74', 'A', 'Averages & Mixtures', 'medium', 'aptitude'),

-- Permutations & Combinations (15 questions)
('How many ways can 4 students sit in a row?', '24', '12', '16', '32', 'A', 'Permutations & Combinations', 'easy', 'aptitude'),
('In how many ways can a committee of 3 be selected from 8 people?', '56', '48', '336', '24', 'A', 'Permutations & Combinations', 'easy', 'aptitude'),
('How many 3-digit numbers can be formed from 1,2,3,4,5 without repetition?', '60', '120', '125', '24', 'A', 'Permutations & Combinations', 'easy', 'aptitude'),
('In how many ways can letters of "PROGRAM" be arranged?', '5040', '2520', '1260', '10080', 'A', 'Permutations & Combinations', 'medium', 'aptitude'),
('A team of 11 is to be selected from 15 players. How many ways?', '1365', '3003', '1001', '5005', 'A', 'Permutations & Combinations', 'medium', 'aptitude'),
('How many ways can 5 persons sit around a circular table?', '24', '120', '60', '48', 'A', 'Permutations & Combinations', 'medium', 'aptitude'),
('Number of ways to choose 2 boys and 3 girls from 4 boys and 5 girls?', '60', '120', '30', '180', 'A', 'Permutations & Combinations', 'medium', 'aptitude'),
('How many 4-letter words can be formed from LOGIC (letters not repeating)?', '120', '60', '24', '240', 'A', 'Permutations & Combinations', 'medium', 'aptitude'),
('In how many ways can 2 red, 3 blue, 4 green balls be arranged in a row?', '1260', '5040', '2520', '840', 'A', 'Permutations & Combinations', 'hard', 'aptitude'),
('A die is thrown twice. What is probability of getting sum = 9?', '1/9', '1/6', '4/36', '1/12', 'A', 'Permutations & Combinations', 'medium', 'aptitude'),
('In how many ways can 8 books be arranged on a shelf if 3 specific books must be together?', '4320', '720', '2160', '8640', 'A', 'Permutations & Combinations', 'hard', 'aptitude'),
('How many words can be formed from BANANA?', '60', '120', '180', '30', 'A', 'Permutations & Combinations', 'medium', 'aptitude'),
('In how many ways can 5 red and 4 blue beads be arranged in a necklace?', '2016', '1008', '504', '4032', 'A', 'Permutations & Combinations', 'hard', 'aptitude'),
('A bag has 4 white and 6 black balls. Probability of drawing 2 white balls?', '2/15', '1/15', '4/15', '8/45', 'A', 'Permutations & Combinations', 'medium', 'aptitude'),
('How many 4-digit even numbers can be formed from digits 1-9 without repetition?', '1344', '1200', '1400', '1500', 'A', 'Permutations & Combinations', 'hard', 'aptitude'),

-- Logical Reasoning (20 questions)
('A is B''s sister. C is B''s mother. D is C''s father. E is D''s mother. How is A related to D?', 'Granddaughter', 'Daughter', 'Grand-granddaughter', 'Niece', 'A', 'Logical Reasoning', 'medium', 'aptitude'),
('If CLOUD is BDMVB in a code, what is RAIN?', 'PBGL', 'ODGL', 'PBGM', 'QCHL', 'A', 'Logical Reasoning', 'medium', 'aptitude'),
('Pointing to a woman, a man says "She is the daughter of the only child of my father." How is he related to her?', 'Father', 'Uncle', 'Brother', 'Grandfather', 'A', 'Logical Reasoning', 'hard', 'aptitude'),
('All A are B. No B is C. Some C are D. Which conclusion follows? (1) No A is C (2) Some D are not B', 'Both 1 and 2', 'Only 1', 'Only 2', 'Neither', 'A', 'Logical Reasoning', 'hard', 'aptitude'),
('You are facing North-East. Turn 90° clockwise, then 180° anti-clockwise. Which direction are you facing?', 'South-East', 'South-West', 'North-West', 'North-East', 'A', 'Logical Reasoning', 'medium', 'aptitude'),
('A man starts walking North, turns right, then turns right again, then turns left. Which direction is he facing?', 'East', 'West', 'South', 'North', 'A', 'Logical Reasoning', 'medium', 'aptitude'),
('If "HAND" is coded as "SZMW", how is "GLOW" coded?', 'TILD', 'TLOV', 'TILW', 'TILD', 'A', 'Logical Reasoning', 'medium', 'aptitude'),
('A clock shows 3:15. What is the angle between the minute and hour hands?', '7.5°', '0°', '15°', '30°', 'A', 'Logical Reasoning', 'hard', 'aptitude'),
('In a row of 40 students, Ravi is 11th from the left. Priya is 20th from the right. How many students are between them?', '9', '10', '11', '8', 'A', 'Logical Reasoning', 'medium', 'aptitude'),
('Complete the analogy: Doctor : Hospital :: Teacher : ___', 'School', 'Library', 'Book', 'Student', 'A', 'Logical Reasoning', 'easy', 'aptitude'),
('If 1st Jan 2023 is Sunday, what day is 1st April 2023?', 'Saturday', 'Sunday', 'Monday', 'Friday', 'A', 'Logical Reasoning', 'medium', 'aptitude'),
('In a queue, A is 16th from the front and 16th from the back. How many are in the queue?', '31', '32', '33', '30', 'A', 'Logical Reasoning', 'easy', 'aptitude'),
('If TREE is coded as UQFF, then PLANT is coded as?', 'QMBOU', 'QMBPU', 'RNCOU', 'QNCOU', 'A', 'Logical Reasoning', 'medium', 'aptitude'),
('All flowers are beautiful. All beautiful things are expensive. Are all flowers expensive?', 'Yes', 'No', 'Cannot determine', 'Only some', 'A', 'Logical Reasoning', 'easy', 'aptitude'),
('A cube is painted red on all faces and cut into 27 equal smaller cubes. How many have exactly 2 red faces?', '12', '8', '6', '24', 'A', 'Logical Reasoning', 'hard', 'aptitude'),
('Find the odd one out: Mercury, Venus, Earth, Moon, Mars', 'Moon', 'Mercury', 'Mars', 'Venus', 'A', 'Logical Reasoning', 'easy', 'aptitude'),
('If TODAY is VRGCA, what is TOMORROW?', 'VRPRRQZ', 'VWPRQRZ', 'VRPRQRZ', 'UQPRQRZ', 'A', 'Logical Reasoning', 'hard', 'aptitude'),
('Suresh is taller than Ravi. Ravi is taller than Mohan. Mohan is taller than Arun. Who is tallest?', 'Suresh', 'Ravi', 'Mohan', 'Arun', 'A', 'Logical Reasoning', 'easy', 'aptitude'),
('A number when divided by 6 leaves remainder 3. What is the remainder when divided by 3?', '0', '1', '2', '3', 'A', 'Logical Reasoning', 'medium', 'aptitude'),
('Statement: All pens are pencils. Some pencils are erasers. Conclusion: Some pens are erasers.', 'Definitely false', 'Definitely true', 'Possibly true', 'None', 'C', 'Logical Reasoning', 'hard', 'aptitude'),

-- Data Interpretation (15 questions)
('A bar chart shows sales of 100, 150, 120, 200, 180 for Jan-May. What is the average monthly sales?', '150', '130', '170', '140', 'A', 'Data Interpretation', 'easy', 'aptitude'),
('In a pie chart, 30% is for food, 25% transport, 20% rent, 15% entertainment, 10% savings. If income is ₹40,000, how much goes to food?', '₹12,000', '₹10,000', '₹8,000', '₹6,000', 'A', 'Data Interpretation', 'easy', 'aptitude'),
('From a table: Year 2020 profit=20L, 2021=25L, 2022=30L, 2023=35L. What is % increase from 2020 to 2023?', '75%', '50%', '100%', '65%', 'A', 'Data Interpretation', 'easy', 'aptitude'),
('A line graph shows enrollment: 2018=500, 2019=600, 2020=550, 2021=700. What is the ratio of 2021 to 2018?', '7:5', '6:5', '5:7', '4:5', 'A', 'Data Interpretation', 'easy', 'aptitude'),
('From a table, Company A revenue: Q1=100, Q2=120, Q3=110, Q4=130 crore. What is total annual revenue?', '460 crore', '440 crore', '420 crore', '480 crore', 'A', 'Data Interpretation', 'easy', 'aptitude'),
('Pie chart: Product A = 120°, B = 90°, C = 60°, D = 90°. What fraction of total does B represent?', '1/4', '1/3', '1/6', '1/8', 'A', 'Data Interpretation', 'medium', 'aptitude'),
('A table shows: Boys 300, Girls 200 in 2020; Boys 350, Girls 250 in 2021. What is % increase in girls?', '25%', '20%', '30%', '15%', 'A', 'Data Interpretation', 'easy', 'aptitude'),
('Sales data: Jan 200, Feb 250, Mar 300. If Apr must maintain 20% growth over Mar, target is?', '360', '300', '320', '340', 'A', 'Data Interpretation', 'medium', 'aptitude'),
('From a bar chart: Group A=30, B=40, C=50, D=20, E=60. What % does E form of total?', '30%', '25%', '20%', '35%', 'A', 'Data Interpretation', 'medium', 'aptitude'),
('Table: City A pop 10L, B=15L, C=8L, D=12L. If City B grows 10%, new population is?', '16.5 L', '16 L', '17 L', '15.5 L', 'A', 'Data Interpretation', 'easy', 'aptitude'),
('Graph shows production cost ₹80/unit, selling price ₹120/unit. If 500 units sold, profit is?', '₹20,000', '₹15,000', '₹25,000', '₹10,000', 'A', 'Data Interpretation', 'easy', 'aptitude'),
('A table shows runs scored per over: 4, 6, 3, 8, 5, 7, 6, 4, 9, 8. Average runs per over?', '6', '5.5', '6.5', '7', 'A', 'Data Interpretation', 'medium', 'aptitude'),
('Exports in 2020: ₹200 crore; 2021: ₹260 crore. Imports 2020: ₹180; 2021: ₹220. Trade balance improved by?', '₹20 crore', '₹40 crore', '₹60 crore', '₹10 crore', 'A', 'Data Interpretation', 'medium', 'aptitude'),
('A table shows error rate: Team A 5%, B 3%, C 7%, D 2%. If total work is 10000 units, which team makes most errors?', 'Team C', 'Team A', 'Team B', 'Team D', 'A', 'Data Interpretation', 'easy', 'aptitude'),
('Revenue grew from ₹500 crore (2019) to ₹800 crore (2023) in 4 years. What is CAGR approximately?', '12.47%', '15%', '10%', '8%', 'A', 'Data Interpretation', 'hard', 'aptitude'),

-- ═══════════════════════════════════════════════════════════
-- PROGRAMMING / CODING QUESTIONS (200)
-- ═══════════════════════════════════════════════════════════

-- Data Structures: Arrays (30 questions)
('What is the time complexity of accessing an element by index in an array?', 'O(1)', 'O(n)', 'O(log n)', 'O(n²)', 'A', 'Arrays', 'easy', 'programming'),
('Which sorting algorithm has worst-case O(n²) but best-case O(n)?', 'Insertion Sort', 'Merge Sort', 'Quick Sort', 'Heap Sort', 'A', 'Arrays', 'easy', 'programming'),
('What is the output of reversing array [1,2,3,4,5]?', '[5,4,3,2,1]', '[1,2,3,4,5]', '[5,4,3,2,1,0]', '[2,4,1,3,5]', 'A', 'Arrays', 'easy', 'programming'),
('Which data structure is used for BFS traversal?', 'Queue', 'Stack', 'Heap', 'Tree', 'A', 'Arrays', 'easy', 'programming'),
('What is the time complexity of merging two sorted arrays of size n?', 'O(n)', 'O(n log n)', 'O(n²)', 'O(log n)', 'A', 'Arrays', 'medium', 'programming'),
('For array [5,3,1,4,2], after one pass of bubble sort (ascending), the array is?', '[3,1,4,2,5]', '[1,2,3,4,5]', '[3,5,1,4,2]', '[1,3,5,4,2]', 'A', 'Arrays', 'medium', 'programming'),
('What is the maximum number of elements that can be stored in an array declared as int arr[5][4]?', '20', '9', '25', '16', 'A', 'Arrays', 'easy', 'programming'),
('Finding the second largest element in an unsorted array of n elements takes at best?', 'O(n)', 'O(n log n)', 'O(n²)', 'O(1)', 'A', 'Arrays', 'medium', 'programming'),
('A circular array of size n uses modulo to wrap around. The next index after (n-1) is?', '0', 'n', 'n-1', '1', 'A', 'Arrays', 'easy', 'programming'),
('Two sum problem: find pair summing to target in O(n) uses which data structure?', 'Hash Map', 'Stack', 'Queue', 'Linked List', 'A', 'Arrays', 'medium', 'programming'),
('In-place array reversal requires additional space of?', 'O(1)', 'O(n)', 'O(log n)', 'O(n²)', 'A', 'Arrays', 'easy', 'programming'),
('Kadane''s algorithm is used to solve which array problem?', 'Maximum Subarray Sum', 'Sorted Search', 'Two Sum', 'Rotation Detection', 'A', 'Arrays', 'medium', 'programming'),
('A sorted and rotated array is searched in O(log n) using?', 'Modified Binary Search', 'Linear Search', 'Jump Search', 'Exponential Search', 'A', 'Arrays', 'hard', 'programming'),
('What is the space complexity of storing a sparse matrix as a 2D array of size n×n?', 'O(n²)', 'O(n)', 'O(1)', 'O(log n)', 'A', 'Arrays', 'easy', 'programming'),
('Prefix sum array is built in O(n) and used to answer range sum queries in?', 'O(1)', 'O(n)', 'O(log n)', 'O(n log n)', 'A', 'Arrays', 'medium', 'programming'),
('Which algorithm finds majority element (>n/2) in O(n) time and O(1) space?', 'Boyer-Moore Voting', 'Quickselect', 'Bitwise XOR', 'Merge Count', 'A', 'Arrays', 'hard', 'programming'),
('Dutch National Flag algorithm sorts an array containing how many distinct values?', '3', '2', '4', 'any', 'A', 'Arrays', 'medium', 'programming'),
('What is the index of last element in a 1D array of 10 elements (0-indexed)?', '9', '10', '8', '11', 'A', 'Arrays', 'easy', 'programming'),
('Floyd''s cycle detection algorithm uses how many pointers?', '2', '1', '3', '4', 'A', 'Arrays', 'medium', 'programming'),
('Given array [1, 0, -1, 3, -2], counting the number of positive elements takes?', 'O(n)', 'O(1)', 'O(log n)', 'O(n²)', 'A', 'Arrays', 'easy', 'programming'),
('Which operation on a sorted array can be done in O(log n)?', 'Search', 'Insertion', 'Deletion', 'All of the above', 'A', 'Arrays', 'easy', 'programming'),
('In row-major order, element [i][j] of m×n matrix is stored at position?', 'i*n + j', 'i*m + j', 'j*m + i', 'j*n + i', 'A', 'Arrays', 'medium', 'programming'),
('Rearranging array so even elements come before odd elements in O(n) is done with?', 'Two-pointer technique', 'Quicksort', 'Heapsort', 'Merge sort', 'A', 'Arrays', 'medium', 'programming'),
('What does array slicing [2:5] return in Python for [0,1,2,3,4,5,6]?', '[2,3,4]', '[2,3,4,5]', '[3,4,5]', '[2,4]', 'A', 'Arrays', 'easy', 'programming'),
('The sliding window technique is most useful for?', 'Finding max sum subarray of size k', 'Binary search', 'Topological sort', 'Finding LCA', 'A', 'Arrays', 'medium', 'programming'),
('What is the time complexity of counting inversions in an array using merge sort?', 'O(n log n)', 'O(n)', 'O(n²)', 'O(log n)', 'A', 'Arrays', 'hard', 'programming'),
('Trapping rainwater problem is solved optimally in?', 'O(n) time, O(1) space', 'O(n²) time', 'O(n log n)', 'O(n) time, O(n) space only', 'A', 'Arrays', 'hard', 'programming'),
('In a sorted array, number of unique elements can be found by removing duplicates in?', 'O(n)', 'O(n²)', 'O(log n)', 'O(1)', 'A', 'Arrays', 'easy', 'programming'),
('Which approach solves the "buy and sell stock" problem to maximize profit in O(n)?', 'Track min price so far', 'Brute force all pairs', 'Sort the array', 'Dynamic programming O(n²)', 'A', 'Arrays', 'medium', 'programming'),
('Longest increasing subsequence of [10,9,2,5,3,7,101,18] has length?', '4', '3', '5', '6', 'A', 'Arrays', 'hard', 'programming'),

-- Trees & Graphs (25 questions)
('What is the height of a complete binary tree with n nodes?', 'floor(log₂n)', 'n', 'n/2', 'log₂n + 1', 'A', 'Trees & Graphs', 'easy', 'programming'),
('In a Binary Search Tree, in-order traversal gives?', 'Sorted ascending output', 'Sorted descending output', 'Level order', 'Random order', 'A', 'Trees & Graphs', 'easy', 'programming'),
('DFS on a graph uses which data structure internally?', 'Stack', 'Queue', 'Priority Queue', 'Deque', 'A', 'Trees & Graphs', 'easy', 'programming'),
('Dijkstra''s algorithm finds the shortest path in a graph with?', 'Non-negative weights', 'Negative weights only', 'Any weights', 'Unweighted graphs only', 'A', 'Trees & Graphs', 'medium', 'programming'),
('A tree with n nodes has exactly how many edges?', 'n-1', 'n', 'n+1', 'n/2', 'A', 'Trees & Graphs', 'easy', 'programming'),
('Which traversal visits root, then left subtree, then right subtree?', 'Pre-order', 'In-order', 'Post-order', 'Level-order', 'A', 'Trees & Graphs', 'easy', 'programming'),
('Minimum spanning tree of a graph is found using which algorithm?', 'Kruskal''s or Prim''s', 'Dijkstra''s', 'Bellman-Ford', 'Floyd-Warshall', 'A', 'Trees & Graphs', 'medium', 'programming'),
('Cycle detection in an undirected graph can be done using?', 'Union-Find (Disjoint Set)', 'Dijkstra''s', 'Topological Sort', 'DFS count', 'A', 'Trees & Graphs', 'medium', 'programming'),
('A balanced BST with n nodes has search complexity?', 'O(log n)', 'O(n)', 'O(1)', 'O(n log n)', 'A', 'Trees & Graphs', 'easy', 'programming'),
('AVL trees maintain balance by ensuring height difference between left and right subtrees is?', 'At most 1', 'Exactly 0', 'At most 2', 'At most 3', 'A', 'Trees & Graphs', 'medium', 'programming'),
('In a max-heap, the root always contains?', 'Maximum element', 'Minimum element', 'Median element', 'Second largest', 'A', 'Trees & Graphs', 'easy', 'programming'),
('Topological sort can only be applied to?', 'Directed Acyclic Graphs (DAG)', 'Undirected graphs', 'Weighted graphs', 'Complete graphs', 'A', 'Trees & Graphs', 'medium', 'programming'),
('Time complexity of BFS on a graph with V vertices and E edges is?', 'O(V + E)', 'O(V)', 'O(E log V)', 'O(V²)', 'A', 'Trees & Graphs', 'medium', 'programming'),
('Bellman-Ford algorithm handles?', 'Negative weight edges', 'Only positive weights', 'Only unweighted graphs', 'Graphs with cycles only', 'A', 'Trees & Graphs', 'medium', 'programming'),
('Number of leaf nodes in a full binary tree with n internal nodes is?', 'n+1', 'n', 'n-1', '2n', 'A', 'Trees & Graphs', 'hard', 'programming'),
('Red-Black tree is self-balancing. Its worst-case height is at most?', '2 log₂(n+1)', 'log₂n', 'n', 'n/2', 'A', 'Trees & Graphs', 'hard', 'programming'),
('Floyd-Warshall algorithm finds?', 'All-pairs shortest paths', 'Single source shortest path', 'MST', 'Euler path', 'A', 'Trees & Graphs', 'medium', 'programming'),
('A graph is bipartite if and only if it has no?', 'Odd-length cycle', 'Even-length cycle', 'Negative cycle', 'Self-loop', 'A', 'Trees & Graphs', 'hard', 'programming'),
('Lowest Common Ancestor (LCA) of two nodes in a BST can be found in?', 'O(h) where h is height', 'O(n)', 'O(1)', 'O(n²)', 'A', 'Trees & Graphs', 'medium', 'programming'),
('Trie data structure is commonly used for?', 'Prefix search in strings', 'Shortest path', 'Heap operations', 'Sorting numbers', 'A', 'Trees & Graphs', 'medium', 'programming'),
('Which graph algorithm detects strongly connected components?', 'Kosaraju''s / Tarjan''s', 'Kruskal''s', 'Prim''s', 'Dijkstra''s', 'A', 'Trees & Graphs', 'hard', 'programming'),
('Serialize and deserialize a binary tree requires?', 'Pre-order traversal with null markers', 'In-order only', 'Post-order only', 'Level-order only', 'A', 'Trees & Graphs', 'hard', 'programming'),
('In segment tree, each query and update takes?', 'O(log n)', 'O(n)', 'O(1)', 'O(n log n)', 'A', 'Trees & Graphs', 'hard', 'programming'),
('Number of edges in a complete graph with n vertices is?', 'n(n-1)/2', 'n²', 'n-1', 'n(n+1)/2', 'A', 'Trees & Graphs', 'medium', 'programming'),
('A B-tree of order m has at most how many children per node?', 'm', 'm-1', 'm+1', '2m', 'A', 'Trees & Graphs', 'hard', 'programming'),

-- Sorting & Searching Algorithms (25 questions)
('What is the best-case time complexity of Quick Sort?', 'O(n log n)', 'O(n²)', 'O(n)', 'O(log n)', 'A', 'Sorting & Searching', 'easy', 'programming'),
('Which sorting algorithm is stable and runs in O(n log n) worst case?', 'Merge Sort', 'Quick Sort', 'Heap Sort', 'Shell Sort', 'A', 'Sorting & Searching', 'easy', 'programming'),
('Binary search requires the array to be?', 'Sorted', 'Unsorted', 'Partially sorted', 'Unique elements only', 'A', 'Sorting & Searching', 'easy', 'programming'),
('Counting Sort works in O(n+k) where k is?', 'Range of input values', 'Number of elements', 'Number of comparisons', 'Stack depth', 'A', 'Sorting & Searching', 'medium', 'programming'),
('Which sort is most efficient for nearly-sorted arrays?', 'Insertion Sort', 'Quick Sort', 'Merge Sort', 'Radix Sort', 'A', 'Sorting & Searching', 'medium', 'programming'),
('Heap Sort builds a heap in O(n) then extracts elements in?', 'O(n log n)', 'O(n)', 'O(n²)', 'O(log n)', 'A', 'Sorting & Searching', 'medium', 'programming'),
('Interpolation Search works better than binary search when data is?', 'Uniformly distributed', 'Skewed', 'Partially sorted', 'Random', 'A', 'Sorting & Searching', 'medium', 'programming'),
('Radix Sort is a non-comparison sort with time complexity?', 'O(d*(n+k))', 'O(n log n)', 'O(n²)', 'O(n)', 'A', 'Sorting & Searching', 'medium', 'programming'),
('What is the worst-case comparisons in binary search for n elements?', 'floor(log₂n) + 1', 'n', 'n/2', 'n²', 'A', 'Sorting & Searching', 'easy', 'programming'),
('Bucket Sort works well when input is?', 'Uniformly distributed over a range', 'Sorted', 'In reverse order', 'Random integers only', 'A', 'Sorting & Searching', 'medium', 'programming'),
('Shell Sort is an extension of which algorithm?', 'Insertion Sort', 'Bubble Sort', 'Selection Sort', 'Merge Sort', 'A', 'Sorting & Searching', 'medium', 'programming'),
('Quickselect algorithm finds the kth smallest element in?', 'O(n) average', 'O(n log n)', 'O(n²)', 'O(log n)', 'A', 'Sorting & Searching', 'hard', 'programming'),
('Stable sort maintains the relative order of equal elements. Which of these is NOT stable?', 'Heap Sort', 'Merge Sort', 'Insertion Sort', 'Bubble Sort', 'A', 'Sorting & Searching', 'medium', 'programming'),
('External sorting is used when?', 'Data doesn''t fit in RAM', 'Data is sorted', 'Fast sorting needed', 'Small datasets', 'A', 'Sorting & Searching', 'easy', 'programming'),
('Timsort (used in Python) combines which two algorithms?', 'Merge Sort + Insertion Sort', 'Quick Sort + Bubble Sort', 'Heap Sort + Merge Sort', 'Counting + Radix Sort', 'A', 'Sorting & Searching', 'hard', 'programming'),
('Jump Search divides the array into blocks of size?', '√n', 'n/2', 'log n', 'n/3', 'A', 'Sorting & Searching', 'medium', 'programming'),
('In Quick Sort, choosing a bad pivot leads to worst case. An example of bad pivot is?', 'Smallest or largest element always', 'Middle element', 'Random element', 'Median element', 'A', 'Sorting & Searching', 'medium', 'programming'),
('Merge Sort on linked list is preferred over Quick Sort because?', 'No random access needed', 'It''s faster', 'Less space used', 'Easier to implement', 'A', 'Sorting & Searching', 'hard', 'programming'),
('Ternary search works on monotonically increasing/decreasing arrays and is of complexity?', 'O(log₃n)', 'O(log₂n)', 'O(n)', 'O(n log n)', 'A', 'Sorting & Searching', 'hard', 'programming'),
('Average case time complexity of Quick Sort is?', 'O(n log n)', 'O(n²)', 'O(n)', 'O(log n)', 'A', 'Sorting & Searching', 'easy', 'programming'),
('Finding a peak element in an array can be done in O(log n) using?', 'Modified Binary Search', 'Linear Scan', 'Merge Sort', 'Two-pointer', 'A', 'Sorting & Searching', 'hard', 'programming'),
('Which search is used in spell checkers (finds words within edit distance)?', 'BK-tree search', 'Binary search', 'Linear search', 'Hash search', 'A', 'Sorting & Searching', 'hard', 'programming'),
('Cycle sort minimizes the number of?', 'Write operations', 'Comparisons', 'Swaps', 'Iterations', 'A', 'Sorting & Searching', 'hard', 'programming'),
('Fibonacci search reduces the search space using?', 'Fibonacci numbers as indices', 'Golden ratio', 'Modular arithmetic', 'Binary splits', 'A', 'Sorting & Searching', 'hard', 'programming'),
('For sorting 1 million integers between 0-999, the most efficient algorithm is?', 'Counting Sort', 'Merge Sort', 'Quick Sort', 'Heap Sort', 'A', 'Sorting & Searching', 'medium', 'programming'),

-- Dynamic Programming (20 questions)
('The 0/1 Knapsack problem has time complexity?', 'O(n*W)', 'O(n²)', 'O(n log n)', 'O(2ⁿ) only', 'A', 'Dynamic Programming', 'medium', 'programming'),
('Fibonacci sequence computed using memoization has time complexity?', 'O(n)', 'O(2ⁿ)', 'O(n²)', 'O(log n)', 'A', 'Dynamic Programming', 'easy', 'programming'),
('Longest Common Subsequence of two strings of length m and n takes?', 'O(m*n)', 'O(m+n)', 'O(m²)', 'O(n log m)', 'A', 'Dynamic Programming', 'medium', 'programming'),
('Edit distance (Levenshtein distance) problem has how many subproblems?', 'O(m*n)', 'O(m+n)', 'O(m²+n²)', 'O(min(m,n))', 'A', 'Dynamic Programming', 'medium', 'programming'),
('Matrix Chain Multiplication (MCM) uses DP with time complexity?', 'O(n³)', 'O(n²)', 'O(n)', 'O(n⁴)', 'A', 'Dynamic Programming', 'hard', 'programming'),
('The coin change problem (minimum coins) is best solved by?', 'Bottom-up DP', 'Greedy always', 'BFS', 'DFS backtracking', 'A', 'Dynamic Programming', 'medium', 'programming'),
('Longest Palindromic Subsequence of string "BBABCBCAB" has length?', '7', '5', '6', '8', 'A', 'Dynamic Programming', 'hard', 'programming'),
('DP problem requires two properties: overlapping subproblems and?', 'Optimal substructure', 'Greedy choice', 'Divide and conquer', 'Memoization', 'A', 'Dynamic Programming', 'easy', 'programming'),
('Egg dropping problem with n eggs and k floors has DP complexity?', 'O(n*k²)', 'O(n*k)', 'O(n²*k)', 'O(k!)', 'A', 'Dynamic Programming', 'hard', 'programming'),
('Rod cutting problem: rod of length n with price list. Max revenue is found in?', 'O(n²)', 'O(n)', 'O(n³)', 'O(n log n)', 'A', 'Dynamic Programming', 'medium', 'programming'),
('Catalan numbers (used in balanced parentheses, BST counting) follow what recurrence?', 'C(n) = sum of C(i)*C(n-i-1)', 'C(n) = C(n-1) + C(n-2)', 'C(n) = 2*C(n-1)', 'C(n) = C(n/2)²', 'A', 'Dynamic Programming', 'hard', 'programming'),
('Maximum profit from stock prices, allowed to buy/sell multiple times is solved in?', 'O(n)', 'O(n²)', 'O(n log n)', 'O(2ⁿ)', 'A', 'Dynamic Programming', 'medium', 'programming'),
('Subset sum problem checks if any subset sums to target. Its complexity is?', 'O(n*target)', 'O(n²)', 'O(2ⁿ) only', 'O(n log target)', 'A', 'Dynamic Programming', 'medium', 'programming'),
('Interleaving Strings problem checks if S3 is an interleaving of S1 and S2 in?', 'O(m*n)', 'O(m+n)', 'O(m²+n²)', 'O(m*n²)', 'A', 'Dynamic Programming', 'hard', 'programming'),
('Palindrome Partitioning (min cuts) has DP complexity?', 'O(n²)', 'O(n)', 'O(n³)', 'O(n log n)', 'A', 'Dynamic Programming', 'hard', 'programming'),
('Number of ways to climb n stairs (1 or 2 at a time) is given by?', 'Fibonacci(n+1)', 'n!', '2ⁿ', 'n²', 'A', 'Dynamic Programming', 'easy', 'programming'),
('Optimal BST problem has time complexity?', 'O(n³)', 'O(n²)', 'O(n log n)', 'O(n)', 'A', 'Dynamic Programming', 'hard', 'programming'),
('Word break problem (check if string can be segmented using dictionary) uses?', 'DP + Hashing', 'Greedy', 'Pure recursion only', 'Sorting', 'A', 'Dynamic Programming', 'medium', 'programming'),
('Minimum path sum in a grid from top-left to bottom-right uses DP with complexity?', 'O(m*n)', 'O(m+n)', 'O(m²)', 'O(n log m)', 'A', 'Dynamic Programming', 'easy', 'programming'),
('Weighted Job Scheduling problem (max profit non-overlapping jobs) uses?', 'DP + Binary Search', 'Greedy only', 'BFS', 'Pure DP only', 'A', 'Dynamic Programming', 'hard', 'programming'),

-- OOP Concepts (25 questions)
('Which OOP concept wraps data and methods into a single unit?', 'Encapsulation', 'Inheritance', 'Polymorphism', 'Abstraction', 'A', 'OOP Concepts', 'easy', 'programming'),
('Method overriding is an example of?', 'Runtime polymorphism', 'Compile-time polymorphism', 'Encapsulation', 'Abstraction', 'A', 'OOP Concepts', 'easy', 'programming'),
('Which keyword prevents a class from being inherited in Java?', 'final', 'static', 'abstract', 'private', 'A', 'OOP Concepts', 'easy', 'programming'),
('In Python, which method is called when an object is created?', '__init__', '__new__', '__create__', '__start__', 'A', 'OOP Concepts', 'easy', 'programming'),
('Which design pattern ensures only one instance of a class exists?', 'Singleton', 'Factory', 'Observer', 'Decorator', 'A', 'OOP Concepts', 'medium', 'programming'),
('Abstract class vs Interface: in Java, an interface can have?', 'Multiple inheritance', 'Concrete methods only', 'Instance variables', 'Constructors', 'A', 'OOP Concepts', 'medium', 'programming'),
('Liskov Substitution Principle states?', 'Subclass should be substitutable for its superclass', 'Classes should be open for modification', 'Functions depend on concrete implementations', 'One class one responsibility', 'A', 'OOP Concepts', 'medium', 'programming'),
('Method overloading is resolved at?', 'Compile time', 'Runtime', 'Link time', 'Load time', 'A', 'OOP Concepts', 'easy', 'programming'),
('In C++, virtual functions enable?', 'Dynamic dispatch', 'Static binding', 'Multiple inheritance only', 'Memory sharing', 'A', 'OOP Concepts', 'medium', 'programming'),
('Which access modifier makes a member accessible within the same class only?', 'private', 'public', 'protected', 'default', 'A', 'OOP Concepts', 'easy', 'programming'),
('Observer design pattern is used for?', 'Event handling / publish-subscribe', 'Object creation', 'Structural composition', 'Algorithm selection', 'A', 'OOP Concepts', 'medium', 'programming'),
('Composition over Inheritance principle recommends?', 'Using "has-a" over "is-a" relationship', 'Always using inheritance', 'Avoiding objects', 'Using static methods', 'A', 'OOP Concepts', 'medium', 'programming'),
('Which of SOLID principles states a class should have only one reason to change?', 'Single Responsibility', 'Open/Closed', 'Dependency Inversion', 'Interface Segregation', 'A', 'OOP Concepts', 'medium', 'programming'),
('Diamond problem in multiple inheritance is resolved in Python using?', 'MRO (C3 linearization)', 'Interfaces only', 'Abstract classes', 'Virtual functions', 'A', 'OOP Concepts', 'hard', 'programming'),
('A deep copy duplicates?', 'The object and all objects it references', 'Only the reference', 'Only primitive fields', 'Only the class structure', 'A', 'OOP Concepts', 'medium', 'programming'),
('Factory Method pattern defers object creation to?', 'Subclasses', 'The calling client', 'A static method', 'A configuration file', 'A', 'OOP Concepts', 'medium', 'programming'),
('In Java, String is?', 'Immutable', 'Mutable', 'Abstract', 'Final class without immutability', 'A', 'OOP Concepts', 'easy', 'programming'),
('Duck typing is a concept in?', 'Dynamically typed languages', 'Statically typed languages only', 'Compiled languages', 'SQL databases', 'A', 'OOP Concepts', 'medium', 'programming'),
('Which OOP principle hides implementation complexity from the user?', 'Abstraction', 'Encapsulation', 'Polymorphism', 'Inheritance', 'A', 'OOP Concepts', 'easy', 'programming'),
('In Python, @classmethod receives which parameter as first argument?', 'cls (class itself)', 'self (instance)', 'None', 'super()', 'A', 'OOP Concepts', 'medium', 'programming'),
('Strategy design pattern allows?', 'Swapping algorithms at runtime', 'Creating families of objects', 'Adding responsibilities dynamically', 'Controlling object access', 'A', 'OOP Concepts', 'medium', 'programming'),
('Covariance in Java allows a method in subclass to have a?', 'More specific return type', 'More general return type', 'Different parameter types', 'Same return type only', 'A', 'OOP Concepts', 'hard', 'programming'),
('GRASP pattern "High Cohesion" means?', 'A class has clearly related responsibilities', 'Classes are loosely connected', 'All methods are static', 'Few dependencies between classes', 'A', 'OOP Concepts', 'hard', 'programming'),
('In Python, __slots__ is used to?', 'Restrict instance attributes and save memory', 'Enable multiple inheritance', 'Create abstract methods', 'Override operators', 'A', 'OOP Concepts', 'hard', 'programming'),
('Template Method pattern defines the skeleton of an algorithm, deferring some steps to?', 'Subclasses', 'Interfaces', 'External configuration', 'The client', 'A', 'OOP Concepts', 'medium', 'programming'),

-- Database (SQL) (20 questions)
('Which SQL command retrieves data from a table?', 'SELECT', 'GET', 'FETCH', 'READ', 'A', 'Database SQL', 'easy', 'programming'),
('Which clause filters rows after aggregation?', 'HAVING', 'WHERE', 'GROUP BY', 'ORDER BY', 'A', 'Database SQL', 'easy', 'programming'),
('Which JOIN returns all rows from both tables, matching where possible?', 'FULL OUTER JOIN', 'INNER JOIN', 'LEFT JOIN', 'CROSS JOIN', 'A', 'Database SQL', 'medium', 'programming'),
('Normalization removes?', 'Data redundancy and anomalies', 'Indexes', 'Foreign keys', 'Stored procedures', 'A', 'Database SQL', 'easy', 'programming'),
('ACID stands for?', 'Atomicity, Consistency, Isolation, Durability', 'Access, Control, Index, Data', 'Atomic, Consistent, Incremental, Durable', 'Auto, Commit, Isolate, Define', 'A', 'Database SQL', 'easy', 'programming'),
('Which SQL command creates a virtual table based on a query?', 'CREATE VIEW', 'CREATE TABLE', 'CREATE INDEX', 'CREATE SCHEMA', 'A', 'Database SQL', 'easy', 'programming'),
('A primary key constraint enforces?', 'Uniqueness + Not Null', 'Uniqueness only', 'Not Null only', 'Foreign reference', 'A', 'Database SQL', 'easy', 'programming'),
('Which SQL function returns the number of rows in a group?', 'COUNT()', 'SUM()', 'AVG()', 'MAX()', 'A', 'Database SQL', 'easy', 'programming'),
('What does a clustered index do?', 'Physically orders the table data by the index key', 'Creates a separate sorted structure', 'Applies to multiple columns only', 'Only works on primary keys', 'A', 'Database SQL', 'medium', 'programming'),
('Window functions like ROW_NUMBER() use which clause?', 'OVER(PARTITION BY)', 'GROUP BY', 'HAVING', 'WHERE', 'A', 'Database SQL', 'medium', 'programming'),
('Which isolation level prevents dirty reads but allows non-repeatable reads?', 'READ COMMITTED', 'READ UNCOMMITTED', 'REPEATABLE READ', 'SERIALIZABLE', 'A', 'Database SQL', 'hard', 'programming'),
('Deadlock in a database occurs when?', 'Two transactions wait for each other''s locks', 'A transaction runs too long', 'Index gets corrupted', 'Too many connections open', 'A', 'Database SQL', 'medium', 'programming'),
('Which command permanently removes a table and its structure?', 'DROP TABLE', 'DELETE FROM', 'TRUNCATE TABLE', 'REMOVE TABLE', 'A', 'Database SQL', 'easy', 'programming'),
('Difference between DELETE and TRUNCATE?', 'DELETE is DML (logged), TRUNCATE is DDL (faster)', 'Both are identical', 'TRUNCATE allows WHERE clause', 'DELETE cannot be rolled back', 'A', 'Database SQL', 'medium', 'programming'),
('3NF (Third Normal Form) requires?', 'No transitive dependencies', 'No partial dependencies only', 'No multi-valued dependencies', 'All keys to be composite', 'A', 'Database SQL', 'hard', 'programming'),
('B+ trees are used in database indexes because?', 'All data in leaf nodes, good range queries', 'Faster than hash indexes always', 'Less storage than B-trees', 'Support only equality searches', 'A', 'Database SQL', 'hard', 'programming'),
('EXPLAIN statement in SQL is used for?', 'Analyzing query execution plan', 'Documenting a stored procedure', 'Creating a new user', 'Checking database version', 'A', 'Database SQL', 'medium', 'programming'),
('Which statement is used to modify an existing table structure?', 'ALTER TABLE', 'MODIFY TABLE', 'UPDATE TABLE', 'CHANGE TABLE', 'A', 'Database SQL', 'easy', 'programming'),
('CAP theorem states a distributed system can guarantee at most?', '2 of Consistency, Availability, Partition tolerance', 'All 3 properties simultaneously', 'Only consistency always', 'Only availability and partition', 'A', 'Database SQL', 'hard', 'programming'),
('Which aggregate function ignores NULL values?', 'All aggregate functions (SUM, AVG, COUNT)', 'Only COUNT(*)', 'Only SUM', 'None - all include NULLs', 'A', 'Database SQL', 'medium', 'programming'),

-- Operating Systems (20 questions)
('Round Robin scheduling uses a?', 'Fixed time quantum', 'Variable time quantum', 'Priority queue', 'FIFO only', 'A', 'Operating Systems', 'easy', 'programming'),
('Deadlock prevention technique that breaks circular wait is?', 'Resource ordering', 'Banker''s algorithm', 'Kill all processes', 'Preemption only', 'A', 'Operating Systems', 'medium', 'programming'),
('Thrashing occurs when?', 'Excessive page swapping reduces CPU utilization', 'CPU is overloaded with processes', 'Memory is completely full', 'All processes are idle', 'A', 'Operating Systems', 'medium', 'programming'),
('Which page replacement algorithm has minimum page faults theoretically?', 'Optimal (OPT)', 'LRU', 'FIFO', 'Clock', 'A', 'Operating Systems', 'easy', 'programming'),
('Context switching overhead includes saving/restoring?', 'CPU registers and process state', 'Only program counter', 'Only stack pointer', 'Disk state', 'A', 'Operating Systems', 'easy', 'programming'),
('Semaphore is used to solve?', 'Critical section and synchronization', 'Deadlock detection', 'Memory allocation', 'File operations', 'A', 'Operating Systems', 'easy', 'programming'),
('Virtual memory allows a process to?', 'Use more memory than physically available', 'Access all physical RAM', 'Share registers with other processes', 'Execute without a CPU', 'A', 'Operating Systems', 'easy', 'programming'),
('Banker''s algorithm is used for?', 'Deadlock avoidance', 'Memory allocation only', 'Scheduling', 'File system management', 'A', 'Operating Systems', 'medium', 'programming'),
('In a 32-bit system with 4KB pages, the page table has how many entries?', '2²⁰ (1M entries)', '2¹² entries', '2¹⁶ entries', '2³² entries', 'A', 'Operating Systems', 'hard', 'programming'),
('Priority inversion problem is solved using?', 'Priority inheritance', 'Deadlock detection', 'Semaphores', 'Mutual exclusion', 'A', 'Operating Systems', 'hard', 'programming'),
('Fork() system call creates?', 'An exact copy of the current process', 'A new thread', 'A new kernel process', 'A new file descriptor', 'A', 'Operating Systems', 'easy', 'programming'),
('Which scheduling algorithm is best for I/O-bound processes?', 'Shortest Job First (SJF)', 'FCFS', 'Round Robin', 'LIFO', 'A', 'Operating Systems', 'medium', 'programming'),
('Copy-on-Write (COW) optimization is used in?', 'fork() to delay actual memory copy', 'file read operations', 'network transfers', 'swap space management', 'A', 'Operating Systems', 'medium', 'programming'),
('An inode in Unix/Linux stores?', 'File metadata (not filename)', 'File content only', 'Directory structure', 'Filename and path', 'A', 'Operating Systems', 'medium', 'programming'),
('TLB (Translation Lookaside Buffer) is a cache for?', 'Page table entries', 'Disk blocks', 'CPU instructions', 'Network packets', 'A', 'Operating Systems', 'medium', 'programming'),
('Which mutex problem can occur if a thread dies while holding a lock?', 'Deadlock', 'Starvation', 'Race condition', 'Livelock', 'A', 'Operating Systems', 'medium', 'programming'),
('Demand paging loads pages into memory?', 'Only when needed (on page fault)', 'All at program start', 'Randomly', 'Based on priority', 'A', 'Operating Systems', 'easy', 'programming'),
('Pipes in Unix allow?', 'IPC between parent and child processes', 'Network communication', 'Shared memory access', 'Device I/O', 'A', 'Operating Systems', 'easy', 'programming'),
('The difference between process and thread is?', 'Threads share process memory; processes don''t', 'Processes are faster', 'Threads need separate OS resources', 'No difference', 'A', 'Operating Systems', 'easy', 'programming'),
('Which memory allocation strategy avoids external fragmentation?', 'Paging', 'Contiguous allocation', 'Segmentation', 'Fixed partitioning', 'A', 'Operating Systems', 'medium', 'programming'),

-- Computer Networks (15 questions)
('TCP provides which type of service?', 'Reliable, connection-oriented', 'Unreliable, connectionless', 'Fast, unreliable', 'Broadcast only', 'A', 'Computer Networks', 'easy', 'programming'),
('Which layer of OSI model handles routing?', 'Network Layer (Layer 3)', 'Transport Layer', 'Data Link Layer', 'Session Layer', 'A', 'Computer Networks', 'easy', 'programming'),
('HTTP is a stateless protocol. State can be maintained using?', 'Cookies and sessions', 'IP addresses only', 'TCP connections', 'DNS', 'A', 'Computer Networks', 'easy', 'programming'),
('DNS converts?', 'Domain names to IP addresses', 'IP to MAC addresses', 'Ports to protocols', 'HTTP to HTTPS', 'A', 'Computer Networks', 'easy', 'programming'),
('Which protocol assigns IP addresses dynamically?', 'DHCP', 'ARP', 'ICMP', 'SMTP', 'A', 'Computer Networks', 'easy', 'programming'),
('HTTPS uses port?', '443', '80', '8080', '22', 'A', 'Computer Networks', 'easy', 'programming'),
('Three-way handshake in TCP consists of?', 'SYN, SYN-ACK, ACK', 'SYN, ACK, FIN', 'SYN, SYN, ACK', 'CONNECT, ACK, GO', 'A', 'Computer Networks', 'medium', 'programming'),
('Subnetting divides a network to?', 'Reduce broadcast domain and improve routing', 'Increase bandwidth', 'Remove firewalls', 'Connect to internet', 'A', 'Computer Networks', 'medium', 'programming'),
('Which protocol is used for email retrieval from server?', 'IMAP/POP3', 'SMTP', 'FTP', 'HTTP', 'A', 'Computer Networks', 'easy', 'programming'),
('ARP resolves?', 'IP address to MAC address', 'MAC to IP', 'IP to domain name', 'Port to service', 'A', 'Computer Networks', 'medium', 'programming'),
('NAT (Network Address Translation) allows?', 'Multiple private IPs to share one public IP', 'Filtering of packets', 'Encryption of data', 'Load balancing', 'A', 'Computer Networks', 'medium', 'programming'),
('Which algorithm is used in distance-vector routing?', 'Bellman-Ford', 'Dijkstra', 'Floyd-Warshall', 'A*', 'A', 'Computer Networks', 'medium', 'programming'),
('Classless Inter-Domain Routing (CIDR) notation 192.168.1.0/24 represents?', '256 host addresses (254 usable)', '24 host addresses', '192 hosts', 'Class C with 16 hosts', 'A', 'Computer Networks', 'hard', 'programming'),
('SSL/TLS handshake uses which cryptography for key exchange?', 'Asymmetric (public-key)', 'Symmetric only', 'Hash functions only', 'No encryption', 'A', 'Computer Networks', 'hard', 'programming'),
('Congestion control in TCP is handled by?', 'Slow start, congestion avoidance, fast retransmit', 'UDP handshakes', 'Router queuing only', 'Application layer only', 'A', 'Computer Networks', 'hard', 'programming'),

-- Python Programming (20 questions)
('What does list.append() do in Python?', 'Adds an element to the end of the list', 'Adds to beginning', 'Sorts the list', 'Removes last element', 'A', 'Python Programming', 'easy', 'programming'),
('What is the output of: print(type([]))', '<class ''list''>', '<class ''tuple''>', '<class ''set''>', '<class ''array''>', 'A', 'Python Programming', 'easy', 'programming'),
('Python uses which memory management technique?', 'Reference counting + Garbage collection', 'Manual memory management', 'Stack-only allocation', 'OS-managed only', 'A', 'Python Programming', 'medium', 'programming'),
('What is a generator in Python?', 'A function that yields values lazily', 'A class that creates objects', 'A built-in module', 'A list comprehension', 'A', 'Python Programming', 'medium', 'programming'),
('The GIL (Global Interpreter Lock) in CPython prevents?', 'True parallel execution of multiple threads', 'Multiprocessing', 'Async I/O', 'File operations', 'A', 'Python Programming', 'medium', 'programming'),
('What does *args and **kwargs allow in a function?', 'Variable positional and keyword arguments', 'Only keyword arguments', 'Only positional arguments', 'Fixed argument count', 'A', 'Python Programming', 'medium', 'programming'),
('List comprehension [x*2 for x in range(5)] produces?', '[0, 2, 4, 6, 8]', '[1, 2, 3, 4, 5]', '[0, 1, 2, 3, 4]', '[2, 4, 6, 8, 10]', 'A', 'Python Programming', 'easy', 'programming'),
('What is the time complexity of dict lookup in Python (average)?', 'O(1)', 'O(n)', 'O(log n)', 'O(n²)', 'A', 'Python Programming', 'easy', 'programming'),
('Python decorators are used to?', 'Modify function behavior without changing source code', 'Create class instances', 'Handle exceptions', 'Manage memory', 'A', 'Python Programming', 'medium', 'programming'),
('What does "with" statement ensure in Python?', 'Proper resource cleanup (context manager)', 'Loop execution', 'Conditional execution', 'Exception suppression', 'A', 'Python Programming', 'medium', 'programming'),
('What is the output of: print(2**10)?', '1024', '20', '1000', '512', 'A', 'Python Programming', 'easy', 'programming'),
('Lambda function in Python is?', 'An anonymous single-expression function', 'A named multi-line function', 'A class method', 'A module import', 'A', 'Python Programming', 'easy', 'programming'),
('Python''s "is" operator checks?', 'Object identity (same memory address)', 'Value equality', 'Type equality', 'Size equality', 'A', 'Python Programming', 'medium', 'programming'),
('The @property decorator in Python creates?', 'A getter method accessed like an attribute', 'A class attribute', 'A static method', 'An abstract method', 'A', 'Python Programming', 'medium', 'programming'),
('Which module is used for async programming in Python?', 'asyncio', 'threading', 'multiprocessing', 'concurrent', 'A', 'Python Programming', 'medium', 'programming'),
('What does enumerate() do in Python?', 'Returns index-value pairs from an iterable', 'Sorts elements', 'Filters elements', 'Maps a function', 'A', 'Python Programming', 'easy', 'programming'),
('Python''s "collections.defaultdict" vs regular dict?', 'Returns default value for missing keys', 'Faster for all operations', 'Sorted by default', 'Thread-safe', 'A', 'Python Programming', 'medium', 'programming'),
('What is the output of: [1,2,3] + [4,5]?', '[1, 2, 3, 4, 5]', 'Error', '[1, 2, 3, [4, 5]]', '[[1,2,3], [4,5]]', 'A', 'Python Programming', 'easy', 'programming'),
('Python metaclass is used to?', 'Control class creation', 'Speed up execution', 'Handle I/O', 'Manage threads', 'A', 'Python Programming', 'hard', 'programming'),
('The zip() function in Python?', 'Combines iterables element-wise', 'Compresses files', 'Joins strings', 'Flattens nested lists', 'A', 'Python Programming', 'easy', 'programming'),

-- Java Programming (20 questions)
('Java is platform-independent because of?', 'JVM (Java Virtual Machine)', 'JDK (Java Development Kit)', 'JRE only', 'Byte code without JVM', 'A', 'Java Programming', 'easy', 'programming'),
('What is autoboxing in Java?', 'Automatic conversion between primitives and wrapper classes', 'Memory optimization', 'Type casting', 'Object serialization', 'A', 'Java Programming', 'easy', 'programming'),
('In Java, String pool stores?', 'Interned string literals for reuse', 'All String objects', 'Only string constants > 10 chars', 'Encrypted strings', 'A', 'Java Programming', 'medium', 'programming'),
('Java Collections: which is thread-safe?', 'ConcurrentHashMap', 'HashMap', 'ArrayList', 'LinkedList', 'A', 'Java Programming', 'medium', 'programming'),
('What does "synchronized" keyword do in Java?', 'Allows only one thread to access the block at a time', 'Speeds up execution', 'Prevents inheritance', 'Forces garbage collection', 'A', 'Java Programming', 'medium', 'programming'),
('What is the output of: System.out.println(1 + 2 + "3")?', '"33"', '"123"', '6', '"6"', 'A', 'Java Programming', 'medium', 'programming'),
('Which Java 8 feature allows passing functions as arguments?', 'Lambda expressions', 'Generics', 'Annotations', 'Reflection', 'A', 'Java Programming', 'easy', 'programming'),
('Java''s Optional class is used to?', 'Handle potentially null values explicitly', 'Create optional parameters', 'Make variables optional', 'Store optional configurations', 'A', 'Java Programming', 'medium', 'programming'),
('What is the difference between == and equals() in Java?', '== compares references, equals() compares content', 'Both compare references', 'Both compare content', '== compares content, equals() compares references', 'A', 'Java Programming', 'easy', 'programming'),
('Java Stream API allows?', 'Functional-style operations on collections', 'Network streaming', 'File I/O only', 'Thread management', 'A', 'Java Programming', 'medium', 'programming'),
('What is a checked exception in Java?', 'Must be caught or declared in method signature', 'Caught at runtime only', 'Never needs to be caught', 'A RuntimeException subclass', 'A', 'Java Programming', 'medium', 'programming'),
('Java''s garbage collector uses primarily?', 'Mark-and-sweep algorithm', 'Reference counting', 'Manual freeing', 'Stack-based deallocation', 'A', 'Java Programming', 'medium', 'programming'),
('Which keyword makes a variable''s value visible across threads immediately?', 'volatile', 'synchronized', 'final', 'static', 'A', 'Java Programming', 'hard', 'programming'),
('Functional interface in Java has?', 'Exactly one abstract method', 'No methods', 'Only default methods', 'Multiple abstract methods', 'A', 'Java Programming', 'medium', 'programming'),
('The try-with-resources statement in Java?', 'Automatically closes resources implementing AutoCloseable', 'Retries failed operations', 'Catches all exceptions', 'Prevents deadlocks', 'A', 'Java Programming', 'medium', 'programming'),
('What does static inner class mean in Java?', 'Does not hold reference to outer class', 'Can only have static methods', 'Cannot be instantiated', 'Is loaded at JVM start', 'A', 'Java Programming', 'hard', 'programming'),
('Java''s CompletableFuture is used for?', 'Asynchronous programming', 'File operations', 'Database access', 'GUI rendering', 'A', 'Java Programming', 'hard', 'programming'),
('Which Java collection maintains insertion order and allows duplicates?', 'ArrayList', 'HashSet', 'TreeSet', 'HashMap', 'A', 'Java Programming', 'easy', 'programming'),
('Covariant return type in Java means?', 'Overriding method can return a subtype', 'Same return type always required', 'Methods share return types', 'Return types are cast automatically', 'A', 'Java Programming', 'hard', 'programming'),
('What does the transient keyword do in Java?', 'Excludes a field from serialization', 'Makes field thread-safe', 'Prevents inheritance', 'Makes field mutable', 'A', 'Java Programming', 'medium', 'programming')

ON CONFLICT DO NOTHING;

-- Add department eligibility to assessments (safe to re-run)
-- No-op if column already exists (001_initial_schema.sql v3 includes it)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assessments'
      AND column_name = 'eligible_departments'
  ) THEN
    ALTER TABLE public.assessments
    ADD COLUMN eligible_departments text[] DEFAULT '{}';
  END IF;
END $$;

