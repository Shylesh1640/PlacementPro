"""
Resume and Job Description parser using Groq API (free tier).
Falls back gracefully if GROQ_API_KEY is not set.
"""
import os
import json
import re
from typing import Dict, Any, Optional
import httpx

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama-3.1-8b-instant"   # Fast, free tier


def _call_groq(prompt: str, system: str = "") -> Optional[str]:
    """Call Groq API and return the text response."""
    if not GROQ_API_KEY:
        return None
    try:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        response = httpx.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": messages,
                "max_tokens": 1024,
                "temperature": 0.1,
            },
            timeout=20.0,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Groq API error: {e}")
        return None


def extract_json_from_text(text: str) -> Optional[dict]:
    """Extract JSON object from LLM response."""
    try:
        return json.loads(text)
    except Exception:
        pass
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass
    match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except Exception:
            pass
    return None


def parse_resume(resume_text: str) -> Dict[str, Any]:
    """
    Parse resume text and extract structured student profile data.
    Returns dict with student profile fields.
    Uses Groq API (llama-3.1-8b-instant) if GROQ_API_KEY is set,
    otherwise falls back to regex extraction.
    """
    system = """You are a resume parser. Extract structured data from resumes.
Always respond with valid JSON only — no markdown, no explanation."""

    prompt = f"""Extract the following fields from this resume text. Return ONLY a JSON object.

Resume:
{resume_text[:3000]}

Return JSON with these exact fields (use null if not found):
{{
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "department": "string (Computer Science / IT / Electronics / Mechanical etc)",
  "cgpa": "number or null",
  "tenth_percent": "number or null",
  "twelfth_percent": "number or null",
  "skills": ["list", "of", "technical", "skills"],
  "projects": [
    {{"title": "string", "description": "string", "technologies": ["string"]}}
  ],
  "internships": [
    {{"company": "string", "role": "string", "duration": "string", "completed": true}}
  ],
  "certifications": [
    {{"name": "string", "issuer": "string"}}
  ],
  "summary": "2-3 sentence professional summary"
}}"""

    result = _call_groq(prompt, system)

    if result:
        parsed = extract_json_from_text(result)
        if parsed:
            return {
                "full_name":       parsed.get("full_name") or "",
                "email":           parsed.get("email") or "",
                "phone":           parsed.get("phone") or "",
                "department":      parsed.get("department") or "",
                "cgpa":            float(parsed["cgpa"]) if parsed.get("cgpa") else None,
                "tenth_percent":   float(parsed["tenth_percent"]) if parsed.get("tenth_percent") else None,
                "twelfth_percent": float(parsed["twelfth_percent"]) if parsed.get("twelfth_percent") else None,
                "skills":          list(parsed.get("skills") or []),
                "projects":        list(parsed.get("projects") or []),
                "internships":     list(parsed.get("internships") or []),
                "certifications":  list(parsed.get("certifications") or []),
                "summary":         parsed.get("summary") or "",
                "parsed_by_ai":    True,
            }

    return _fallback_parse(resume_text)


def _fallback_parse(text: str) -> Dict[str, Any]:
    """Simple regex-based fallback parser when Groq is unavailable."""
    email_match = re.search(r'[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}', text)
    phone_match = re.search(r'(\+91[\s-]?)?[6-9]\d{9}', text)
    cgpa_match  = re.search(r'(?:cgpa|gpa)[:\s]*([0-9]+\.[0-9]+)', text, re.I)

    tech_keywords = [
        'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'C++', 'C#',
        'Go', 'Rust', 'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes',
        'AWS', 'Azure', 'GCP', 'Machine Learning', 'Deep Learning', 'TensorFlow',
        'PyTorch', 'Django', 'Flask', 'Spring', 'Git', 'Linux', 'HTML', 'CSS',
    ]
    found_skills = [k for k in tech_keywords if k.lower() in text.lower()]

    return {
        "full_name":       "",
        "email":           email_match.group() if email_match else "",
        "phone":           phone_match.group() if phone_match else "",
        "department":      "",
        "cgpa":            float(cgpa_match.group(1)) if cgpa_match else None,
        "tenth_percent":   None,
        "twelfth_percent": None,
        "skills":          found_skills[:15],
        "projects":        [],
        "internships":     [],
        "certifications":  [],
        "summary":         "",
        "parsed_by_ai":    False,
    }


def parse_job_description(jd_text: str) -> Dict[str, Any]:
    """
    Parse job description text and extract structured job posting data.
    Returns dict with job fields for pre-filling the post job form.
    """
    system = """You are a job description parser. Extract structured job data.
Always respond with valid JSON only."""

    prompt = f"""Extract job posting data from this job description. Return ONLY JSON.

Job Description:
{jd_text[:2000]}

Return JSON with these exact fields (use null if not found):
{{
  "title": "string",
  "company": "string or null",
  "description": "cleaned job description",
  "required_skills": ["list", "of", "required", "technical", "skills"],
  "preferred_skills": ["list", "of", "nice-to-have", "skills"],
  "min_cgpa": "number or null (e.g. 7.0)",
  "max_backlogs": "integer or null",
  "location": "string or null",
  "work_mode": "on-site / remote / hybrid",
  "experience_level": "fresher / junior / mid",
  "employment_type": "full-time / part-time / internship"
}}"""

    result = _call_groq(prompt, system)
    if result:
        parsed = extract_json_from_text(result)
        if parsed:
            return {
                "title":            parsed.get("title") or "",
                "company":          parsed.get("company") or "",
                "description":      parsed.get("description") or "",
                "required_skills":  list(parsed.get("required_skills") or []),
                "preferred_skills": list(parsed.get("preferred_skills") or []),
                "min_cgpa":         float(parsed["min_cgpa"]) if parsed.get("min_cgpa") else None,
                "max_backlogs":     int(parsed["max_backlogs"]) if parsed.get("max_backlogs") is not None else None,
                "location":         parsed.get("location") or "",
                "work_mode":        parsed.get("work_mode") or "on-site",
                "experience_level": parsed.get("experience_level") or "fresher",
                "employment_type":  parsed.get("employment_type") or "full-time",
                "parsed_by_ai":     True,
            }

    return {
        "title": "", "company": "", "description": jd_text,
        "required_skills": [], "preferred_skills": [],
        "min_cgpa": None, "max_backlogs": None, "location": "",
        "work_mode": "on-site", "experience_level": "fresher",
        "employment_type": "full-time", "parsed_by_ai": False,
    }
