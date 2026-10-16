import re
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from ..models.schemas import MatchRequest, MatchResult


SKILL_RECOMMENDATIONS = {
    "python": "Practice Python fundamentals, OOP, and data structures.",
    "java": "Study Java OOP, collections framework, and multithreading.",
    "machine learning": "Learn ML algorithms, scikit-learn, and model evaluation.",
    "data analysis": "Practice pandas, numpy, and data visualization.",
    "system design": "Study system design principles, scalability, and distributed systems.",
    "data structures": "Practice arrays, linked lists, trees, graphs, and hash maps.",
    "algorithms": "Study sorting, searching, dynamic programming, and graph algorithms.",
    "communication": "Practice grammar, writing, and presentation skills.",
    "sql": "Learn SQL queries, joins, indexing, and optimization.",
    "react": "Study React hooks, state management, and component patterns.",
}


def extract_student_skills(student: dict) -> List[str]:
    skills = []
    if student.get("student_skills"):
        for ss in student["student_skills"]:
            if isinstance(ss, dict) and ss.get("skills"):
                skills.append(ss["skills"]["name"].lower())
            elif isinstance(ss, dict) and ss.get("skill_id"):
                skills.append(str(ss["skill_id"]).lower())
    return skills


def check_hard_eligibility(student: dict, job: dict) -> tuple[bool, str]:
    cgpa = float(student.get("cgpa", 0))
    backlogs = int(student.get("backlogs", 0))
    department = student.get("department", "").lower()

    min_cgpa = float(job.get("min_cgpa", 0))
    max_backlogs = int(job.get("max_backlogs", 99))
    eligible_depts = [d.lower() for d in (job.get("eligible_departments") or [])]

    if cgpa < min_cgpa:
        return False, f"CGPA {cgpa} is below the required minimum of {min_cgpa}"

    if backlogs > max_backlogs:
        return False, f"Backlogs ({backlogs}) exceed the maximum allowed ({max_backlogs})"

    if eligible_depts and department and department not in eligible_depts:
        return False, f"Department '{department}' is not in the eligible list"

    return True, ""


def compute_skill_match(student_skills: List[str], required_skills: List[str], preferred_skills: List[str]) -> dict:
    all_job_skills = [s.lower() for s in (required_skills or [])]
    preferred = [s.lower() for s in (preferred_skills or [])]

    matched_required = [s for s in all_job_skills if s in student_skills]
    matched_preferred = [s for s in preferred if s in student_skills]
    missing = [s for s in all_job_skills if s not in student_skills]

    if not all_job_skills:
        skill_score = 70.0
    else:
        skill_score = (len(matched_required) / len(all_job_skills)) * 100
        if preferred:
            preferred_bonus = (len(matched_preferred) / len(preferred)) * 10
            skill_score = min(100, skill_score + preferred_bonus)

    return {
        "score": skill_score,
        "matched": matched_required + matched_preferred,
        "missing": missing,
    }


def compute_tfidf_similarity(student_text: str, job_text: str) -> float:
    if not student_text.strip() or not job_text.strip():
        return 0.5
    try:
        vectorizer = TfidfVectorizer(stop_words='english', lowercase=True)
        matrix = vectorizer.fit_transform([student_text, job_text])
        score = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
        return float(score)
    except Exception:
        return 0.5


def run_matching(request: MatchRequest) -> MatchResult:
    student = request.student.model_dump()
    job = request.job.model_dump()

    eligible, reason = check_hard_eligibility(student, job)
    if not eligible:
        return MatchResult(
            match_percentage=0.0,
            matched_skills=[],
            missing_skills=job.get("required_skills") or [],
            eligibility_status="not_eligible",
            explanation=reason,
            recommendations=["Address the hard eligibility criteria before applying."],
        )

    student_skills = extract_student_skills(student)
    skill_result = compute_skill_match(
        student_skills,
        job.get("required_skills") or [],
        job.get("preferred_skills") or [],
    )

    cgpa = float(student.get("cgpa", 0))
    academic_component = min(100, (cgpa / 10) * 100)

    readiness = student.get("readiness_scores")
    readiness_component = float(readiness.get("total_score", 70)) if readiness else 70.0

    student_text = " ".join(student_skills)
    job_text = " ".join([
        job.get("title", ""),
        job.get("description", ""),
        " ".join(job.get("required_skills") or []),
    ])
    tfidf_score = compute_tfidf_similarity(student_text, job_text) * 100

    match_pct = (
        skill_result["score"] * 0.45 +
        readiness_component * 0.25 +
        academic_component * 0.15 +
        tfidf_score * 0.15
    )
    match_pct = round(min(100.0, max(0.0, match_pct)), 1)

    if match_pct >= 60:
        eligibility = "eligible"
    elif match_pct >= 40:
        eligibility = "review_required"
    else:
        eligibility = "not_eligible"

    recommendations = []
    for skill in skill_result["missing"][:3]:
        rec = SKILL_RECOMMENDATIONS.get(skill.lower(), f"Improve your skills in {skill}.")
        recommendations.append(rec)

    explanation = (
        f"Skill match: {skill_result['score']:.0f}%, "
        f"Academic: {academic_component:.0f}%, "
        f"Readiness: {readiness_component:.0f}%. "
        f"{'You meet all eligibility criteria.' if eligibility == 'eligible' else 'Some criteria need attention.'}"
    )

    return MatchResult(
        match_percentage=match_pct,
        matched_skills=skill_result["matched"],
        missing_skills=skill_result["missing"],
        eligibility_status=eligibility,
        explanation=explanation,
        recommendations=recommendations,
    )
