export type UserRole = 'student' | 'admin' | 'partner'

export type PlacementStatus = 'pending' | 'assessment_completed' | 'matched' | 'interview_scheduled' | 'interview_completed' | 'placed'

export type ProctoringSeverity = 'low' | 'medium' | 'high'

export type ProctoringStatus = 'normal' | 'review_required' | 'flagged'

export type ApplicationStatus = 'applied' | 'under_review' | 'shortlisted' | 'rejected' | 'offered'

export type InterviewStatus = 'scheduled' | 'completed' | 'rescheduled' | 'withdrawn'

export type InterviewMode = 'online' | 'on_campus' | 'hybrid'

export type InterviewOutcome = 'selected' | 'rejected' | 'pending'

export type ConnectionStatus = 'pending' | 'approved' | 'connected'

export interface Profile {
  id: string
  email: string
  role: UserRole
  full_name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  profile_id: string
  student_id: string
  department: string
  cgpa: number
  tenth_percent: number
  twelfth_percent: number
  backlogs: number
  contact_phone?: string
  contact_address?: string
  resume_url?: string
  readiness_score?: number
  readiness_status?: 'placement_ready' | 'needs_improvement' | 'at_risk'
  proctoring_status?: ProctoringStatus
  placement_status?: PlacementStatus
  created_at: string
  updated_at: string
}

export interface Skill {
  id: string
  name: string
  category: string
}

export interface StudentSkill {
  id: string
  student_id: string
  skill_id: string
  proficiency_level?: 'beginner' | 'intermediate' | 'advanced'
  skill?: Skill
}

export interface Project {
  id: string
  student_id: string
  title: string
  description?: string
  technologies?: string[]
  url?: string
  created_at: string
}

export interface Internship {
  id: string
  student_id: string
  company: string
  role: string
  duration_months?: number
  completed: boolean
  start_date?: string
  end_date?: string
}

export interface Certification {
  id: string
  student_id: string
  name: string
  issuer?: string
  issue_date?: string
  certificate_url?: string
}

export interface QuestionBank {
  id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: 'aptitude' | 'programming' | 'communication'
  created_at: string
}

export interface Assessment {
  id: string
  title: string
  description?: string
  category: 'aptitude' | 'programming' | 'communication'
  duration_minutes: number
  total_marks: number
  pass_marks: number
  is_active: boolean
  created_at: string
}

export interface AssessmentAttempt {
  id: string
  assessment_id: string
  student_id: string
  started_at: string
  submitted_at?: string
  score?: number
  percentage?: number
  status: 'in_progress' | 'submitted' | 'auto_submitted'
  assessment?: Assessment
}

export interface AssessmentResult {
  id: string
  attempt_id: string
  student_id: string
  assessment_id: string
  aptitude_score?: number
  programming_score?: number
  communication_score?: number
  total_score: number
  percentage: number
  grade?: string
  created_at: string
}

export interface ReadinessScore {
  id: string
  student_id: string
  academic_score: number
  aptitude_score: number
  programming_score: number
  communication_score: number
  internship_score: number
  projects_score: number
  total_score: number
  status: 'placement_ready' | 'needs_improvement' | 'at_risk'
  calculated_at: string
}

export interface SkillGapReport {
  id: string
  student_id: string
  skill_name: string
  current_score: number
  target_score: number
  gap: number
  recommendation?: string
  created_at: string
}

export interface ProctoringEvent {
  id: string
  attempt_id: string
  event_type: string
  severity: ProctoringSeverity
  timestamp: string
  snapshot_url?: string
  reviewed: boolean
  review_note?: string
}

export interface Company {
  id: string
  profile_id: string
  name: string
  logo_url?: string
  industry?: string
  description?: string
  website?: string
  verified: boolean
  verification_note?: string
  created_at: string
}

export interface Job {
  id: string
  company_id: string
  title: string
  description?: string
  required_skills?: string[]
  preferred_skills?: string[]
  min_cgpa?: number
  max_backlogs?: number
  eligible_departments?: string[]
  experience_level?: string
  location?: string
  work_mode?: string
  employment_type?: string
  is_open: boolean
  created_at: string
  company?: Company
}

export interface JobMatch {
  id: string
  student_id: string
  job_id: string
  match_percentage: number
  matched_skills?: string[]
  missing_skills?: string[]
  eligibility_status: 'eligible' | 'not_eligible' | 'review_required'
  explanation?: string
  recommendations?: string[]
  created_at: string
  job?: Job
}

export interface Application {
  id: string
  student_id: string
  job_id: string
  status: ApplicationStatus
  applied_at: string
  reviewed_at?: string
  reviewer_note?: string
  job?: Job
}

export interface Interview {
  id: string
  student_id: string
  job_id: string
  company_id: string
  round: number
  scheduled_at: string
  mode: InterviewMode
  meeting_link?: string
  location?: string
  status: InterviewStatus
  outcome?: InterviewOutcome
  feedback?: string
  created_at: string
  job?: Job
  company?: Company
}

export interface Placement {
  id: string
  student_id: string
  job_id: string
  company_id: string
  offer_date?: string
  joining_date?: string
  package_lpa?: number
  offer_letter_url?: string
  status: 'offered' | 'accepted' | 'declined'
  created_at: string
  job?: Job
  company?: Company
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  link?: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile }
      students: { Row: Student }
      skills: { Row: Skill }
      student_skills: { Row: StudentSkill }
      projects: { Row: Project }
      internships: { Row: Internship }
      certifications: { Row: Certification }
      question_bank: { Row: QuestionBank }
      assessments: { Row: Assessment }
      assessment_attempts: { Row: AssessmentAttempt }
      assessment_results: { Row: AssessmentResult }
      readiness_scores: { Row: ReadinessScore }
      skill_gap_reports: { Row: SkillGapReport }
      proctoring_events: { Row: ProctoringEvent }
      companies: { Row: Company }
      jobs: { Row: Job }
      job_matches: { Row: JobMatch }
      applications: { Row: Application }
      interviews: { Row: Interview }
      placements: { Row: Placement }
      notifications: { Row: Notification }
    }
  }
}
