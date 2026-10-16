// Central demo data — used by all pages when DB is empty or migrations not run.
// All data is cohesive and tells a complete placement story.

export const DEMO_STUDENTS = [
  { id: 'd-s1',  name: 'Rahul Sharma',   email: 'rahul.sharma@student.placementpro.dev',     dept: 'Computer Science',       cgpa: 8.5, tenth: 92, twelfth: 88, backlogs: 0, readiness: 92.5, status: 'placement_ready',   proctoring: 'normal',          skills: ['Python','Java','DSA','System Design','React','Node.js','SQL'],            placement_status: 'placed' },
  { id: 'd-s2',  name: 'Priya Mehta',    email: 'priya.mehta@student.placementpro.dev',      dept: 'Information Technology', cgpa: 7.8, tenth: 86, twelfth: 82, backlogs: 1, readiness: 75.0, status: 'needs_improvement', proctoring: 'review_required', skills: ['Python','ML','Data Analysis','SQL','Tableau'],                            placement_status: 'interview_scheduled' },
  { id: 'd-s3',  name: 'Arjun Nair',     email: 'arjun.nair@student.placementpro.dev',       dept: 'Electronics',            cgpa: 9.1, tenth: 95, twelfth: 93, backlogs: 0, readiness: 88.0, status: 'placement_ready',   proctoring: 'normal',          skills: ['C++','Embedded','DSA','VLSI','Python','MATLAB'],                          placement_status: 'matched' },
  { id: 'd-s4',  name: 'Sneha Patel',    email: 'sneha.patel@student.placementpro.dev',      dept: 'Computer Science',       cgpa: 6.5, tenth: 74, twelfth: 70, backlogs: 2, readiness: 55.0, status: 'at_risk',           proctoring: 'flagged',         skills: ['Java','HTML','CSS'],                                                      placement_status: 'assessment_completed' },
  { id: 'd-s5',  name: 'Karthik Rajan',  email: 'karthik.rajan@student.placementpro.dev',    dept: 'Mechanical',             cgpa: 7.2, tenth: 82, twelfth: 78, backlogs: 0, readiness: 68.0, status: 'needs_improvement', proctoring: 'normal',          skills: ['AutoCAD','SolidWorks','Python','MATLAB'],                                 placement_status: 'matched' },
  { id: 'd-s6',  name: 'Aisha Khan',     email: 'aisha.khan@student.placementpro.dev',       dept: 'Information Technology', cgpa: 8.9, tenth: 94, twelfth: 91, backlogs: 0, readiness: 91.0, status: 'placement_ready',   proctoring: 'normal',          skills: ['Python','ML','Deep Learning','TensorFlow','Docker','AWS'],                placement_status: 'interview_scheduled' },
  { id: 'd-s7',  name: 'Vikram Singh',   email: 'vikram.singh@student.placementpro.dev',     dept: 'Computer Science',       cgpa: 7.4, tenth: 80, twelfth: 76, backlogs: 1, readiness: 72.0, status: 'needs_improvement', proctoring: 'normal',          skills: ['Java','Spring Boot','MySQL','REST APIs'],                                 placement_status: 'matched' },
  { id: 'd-s8',  name: 'Divya Reddy',    email: 'divya.reddy@student.placementpro.dev',      dept: 'Electronics',            cgpa: 8.2, tenth: 89, twelfth: 85, backlogs: 0, readiness: 83.0, status: 'placement_ready',   proctoring: 'normal',          skills: ['Python','Signal Processing','MATLAB','C','Arduino'],                     placement_status: 'matched' },
  { id: 'd-s9',  name: 'Rohan Gupta',    email: 'rohan.gupta@student.placementpro.dev',      dept: 'Computer Science',       cgpa: 6.9, tenth: 76, twelfth: 72, backlogs: 3, readiness: 50.0, status: 'at_risk',           proctoring: 'review_required', skills: ['HTML','CSS','JavaScript'],                                                placement_status: 'pending' },
  { id: 'd-s10', name: 'Meera Iyer',     email: 'meera.iyer@student.placementpro.dev',       dept: 'Information Technology', cgpa: 9.3, tenth: 97, twelfth: 95, backlogs: 0, readiness: 95.0, status: 'placement_ready',   proctoring: 'normal',          skills: ['Python','ML','NLP','TensorFlow','Keras','AWS','Docker'],                  placement_status: 'placed' },
]

