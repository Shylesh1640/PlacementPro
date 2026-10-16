from fastapi import APIRouter, HTTPException
from ..models.schemas import (
    MatchRequest, MatchResult, ReadinessInput, ReadinessResult,
    ProctoringFrame, ResumeParseRequest, ResumeParseResult,
    JobParseRequest, JobParseResult,
)
from ..services.matching_service import run_matching
from ..services.readiness_service import compute_readiness
from ..services.proctoring_service import analyze_frame
from ..services.resume_parser import parse_resume, parse_job_description

router = APIRouter()


@router.post("/match", response_model=MatchResult)
async def match_student_to_job(request: MatchRequest):
    try:
        return run_matching(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/readiness", response_model=ReadinessResult)
async def compute_readiness_score(inp: ReadinessInput):
    try:
        return compute_readiness(inp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/proctor/analyze")
async def analyze_proctoring_frame(data: ProctoringFrame):
    """
    Analyze a webcam frame for proctoring violations.
    Called every 5 seconds during an active assessment.
    Returns flagged=True when a violation is detected.
    """
    try:
        result = analyze_frame(data.frame_base64)
        return {
            "attempt_id": data.attempt_id,
            "timestamp":  data.timestamp,
            "event_type": result["event_type"],
            "severity":   result["severity"],
            "face_count": result.get("face_count", 0),
            "message":    result.get("message", ""),
            "flagged":    result.get("flagged", False),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parse-resume", response_model=ResumeParseResult)
async def parse_resume_endpoint(data: ResumeParseRequest):
    """
    Parse resume text and extract structured student profile data.
    Uses Groq API (llama-3.1-8b-instant) if GROQ_API_KEY is set,
    otherwise falls back to regex extraction.
    Free API key: console.groq.com
    """
    try:
        result = parse_resume(data.resume_text)
        return ResumeParseResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parse-job", response_model=JobParseResult)
async def parse_job_description_endpoint(data: JobParseRequest):
    """
    Parse a job description and extract structured job posting data.
    Uses Groq API if GROQ_API_KEY is set, otherwise basic extraction.
    """
    try:
        result = parse_job_description(data.jd_text)
        return JobParseResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/readiness/full", response_model=ReadinessResult)
async def compute_full_readiness(inp: ReadinessInput):
    """
    Alias for /readiness — returns full breakdown of readiness components.
    Called by the frontend after assessment submission to auto-calculate
    and store the student's placement readiness score.
    """
    try:
        return compute_readiness(inp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "PlacementPro AI Service"}
