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
            <Route path="/student" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/enrollments" element={<Enrollments />} />
            <Route path="/grades" element={<Grades />} />
            <Route path="/profile" element={<Profile />} />
            {/* Block access to admin/staff routes */}
            <Route path="/admin/*" element={<Navigate to="/dashboard" />} />
            <Route path="/staff/*" element={<Navigate to="/dashboard" />} />
            <Route path="/instructor/*" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
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
            <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/admin" />} />
          </>
        )}
      </Routes>
    </Layout>
  )
}

export default App