export const DEMO_COMPANIES = [
  { id: 'd-c1', name: 'Google',    industry: 'Technology',  logo: 'G', logoColor: '#4285F4', logoBg: '#E8F0FE', verified: true, description: 'Global technology leader in search, cloud, and AI.' },
  { id: 'd-c2', name: 'Microsoft', industry: 'Technology',  logo: 'M', logoColor: '#00A4EF', logoBg: '#E3F5FD', verified: true, description: 'Cloud computing and enterprise software leader.' },
  { id: 'd-c3', name: 'TCS',       industry: 'IT Services', logo: 'T', logoColor: '#E31837', logoBg: '#FDEAED', verified: true, description: "India's largest IT services company." },
  { id: 'd-c4', name: 'Infosys',   industry: 'IT Services', logo: 'I', logoColor: '#007CC3', logoBg: '#E3F2FA', verified: true, description: 'Global leader in digital services and consulting.' },
  { id: 'd-c5', name: 'Wipro',     industry: 'IT Services', logo: 'W', logoColor: '#341755', logoBg: '#EDE7F6', verified: true, description: 'Technology services and consulting company.' },
]

// Shape matches what JobMatches.tsx displayMatches array expects
export const DEMO_MATCHES = [
  { id: 'd-m1', match_percentage: 95, matched_skills: ['DSA','System Design','Problem Solving','Python'], missing_skills: ['Go'],           eligibility_status: 'eligible', explanation: 'Excellent DSA and system design skills. Strong algorithmic thinking matches requirements.', recommendations: ['Practice Go language fundamentals','Study distributed systems'], jobs: { title: 'Software Development Engineer', companies: { name: 'Google'    } } },
  { id: 'd-m2', match_percentage: 92, matched_skills: ['Java','Communication','SQL'],                    missing_skills: [],                eligibility_status: 'eligible', explanation: 'All required skills matched. Strong academic profile exceeds minimum requirements.',          recommendations: ['Practice TCS NQT mock tests'],                                                     jobs: { title: 'Systems Engineer',                 companies: { name: 'TCS'       } } },
  { id: 'd-m3', match_percentage: 88, matched_skills: ['Python','REST APIs'],                            missing_skills: ['Azure','C#'],    eligibility_status: 'eligible', explanation: 'Strong Python and API skills. Azure and C# experience would strengthen the profile.',          recommendations: ['Complete AZ-900 Azure fundamentals','Learn C# basics'],                              jobs: { title: 'Software Engineer',                companies: { name: 'Microsoft' } } },
  { id: 'd-m4', match_percentage: 85, matched_skills: ['Java','SQL','Problem Solving'],                  missing_skills: [],                eligibility_status: 'eligible', explanation: 'Good match with core Java and problem-solving skills aligned to the role.',                    recommendations: ['Study Infosys InfyTQ material'],                                                    jobs: { title: 'Technology Analyst',               companies: { name: 'Infosys'   } } },
  { id: 'd-m5', match_percentage: 79, matched_skills: ['Python','SQL'],                                  missing_skills: ['Java','Testing'], eligibility_status: 'eligible', explanation: 'Decent match. Adding Java and testing skills will significantly improve match score.',           recommendations: ['Complete a Java basics course','Learn Selenium for testing'],                        jobs: { title: 'Project Engineer',                 companies: { name: 'Wipro'     } } },
]

export const DEMO_INTERVIEWS = [
  { id: 'd-i1', status: 'completed', mode: 'online',    round: 1, scheduled_at: '2026-11-15T04:30:00Z', meeting_link: 'https://meet.google.com/abc-defg-hij', location: null,                   outcome: 'selected',  jobs: { title: 'Software Development Engineer' }, companies: { name: 'Google',    logo_url: null } },
  { id: 'd-i2', status: 'scheduled', mode: 'online',    round: 1, scheduled_at: '2026-11-18T08:30:00Z', meeting_link: 'https://teams.microsoft.com/xyz',      location: null,                   outcome: null,        jobs: { title: 'Software Engineer'             }, companies: { name: 'Microsoft', logo_url: null } },
  { id: 'd-i3', status: 'scheduled', mode: 'on_campus', round: 1, scheduled_at: '2026-11-22T04:00:00Z', meeting_link: null,                                    location: 'Main Auditorium, Block A', outcome: null,    jobs: { title: 'Systems Engineer'              }, companies: { name: 'TCS',       logo_url: null } },
]

