from ..models.schemas import ReadinessInput, ReadinessResult

DEFAULT_WEIGHTS = {
    "academic": 25,
    "aptitude": 20,
    "programming": 20,
    "communication": 15,
    "internship": 10,
    "projects": 10,
}

SKILL_RECOMMENDATIONS = {
    "aptitude": "Practice quantitative aptitude, logical reasoning, and data interpretation.",
    "programming": "Strengthen fundamentals: loops, arrays, functions, OOP, and DSA.",
    "communication": "Practice grammar, reading comprehension, and professional writing.",
    "academic": "Maintain a strong CGPA by focusing on core subjects.",
}

TARGET_SCORES = {
    "aptitude": 80,
    "programming": 80,
    "communication": 80,
    "academic": 80,
}


def compute_academic_score(cgpa: float, tenth: float, twelfth: float, backlogs: int) -> float:
    cgpa_normalized = (cgpa / 10) * 100
    tenth_normalized = min(100, tenth)
    twelfth_normalized = min(100, twelfth)
    backlog_penalty = min(30, backlogs * 5)

    raw = (cgpa_normalized * 0.5 + tenth_normalized * 0.25 + twelfth_normalized * 0.25) - backlog_penalty
    return round(max(0, min(100, raw)), 2)


def compute_internship_score(has_internship: bool) -> float:
    return 100.0 if has_internship else 30.0


def compute_projects_score(project_count: int) -> float:
    if project_count == 0:
        return 20.0
    if project_count == 1:
        return 60.0
    if project_count == 2:
        return 80.0
    return 100.0


def compute_readiness(inp: ReadinessInput) -> ReadinessResult:
    weights = inp.weights or DEFAULT_WEIGHTS

    academic = compute_academic_score(inp.cgpa, inp.tenth_percent, inp.twelfth_percent, inp.backlogs)
    aptitude = min(100.0, inp.aptitude_score)
    programming = min(100.0, inp.programming_score)
    communication = min(100.0, inp.communication_score)
    internship = compute_internship_score(inp.has_internship)
    projects = compute_projects_score(inp.project_count)

    total = (
        academic * weights.get("academic", 25) / 100 +
        aptitude * weights.get("aptitude", 20) / 100 +
        programming * weights.get("programming", 20) / 100 +
        communication * weights.get("communication", 15) / 100 +
        internship * weights.get("internship", 10) / 100 +
        projects * weights.get("projects", 10) / 100
    )
    total = round(min(100.0, max(0.0, total)), 2)

    if total >= 80:
        status = "placement_ready"
    elif total >= 60:
        status = "needs_improvement"
    else:
        status = "at_risk"

    scores = {
        "aptitude": aptitude,
        "programming": programming,
        "communication": communication,
        "academic": academic,
    }

    skill_gaps = []
    recommendations = []

    for skill, score in scores.items():
        target = TARGET_SCORES[skill]
        gap = max(0, target - score)
        skill_gaps.append({
            "skill_name": skill.title(),
            "current_score": score,
            "target_score": target,
            "gap": gap,
            "status": "good" if score >= target else "needs_improvement",
        })
        if gap > 0:
            recommendations.append(SKILL_RECOMMENDATIONS[skill])

    if not recommendations:
        recommendations.append(
            "Great progress! Focus on strengthening advanced Data Structures and System Design for even better opportunities."
        )

    return ReadinessResult(
        total_score=total,
        academic_score=academic,
        aptitude_score=aptitude,
        programming_score=programming,
        communication_score=communication,
        internship_score=internship,
        projects_score=projects,
        status=status,
        skill_gaps=skill_gaps,
        recommendations=recommendations,
    )
