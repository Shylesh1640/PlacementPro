import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { RoleGuard } from './components/guards/RoleGuard'

// Auth pages — eager (tiny, needed immediately)
import { LoginPage }    from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'

// Spinner shown while lazy chunks load
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#EEF1FF,#F7F8FF)' }}>
    <div className="animate-spin w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full" />
  </div>
)

// ── Student portal (lazy) ────────────────────────────────────────────────
const StudentLayout     = lazy(() => import('./pages/student/StudentLayout').then(m=>({default:m.StudentLayout})))
const StudentDashboard  = lazy(() => import('./pages/student/Dashboard').then(m=>({default:m.StudentDashboard})))
const StudentProfile    = lazy(() => import('./pages/student/Profile').then(m=>({default:m.StudentProfile})))
const Assessments       = lazy(() => import('./pages/student/Assessments').then(m=>({default:m.Assessments})))
const AssessmentTake    = lazy(() => import('./pages/student/AssessmentTake').then(m=>({default:m.AssessmentTake})))
const MyResults         = lazy(() => import('./pages/student/MyResults').then(m=>({default:m.MyResults})))
const JobMatches        = lazy(() => import('./pages/student/JobMatches').then(m=>({default:m.JobMatches})))
const StudentInterviews = lazy(() => import('./pages/student/Interviews').then(m=>({default:m.StudentInterviews})))
const PlacementTracking = lazy(() => import('./pages/student/PlacementTracking').then(m=>({default:m.PlacementTracking})))
const StudentNotifs     = lazy(() => import('./pages/student/Notifications').then(m=>({default:m.StudentNotifications})))
const StudentSettings   = lazy(() => import('./pages/student/Settings').then(m=>({default:m.StudentSettings})))

// ── Admin portal (lazy) ──────────────────────────────────────────────────
const AdminLayout        = lazy(() => import('./pages/admin/AdminLayout').then(m=>({default:m.AdminLayout})))
const AdminDashboard     = lazy(() => import('./pages/admin/Dashboard').then(m=>({default:m.AdminDashboard})))
const AdminStudents      = lazy(() => import('./pages/admin/Students').then(m=>({default:m.AdminStudents})))
const AdminStudentDetail = lazy(() => import('./pages/admin/StudentDetail').then(m=>({default:m.AdminStudentDetail})).catch(()=>({default:()=>null})))
const AdminAssessments   = lazy(() => import('./pages/admin/Assessments').then(m=>({default:m.AdminAssessments})))
const QuestionBank       = lazy(() => import('./pages/admin/QuestionBank').then(m=>({default:m.QuestionBank})))
const AdminJobPostings   = lazy(() => import('./pages/admin/JobPostings').then(m=>({default:m.AdminJobPostings})))
const AdminInterviews    = lazy(() => import('./pages/admin/Interviews').then(m=>({default:m.AdminInterviews})))
const ProctoringReview   = lazy(() => import('./pages/admin/ProctoringReview').then(m=>({default:m.ProctoringReview})))
const CompanyVerification= lazy(() => import('./pages/admin/CompanyVerification').then(m=>({default:m.CompanyVerification})))
const ConnectionApproval = lazy(() => import('./pages/admin/ConnectionApproval').then(m=>({default:m.ConnectionApproval})).catch(()=>({default:()=>null})))
const AdminAnalytics     = lazy(() => import('./pages/admin/Analytics').then(m=>({default:m.AdminAnalytics})))
const AdminReports       = lazy(() => import('./pages/admin/Reports').then(m=>({default:m.AdminReports})))
const AdminSettings      = lazy(() => import('./pages/admin/Settings').then(m=>({default:m.AdminSettings})))
const CreateStudent      = lazy(() => import('./pages/admin/CreateStudent').then(m=>({default:m.CreateStudent})))

// ── Partner portal (lazy) ────────────────────────────────────────────────
const PartnerLayout    = lazy(() => import('./pages/partner/PartnerLayout').then(m=>({default:m.PartnerLayout})))
const PartnerDashboard = lazy(() => import('./pages/partner/Dashboard').then(m=>({default:m.PartnerDashboard})))
const PostJob          = lazy(() => import('./pages/partner/PostJob').then(m=>({default:m.PostJob})))
const MyJobs           = lazy(() => import('./pages/partner/MyJobs').then(m=>({default:m.MyJobs})))
const Applications     = lazy(() => import('./pages/partner/Applications').then(m=>({default:m.Applications})))
const PartnerInterviews= lazy(() => import('./pages/partner/Interviews').then(m=>({default:m.PartnerInterviews})))
const PartnerProfile   = lazy(() => import('./pages/partner/Profile').then(m=>({default:m.PartnerProfile})))
const PartnerSettings  = lazy(() => import('./pages/partner/Settings').then(m=>({default:m.PartnerSettings})))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/"         element={<Navigate to="/login" replace />} />

              {/* Student Portal */}
              <Route path="/student" element={<RoleGuard allowedRole="student"><StudentLayout /></RoleGuard>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard"              element={<StudentDashboard />} />
                <Route path="profile"                element={<StudentProfile />} />
                <Route path="assessments"            element={<Assessments />} />
                <Route path="assessments/:id/take"   element={<AssessmentTake />} />
                <Route path="results"                element={<MyResults />} />
                <Route path="job-matches"            element={<JobMatches />} />
                <Route path="interviews"             element={<StudentInterviews />} />
                <Route path="tracking"               element={<PlacementTracking />} />
                <Route path="notifications"          element={<StudentNotifs />} />
                <Route path="settings"               element={<StudentSettings />} />
              </Route>

              {/* Admin Portal */}
              <Route path="/admin" element={<RoleGuard allowedRole="admin"><AdminLayout /></RoleGuard>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard"          element={<AdminDashboard />} />
                <Route path="students"           element={<AdminStudents />} />
                <Route path="students/:id"       element={<AdminStudentDetail />} />
                <Route path="create-student"     element={<CreateStudent />} />
                <Route path="assessments"        element={<AdminAssessments />} />
                <Route path="question-bank"      element={<QuestionBank />} />
                <Route path="job-postings"       element={<AdminJobPostings />} />
                <Route path="interviews"         element={<AdminInterviews />} />
                <Route path="proctoring-review"  element={<ProctoringReview />} />
                <Route path="company-verification" element={<CompanyVerification />} />
                <Route path="connections"        element={<ConnectionApproval />} />
                <Route path="analytics"          element={<AdminAnalytics />} />
                <Route path="reports"            element={<AdminReports />} />
                <Route path="settings"           element={<AdminSettings />} />
              </Route>

              {/* Partner Portal */}
              <Route path="/partner" element={<RoleGuard allowedRole="partner"><PartnerLayout /></RoleGuard>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard"    element={<PartnerDashboard />} />
                <Route path="post-job"     element={<PostJob />} />
                <Route path="my-jobs"      element={<MyJobs />} />
                <Route path="applications" element={<Applications />} />
                <Route path="interviews"   element={<PartnerInterviews />} />
                <Route path="profile"      element={<PartnerProfile />} />
                <Route path="settings"     element={<PartnerSettings />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
