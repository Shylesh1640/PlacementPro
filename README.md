# PlacementPro

**AI-Powered Placement Ecosystem – Assess • Match • Connect**

Building a smarter bridge between students, opportunities and companies.

---

## Architecture

```
Three User Portals (Student | Admin | Industry Partner)
        │
        ▼
React + TypeScript Frontend (Vite)
        │
   ┌────┴────┐
   ▼         ▼
Supabase   Supabase
Auth       Storage
(JWT)      (Resumes, Certs, Logos)
   │
   ▼
Supabase Client / REST APIs
   │
   ├──► PostgreSQL (Row Level Security)
   │
   └──► Edge Functions
           │
           ├──► Notifications & Workflow Automation
           │
           └──► Python AI Service (FastAPI)
                    ├── Job Matching (TF-IDF + cosine similarity)
                    ├── Readiness & Skill Gap Analysis
                    └── AI-Assisted Proctoring (OpenCV face detection)
```

## Monorepo Structure

```
PlacementPro/
├── web/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # UI components + layout + guards
│   │   ├── contexts/       # AuthContext
│   │   ├── lib/            # Supabase client, auth, utils
│   │   ├── pages/
│   │   │   ├── auth/       # Login, Register
│   │   │   ├── student/    # Student portal (9 pages)
│   │   │   ├── admin/      # Admin portal (12 pages)
│   │   │   └── partner/    # Industry partner portal (8 pages)
│   │   └── types/          # TypeScript types + Database type
│   └── .env.example
│
├── ai-service/             # Python FastAPI microservice
│   ├── app/
│   │   ├── api/            # Route handlers
│   │   ├── models/         # Pydantic schemas
│   │   └── services/       # Matching, readiness, proctoring
│   ├── main.py
│   ├── Dockerfile
│   └── requirements.txt
│
└── supabase/
    ├── migrations/
    │   ├── 001_initial_schema.sql  # All tables + RLS + triggers
    │   └── 002_seed_data.sql       # Skills, questions, assessments
    ├── functions/
    │   ├── notify-student/         # In-app + email notifications
    │   └── run-job-matching/       # Trigger AI matching
    └── .env.example
```

## Environment Variables

### web/.env.local
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_AI_SERVICE_URL=http://localhost:8000
```

### supabase/.env (for edge functions)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
AI_SERVICE_URL=http://localhost:8000
```

### ai-service/.env
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.11+
- A Supabase project (free at supabase.com)

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run migrations in order:
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_seed_data.sql
   ```
3. In **Storage**, create these buckets (all private):
   - `resumes`
   - `certificates`
   - `company-logos`
   - `offer-letters`
   - `proctoring-snapshots`
4. Copy your Project URL and anon key from **Settings → API**

### 2. Frontend (web/)

```bash
cd web
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

App runs at **http://localhost:5173**

### 3. AI Service (ai-service/)

```bash
cd ai-service
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

AI service runs at **http://localhost:8000**

API docs: **http://localhost:8000/docs**

#### Using Docker
```bash
cd ai-service
docker build -t placementpro-ai .
docker run -p 8000:8000 placementpro-ai
```

### 4. Supabase Edge Functions (optional)

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy notify-student
supabase functions deploy run-job-matching
```

---

## Screens Implemented

| # | Screen | Portal |
|---|--------|--------|
| 1 | Unified Login – Choose Your Role | Public |
| 2 | Student Dashboard | Student |
| 3 | Online Assessment with AI Proctoring | Student |
| 4 | Placement Readiness & Skill Gap Analysis | Student |
| 5 | AI-Based Job Matching | Student |
| 6 | Admin Dashboard | Admin |
| 7 | Industry Partner – Post Jobs | Partner |
| 8 | Interview Scheduling | Admin |
| 9 | Placement Tracking | Student |

**Additional pages:** Student Profile, Notifications, Settings; Admin Students, Assessments, Question Bank, Job Postings, Proctoring Review, Company Verification, Analytics, Reports, Settings; Partner Dashboard, My Jobs, Applications, Interviews, Profile, Settings.

---

## Key Features

- **Role-Based Auth**: Supabase JWT with `student | admin | partner` roles enforced by RLS
- **AI Proctoring**: Webcam consent → face detection → live event feed → admin review
- **Readiness Score**: Weighted formula (Academic 25%, Aptitude 20%, Programming 20%, Communication 15%, Internship 10%, Projects 10%)
- **AI Job Matching**: TF-IDF + cosine similarity + hard eligibility rules + explainable output
- **Skill Gap Analysis**: Per-skill radar chart (Your Score vs Target) + actionable recommendations
- **Notifications**: In-app bell + Edge Function email triggers
- **Placement Tracking**: 5-step stepper from Assessment → Offer

---

## Seed Data

The seed script creates:
- 20 skills across categories
- 6 proctoring rules
- 3 assessments (Aptitude, Programming, Communication)
- 16 sample questions

Demo values shown in the UI (Rahul Sharma, 92.5 readiness, Google/Microsoft/TCS matches, 1,250 students, 120 companies, 85 interviews) are rendered from static mock data in the components until connected to Supabase.
