from fastapi import APIRouter, HTTPException
from ..models.schemas import MatchRequest, MatchResult, ReadinessInput, ReadinessResult, ProctoringFrame
from ..services.matching_service import run_matching
from ..services.readiness_service import compute_readiness
from ..services.proctoring_service import analyze_frame

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
    try:
        result = analyze_frame(data.frame_base64)
        return {
            "attempt_id": data.attempt_id,
            "timestamp": data.timestamp,
            **result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "PlacementPro AI Service"}