export const DEMO_PLACEMENTS = [
  { studentName: 'Rahul Sharma', company: 'Google',    role: 'Software Development Engineer', packageLpa: 32, offerDate: '2026-11-20', joiningDate: '2027-07-01' },
  { studentName: 'Meera Iyer',   company: 'Microsoft', role: 'Software Engineer',             packageLpa: 28, offerDate: '2026-11-15', joiningDate: '2027-07-15' },
]

export const DEMO_PROCTORING_EVENTS = [
  { id: 'pe1', student: 'Sneha Patel',  assessment: 'Aptitude Test',      eventType: 'multiple_persons', severity: 'high',   time: '2026-10-14 10:05 AM', reviewed: false, note: null },
  { id: 'pe2', student: 'Rohan Gupta',  assessment: 'Programming Test',   eventType: 'tab_switch',       severity: 'medium', time: '2026-10-14 11:10 AM', reviewed: false, note: null },
  { id: 'pe3', student: 'Priya Mehta',  assessment: 'Aptitude Test',      eventType: 'tab_switch',       severity: 'medium', time: '2026-10-13 02:15 PM', reviewed: true,  note: 'Reviewed: Student briefly checked formula sheet. Cleared.' },
  { id: 'pe4', student: 'Vikram Singh', assessment: 'Communication Test', eventType: 'no_face',          severity: 'medium', time: '2026-10-12 03:20 PM', reviewed: true,  note: 'Reviewed: Camera angle issue. Cleared.' },
]

export const DEMO_NOTIFICATIONS = [
  { id: 'n1', title: '🎉 Congratulations! Offer Received',   message: 'You have received an offer from Google for Software Development Engineer. Package: ₹32 LPA', type: 'success', is_read: false, created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'n2', title: '📅 Interview Scheduled — Google',      message: 'Your interview with Google is on Nov 15 at 10:00 AM. Meeting link ready.',                  type: 'info',    is_read: false, created_at: new Date(Date.now() - 6 * 3600000).toISOString() },
  { id: 'n3', title: '🎯 New Job Match: 95% — Google SDE',   message: 'Excellent match! Apply now to Google – Software Development Engineer.',                     type: 'success', is_read: true,  created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: 'n4', title: '✅ Assessment Results Available',       message: 'Aptitude Test: 94/100 · Programming: 90/100 · Communication: 96/100',                      type: 'info',    is_read: true,  created_at: new Date(Date.now() - 48 * 3600000).toISOString() },
  { id: 'n5', title: '📊 Readiness Score Updated',           message: 'Your placement readiness score is now 92.5/100 — Ready for Placement!',                    type: 'success', is_read: true,  created_at: new Date(Date.now() - 50 * 3600000).toISOString() },
]

export const DEMO_RESULTS = {
  readiness: {
    total_score:         92.5,
    academic_score:      88,
    aptitude_score:      94,
    programming_score:   90,
    communication_score: 96,
    internship_score:    100,
    projects_score:      100,
    status:             'placement_ready' as const,
  },
  skillGaps: [
    { skill_name: 'System Design',  current_score: 72, target_score: 85, gap: 13, recommendation: 'Study High-Level and Low-Level Design patterns. Practice system design problems on LeetCode and Educative.' },
    { skill_name: 'Cloud (AWS/GCP)',current_score: 60, target_score: 80, gap: 20, recommendation: 'Complete AWS Cloud Practitioner or GCP Associate certification to boost cloud proficiency.' },
    { skill_name: 'Go Language',    current_score: 30, target_score: 70, gap: 40, recommendation: 'Learn Go fundamentals through the official tour at go.dev — useful for Google and backend roles.' },
  ],
  assessments: [
    { title: 'Aptitude Test – Quantitative Section', category: 'aptitude',      total_score: 94, percentage: 94, grade: 'A+', assessments: { title: 'Aptitude Test', category: 'aptitude' } },
    { title: 'Programming Skills Assessment',        category: 'programming',   total_score: 90, percentage: 90, grade: 'A',  assessments: { title: 'Programming Skills Assessment', category: 'programming' } },
    { title: 'Communication Skills Assessment',      category: 'communication', total_score: 96, percentage: 96, grade: 'A+', assessments: { title: 'Communication Skills Assessment', category: 'communication' } },
  ],
}

export const DEMO_ADMIN_STATS = {
  students:           1250,
  companies:           120,
  upcomingInterviews:   85,
  activeAssessments:     3,
  placements:          465,
  placementRate:        37,
}

