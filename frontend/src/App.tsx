import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Enrollments from './pages/Enrollments'
import Grades from './pages/Grades'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminCourses from './pages/AdminCourses'
import AdminGrades from './pages/AdminGrades'
import AdminConfiguration from './pages/AdminConfiguration'
import AdminEnrollments from './pages/AdminEnrollments'
import { UserRole } from './types/api'

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
      <Toaster position="top-right" />
    </AuthProvider>
  )
}

function AppRoutes() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    )
  }

  // Route guard component for admin-only routes
  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (user.role !== UserRole.ADMIN) {
      console.warn(`Access denied: ${user.role} attempted to access admin route`)
      return <Navigate to="/" />
    }
    return <>{children}</>
  }

  // Route guard component for admin/staff routes
  const AdminStaffRoute = ({ children }: { children: React.ReactNode }) => {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.STAFF) {
      console.warn(`Access denied: ${user.role} attempted to access admin/staff route`)
      return <Navigate to="/" />
    }
    return <>{children}</>
  }

  return (
    <Layout>
      <Routes>
        {user.role === UserRole.STUDENT ? (
          <>
            <Route path="/" element={<Navigate to="/student" />} />
            <Route path="/student" element={<Dashboard />} />
            <Route path="/student/courses" element={<Courses />} />
            <Route path="/student/enrollments" element={<Enrollments />} />
            <Route path="/student/grades" element={<Grades />} />
            <Route path="/student/profile" element={<Profile />} />
            {/* Redirect root level routes to student paths */}
            <Route path="/dashboard" element={<Navigate to="/student" />} />
            <Route path="/courses" element={<Navigate to="/student/courses" />} />
            <Route path="/enrollments" element={<Navigate to="/student/enrollments" />} />
            <Route path="/grades" element={<Navigate to="/student/grades" />} />
            <Route path="/profile" element={<Navigate to="/student/profile" />} />
            {/* Block access to admin/staff routes */}
            <Route path="/admin/*" element={<Navigate to="/student" />} />
            <Route path="/staff/*" element={<Navigate to="/student" />} />
            <Route path="/instructor/*" element={<Navigate to="/student" />} />
            <Route path="*" element={<Navigate to="/student" />} />
          </>
        ) : user.role === UserRole.INSTRUCTOR ? (
          <>
            <Route path="/" element={<Navigate to="/instructor" />} />
            <Route path="/instructor" element={<Dashboard />} />
            <Route path="/instructor/courses" element={<AdminCourses />} />
            <Route path="/instructor/grades" element={<Grades />} />
            <Route path="/profile" element={<Profile />} />
            {/* Block access to admin routes */}
            <Route path="/admin/*" element={<Navigate to="/instructor" />} />
            <Route path="/staff/*" element={<Navigate to="/instructor" />} />
            <Route path="*" element={<Navigate to="/instructor" />} />
          </>
        ) : user.role === UserRole.STAFF ? (
          <>
            <Route path="/" element={<Navigate to="/staff" />} />
            <Route path="/staff" element={<Dashboard />} />
            <Route path="/staff/users" element={<AdminStaffRoute><AdminUsers /></AdminStaffRoute>} />
            <Route path="/staff/support" element={<AdminDashboard />} />
            <Route path="/profile" element={<Profile />} />
            {/* Block access to admin-only routes */}
            <Route path="/admin/*" element={<Navigate to="/staff" />} />
            <Route path="*" element={<Navigate to="/staff" />} />
          </>
        ) : (
          // ADMIN role
          <>
            <Route path="/" element={<Navigate to="/admin" />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/course-management" element={<AdminRoute><AdminCourses /></AdminRoute>} />
            <Route path="/admin/grade-management" element={<AdminRoute><AdminGrades /></AdminRoute>} />
            <Route path="/admin/enrollments" element={<AdminRoute><AdminEnrollments /></AdminRoute>} />
            <Route path="/admin/config" element={<AdminRoute><AdminConfiguration /></AdminRoute>} />
            <Route path="/profile" element={<Profile />} />
            {/* Redirect old course route to new name */}
            <Route path="/admin/courses" element={<Navigate to="/admin/course-management" />} />
            <Route path="/admin/grades" element={<Navigate to="/admin/grade-management" />} />
            <Route path="*" element={<Navigate to="/admin" />} />
          </>
        )}
      </Routes>
    </Layout>
  )
}

export default App
