"""Tests for PlacementPro AI matching and readiness services."""
import pytest
from app.services.matching_service import run_matching, check_hard_eligibility
from app.services.readiness_service import compute_readiness
from app.models.schemas import MatchRequest, StudentProfile, JobRequirement, ReadinessInput


# ── Fixtures ──────────────────────────────────────────────────────────────

def make_student(**kwargs):
    defaults = dict(
        id='s1', cgpa=8.0, backlogs=0, department='Computer Science',
        student_skills=[
            {'skills': {'name': 'Python'}},
            {'skills': {'name': 'Machine Learning'}},
            {'skills': {'name': 'DSA'}},
        ],
        readiness_scores={'total_score': 85},
    )
    defaults.update(kwargs)
    return StudentProfile(**defaults)


def make_job(**kwargs):
    defaults = dict(
        id='j1', title='Software Engineer',
        required_skills=['Python', 'DSA'],
        preferred_skills=['Machine Learning'],
        min_cgpa=7.0, max_backlogs=1,
        eligible_departments=[],
        companies={'name': 'Google'},
    )
    defaults.update(kwargs)
    return JobRequirement(**defaults)


# ── Hard eligibility ──────────────────────────────────────────────────────

def test_eligible_student_passes():
    ok, reason = check_hard_eligibility(make_student(cgpa=8.0, backlogs=0).dict(), make_job(min_cgpa=7.0, max_backlogs=2).dict())
    assert ok is True
    assert reason == ''


def test_cgpa_below_minimum_fails():
    ok, reason = check_hard_eligibility(make_student(cgpa=6.5).dict(), make_job(min_cgpa=7.0).dict())
    assert ok is False
    assert '7.0' in reason


def test_too_many_backlogs_fails():
    ok, reason = check_hard_eligibility(make_student(backlogs=3).dict(), make_job(max_backlogs=2).dict())
    assert ok is False
    assert 'backlog' in reason.lower()


def test_wrong_department_fails():
    ok, reason = check_hard_eligibility(
        make_student(department='Mechanical').dict(),
        make_job(eligible_departments=['Computer Science', 'IT']).dict(),
    )
    assert ok is False
    assert 'department' in reason.lower()


def test_no_department_restriction_passes():
    ok, _ = check_hard_eligibility(make_student(department='Electronics').dict(), make_job(eligible_departments=[]).dict())
    assert ok is True


# ── Match percentage ──────────────────────────────────────────────────────

def test_full_skill_match_gives_high_score():
    result = run_matching(MatchRequest(student=make_student(), job=make_job(required_skills=['Python', 'DSA'])))
    assert result.match_percentage >= 70
    assert result.eligibility_status == 'eligible'


def test_no_skills_gives_lower_score():
    with_skills    = run_matching(MatchRequest(student=make_student(), job=make_job()))
    without_skills = run_matching(MatchRequest(student=make_student(student_skills=[]), job=make_job()))
    assert without_skills.match_percentage <= with_skills.match_percentage


def test_not_eligible_student_returns_zero():
    result = run_matching(MatchRequest(student=make_student(cgpa=5.0), job=make_job(min_cgpa=7.5)))
    assert result.match_percentage == 0.0
    assert result.eligibility_status == 'not_eligible'


def test_matched_and_missing_skills_are_correct():
    result = run_matching(MatchRequest(student=make_student(), job=make_job(required_skills=['Python', 'Java'])))
    assert 'python' in [s.lower() for s in result.matched_skills]
    assert 'java'   in [s.lower() for s in result.missing_skills]


def test_match_percentage_bounded_0_to_100():
    result = run_matching(MatchRequest(student=make_student(), job=make_job()))
    assert 0 <= result.match_percentage <= 100


# ── Readiness scoring ─────────────────────────────────────────────────────

def test_high_performer_is_placement_ready():
    result = compute_readiness(ReadinessInput(
        cgpa=9.0, tenth_percent=95, twelfth_percent=92, backlogs=0,
        aptitude_score=95, programming_score=92, communication_score=96,
        has_internship=True, project_count=3,
    ))
    assert result.total_score >= 80
    assert result.status == 'placement_ready'


def test_weak_student_is_at_risk():
    result = compute_readiness(ReadinessInput(
        cgpa=5.0, tenth_percent=55, twelfth_percent=52, backlogs=4,
        aptitude_score=30, programming_score=25, communication_score=35,
        has_internship=False, project_count=0,
    ))
    assert result.total_score < 60
    assert result.status == 'at_risk'


def test_average_student_needs_improvement():
    result = compute_readiness(ReadinessInput(
        cgpa=6.5, tenth_percent=70, twelfth_percent=68, backlogs=2,
        aptitude_score=60, programming_score=55, communication_score=58,
        has_internship=False, project_count=0,
    ))
    assert 40 <= result.total_score <= 75
    assert result.status in ('needs_improvement', 'at_risk')


def test_weights_sum_to_100():
    from app.services.readiness_service import DEFAULT_WEIGHTS
    assert sum(DEFAULT_WEIGHTS.values()) == 100


def test_score_always_bounded_0_to_100():
    result = compute_readiness(ReadinessInput(
        cgpa=10, tenth_percent=100, twelfth_percent=100, backlogs=0,
        aptitude_score=100, programming_score=100, communication_score=100,
        has_internship=True, project_count=10,
    ))
    assert 0 <= result.total_score <= 100


def test_skill_gaps_returned_for_weak_student():
    result = compute_readiness(ReadinessInput(
        cgpa=7.0, tenth_percent=75, twelfth_percent=72, backlogs=1,
        aptitude_score=50, programming_score=45, communication_score=55,
        has_internship=False, project_count=1,
    ))
    assert len(result.skill_gaps) > 0


def test_recommendations_for_weak_student():
    result = compute_readiness(ReadinessInput(
        cgpa=5.5, tenth_percent=60, twelfth_percent=58, backlogs=3,
        aptitude_score=40, programming_score=35, communication_score=42,
        has_internship=False, project_count=0,
    ))
    assert len(result.recommendations) > 0


def test_no_backlogs_better_than_backlogs():
    clean  = compute_readiness(ReadinessInput(cgpa=7.5, tenth_percent=80, twelfth_percent=78, backlogs=0,  aptitude_score=75, programming_score=72, communication_score=74, has_internship=False, project_count=1))
    arrear = compute_readiness(ReadinessInput(cgpa=7.5, tenth_percent=80, twelfth_percent=78, backlogs=3,  aptitude_score=75, programming_score=72, communication_score=74, has_internship=False, project_count=1))
    assert clean.total_score >= arrear.total_score