export const DEMO_CHART_DATA = [
  { month: 'Aug', placements: 180 },
  { month: 'Sep', placements: 295 },
  { month: 'Oct', placements: 362 },
  { month: 'Nov', placements: 481 },
  { month: 'Dec', placements: 624 },
]

export const DEMO_DEPT_STATS = [
  { dept: 'CS',    placed: 185, total: 320 },
  { dept: 'IT',    placed: 142, total: 280 },
  { dept: 'ECE',   placed:  98, total: 210 },
  { dept: 'ME',    placed:  28, total: 180 },
  { dept: 'Civil', placed:  12, total: 130 },
]

export const DEMO_SKILL_RADAR = [
  { subject: 'Programming',      student: 90, target: 80 },
  { subject: 'Communication',    student: 96, target: 80 },
  { subject: 'Aptitude',         student: 94, target: 80 },
  { subject: 'Technical Skills', student: 85, target: 80 },
  { subject: 'Problem Solving',  student: 88, target: 80 },
]

export const DEMO_JOBS = [
  { id: 'd-j1', companyId: 'd-c1', companyName: 'Google',    title: 'Software Development Engineer',     skills: ['DSA','System Design','Problem Solving','Python','Go'],        minCgpa: 7.5, maxBacklogs: 0, location: 'Bangalore', workMode: 'hybrid',   isOpen: true,  applications: 45 },
  { id: 'd-j2', companyId: 'd-c1', companyName: 'Google',    title: 'Data Engineer',                     skills: ['Python','SQL','BigQuery','Spark','Airflow'],                  minCgpa: 7.0, maxBacklogs: 0, location: 'Hyderabad', workMode: 'on-site',  isOpen: true,  applications: 38 },
  { id: 'd-j3', companyId: 'd-c2', companyName: 'Microsoft', title: 'Software Engineer',                 skills: ['Python','ML','Azure','C#','REST APIs'],                       minCgpa: 7.0, maxBacklogs: 1, location: 'Hyderabad', workMode: 'hybrid',   isOpen: true,  applications: 52 },
  { id: 'd-j4', companyId: 'd-c2', companyName: 'Microsoft', title: 'Cloud Solutions Engineer',          skills: ['Azure','DevOps','Kubernetes','Python','CI/CD'],               minCgpa: 7.5, maxBacklogs: 0, location: 'Bangalore', workMode: 'hybrid',   isOpen: true,  applications: 29 },
  { id: 'd-j5', companyId: 'd-c3', companyName: 'TCS',       title: 'Systems Engineer',                  skills: ['Java','Communication','SQL','Agile'],                         minCgpa: 6.5, maxBacklogs: 2, location: 'Chennai',   workMode: 'on-site',  isOpen: true,  applications: 120 },
  { id: 'd-j6', companyId: 'd-c3', companyName: 'TCS',       title: 'Digital Transformation Consultant', skills: ['Java','Spring Boot','Microservices','Communication'],          minCgpa: 6.5, maxBacklogs: 2, location: 'Pune',      workMode: 'hybrid',   isOpen: true,  applications: 89 },
  { id: 'd-j7', companyId: 'd-c4', companyName: 'Infosys',   title: 'Technology Analyst',                skills: ['Java','SQL','Problem Solving','Communication'],               minCgpa: 6.5, maxBacklogs: 2, location: 'Mysore',    workMode: 'on-site',  isOpen: true,  applications: 95 },
  { id: 'd-j8', companyId: 'd-c5', companyName: 'Wipro',     title: 'Project Engineer',                  skills: ['Python','Java','Testing','Communication','SQL'],              minCgpa: 6.5, maxBacklogs: 2, location: 'Bangalore', workMode: 'on-site',  isOpen: true,  applications: 78 },
]

export const DEMO_RECENT_ACTIVITIES = [
  { id: 'a1', text: 'New job posted by Google – Software Development Engineer',         time: '2m ago',  type: 'job'        },
  { id: 'a2', text: 'Interview scheduled: Rahul Sharma @ Google – Nov 15',              time: '5m ago',  type: 'interview'  },
  { id: 'a3', text: 'Assessment completed: 45 students (Aptitude Test)',                time: '10m ago', type: 'assessment' },
  { id: 'a4', text: 'Meera Iyer received offer from Microsoft (₹28 LPA)',               time: '1h ago',  type: 'placement'  },
  { id: 'a5', text: 'Company registered: Infosys Technologies (pending verification)',  time: '2h ago',  type: 'company'    },
]
