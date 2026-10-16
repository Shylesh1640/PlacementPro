import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { RoleGuard } from './components/guards/RoleGuard'

// Auth
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'

// Student Layout + Pages
import { StudentLayout } from './pages/student/StudentLayout'
import { StudentDashboard } from './pages/student/Dashboard'
import { StudentProfile } from './pages/student/Profile'
import { Assessments } from './pages/student/Assessments'
import { AssessmentTake } from './pages/student/AssessmentTake'
import { MyResults } from './pages/student/MyResults'
import { JobMatches } from './pages/student/JobMatches'
import { StudentInterviews } from './pages/student/Interviews'
import { PlacementTracking } from './pages/student/PlacementTracking'
import { StudentNotifications } from './pages/student/Notifications'
import { StudentSettings } from './pages/student/Settings'

// Admin Layout + Pages
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminDashboard } from './pages/admin/Dashboard'
import { AdminStudents } from './pages/admin/Students'
import { AdminAssessments } from './pages/admin/Assessments'
import { AdminJobPostings } from './pages/admin/JobPostings'
import { AdminInterviews } from './pages/admin/Interviews'
import { AdminAnalytics } from './pages/admin/Analytics'
import { AdminReports } from './pages/admin/Reports'
import { AdminSettings } from './pages/admin/Settings'
import { ProctoringReview } from './pages/admin/ProctoringReview'
import { CompanyVerification } from './pages/admin/CompanyVerification'
import { QuestionBank } from './pages/admin/QuestionBank'
import { CreateStudent } from './pages/admin/CreateStudent'

// Partner Layout + Pages
import { PartnerLayout } from './pages/partner/PartnerLayout'
import { PartnerDashboard } from './pages/partner/Dashboard'
import { PostJob } from './pages/partner/PostJob'
import { MyJobs } from './pages/partner/MyJobs'
import { Applications } from './pages/partner/Applications'
import { PartnerInterviews } from './pages/partner/Interviews'
import { PartnerProfile } from './pages/partner/Profile'
import { PartnerSettings } from './pages/partner/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Student Portal */}
            <Route
              path="/student"
              element={
                <RoleGuard allowedRole="student">
                  <StudentLayout />
                </RoleGuard>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="assessments" element={<Assessments />} />
              <Route path="assessments/:id/take" element={<AssessmentTake />} />
              <Route path="results" element={<MyResults />} />
              <Route path="job-matches" element={<JobMatches />} />
              <Route path="interviews" element={<StudentInterviews />} />
              <Route path="tracking" element={<PlacementTracking />} />
              <Route path="notifications" element={<StudentNotifications />} />
              <Route path="settings" element={<StudentSettings />} />
            </Route>

            {/* Admin Portal */}
            <Route
              path="/admin"
              element={
                <RoleGuard allowedRole="admin">
                  <AdminLayout />
                </RoleGuard>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="create-student" element={<CreateStudent />} />
              <Route path="assessments" element={<AdminAssessments />} />
              <Route path="question-bank" element={<QuestionBank />} />
              <Route path="job-postings" element={<AdminJobPostings />} />
              <Route path="interviews" element={<AdminInterviews />} />
              <Route path="proctoring-review" element={<ProctoringReview />} />
              <Route path="company-verification" element={<CompanyVerification />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Partner Portal */}
            <Route
              path="/partner"
              element={
                <RoleGuard allowedRole="partner">
                  <PartnerLayout />
                </RoleGuard>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PartnerDashboard />} />
              <Route path="post-job" element={<PostJob />} />
              <Route path="my-jobs" element={<MyJobs />} />
              <Route path="applications" element={<Applications />} />
              <Route path="interviews" element={<PartnerInterviews />} />
              <Route path="profile" element={<PartnerProfile />} />
              <Route path="settings" element={<PartnerSettings />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
