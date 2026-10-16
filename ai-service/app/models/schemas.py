from pydantic import BaseModel
from typing import Optional, List


class StudentProfile(BaseModel):
    id: str
    cgpa: float = 0.0
    backlogs: int = 0
    department: str = ""
    internships: Optional[List[dict]] = []
    projects: Optional[List[dict]] = []
    student_skills: Optional[List[dict]] = []
    assessment_results: Optional[List[dict]] = []
    readiness_scores: Optional[dict] = None


class JobRequirement(BaseModel):
    id: str
    title: str
    description: Optional[str] = ""
    required_skills: Optional[List[str]] = []
    preferred_skills: Optional[List[str]] = []
    min_cgpa: float = 0.0
    max_backlogs: int = 10
    eligible_departments: Optional[List[str]] = []
    experience_level: str = "fresher"
    companies: Optional[dict] = None


class MatchRequest(BaseModel):
    student: StudentProfile
    job: JobRequirement


class MatchResult(BaseModel):
    match_percentage: float
    matched_skills: List[str]
    missing_skills: List[str]
    eligibility_status: str  # eligible | not_eligible | review_required
    explanation: str
    recommendations: List[str]


class ReadinessInput(BaseModel):
    cgpa: float
    tenth_percent: float
    twelfth_percent: float
    backlogs: int
    aptitude_score: float = 0.0
    programming_score: float = 0.0
    communication_score: float = 0.0
    has_internship: bool = False
    project_count: int = 0
    weights: Optional[dict] = None


class ReadinessResult(BaseModel):
    total_score: float
    academic_score: float
    aptitude_score: float
    programming_score: float
    communication_score: float
    internship_score: float
    projects_score: float
    status: str  # placement_ready | needs_improvement | at_risk
    skill_gaps: List[dict]
    recommendations: List[str]


class ProctoringFrame(BaseModel):
    attempt_id: str
    frame_base64: str
    timestamp: str


class ProctoringEvent(BaseModel):
    attempt_id: str
    event_type: str
    timestamp: str
    severity: str


class ResumeParseRequest(BaseModel):
    resume_text: str
    filename: Optional[str] = None


class ResumeParseResult(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""
    department: str = ""
    cgpa: Optional[float] = None
    tenth_percent: Optional[float] = None
    twelfth_percent: Optional[float] = None
    skills: List[str] = []
    projects: List[dict] = []
    internships: List[dict] = []
    certifications: List[dict] = []
    summary: str = ""
    parsed_by_ai: bool = False


class JobParseRequest(BaseModel):
    jd_text: str


class JobParseResult(BaseModel):
    title: str = ""
    company: str = ""
    description: str = ""
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    min_cgpa: Optional[float] = None
    max_backlogs: Optional[int] = None
    location: str = ""
    work_mode: str = "on-site"
    experience_level: str = "fresher"
    employment_type: str = "full-time"
    parsed_by_ai: bool = False
