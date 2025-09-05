import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { UserRole } from '../types/api'
import { toast } from 'react-hot-toast'

interface NavItem {
  name: string
  href: string
  icon?: string
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  const getBrandLinkRoute = (): string => {
    if (!user) return '/login'
    
    switch (user.role) {
      case UserRole.ADMIN:
        return '/admin'
      case UserRole.INSTRUCTOR:
        return '/instructor'
      case UserRole.STAFF:
        return '/staff'
      case UserRole.STUDENT:
        return '/student'
      default:
        return '/login'
    }
  }

  const getProfileBadgeRoute = (): string => {
    if (!user) return '/login'
    
    // Only admin and staff can access the users page
    if (user.role === UserRole.ADMIN) {
      return `/admin/users?role=${user.role}`
    } else if (user.role === UserRole.STAFF) {
      return `/staff/users?role=${user.role}`
    }
    
    // For instructors and students, just show the role without linking
    return '#'
  }

  const getNavigationItems = (): NavItem[] => {
    if (!user) return []

    switch (user.role) {
      case UserRole.STUDENT:
        return [
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Courses', href: '/courses' },
          { name: 'Enrollments', href: '/enrollments' },
          { name: 'Grades', href: '/grades' },
          { name: 'Profile', href: '/profile' }
        ]
      case UserRole.INSTRUCTOR:
        return [
          { name: 'Dashboard', href: '/instructor' },
          { name: 'My Courses', href: '/instructor/courses' },
          { name: 'Grades', href: '/instructor/grades' },
          { name: 'Profile', href: '/profile' }
        ]
      case UserRole.STAFF:
        return [
          { name: 'Dashboard', href: '/staff' },
          { name: 'Users', href: '/staff/users' },
          { name: 'Support', href: '/staff/support' },
          { name: 'Profile', href: '/profile' }
        ]
      case UserRole.ADMIN:
        return [
          { name: 'Dashboard', href: '/admin' },
          { name: 'Users', href: '/admin/users' },
          { name: 'Courses', href: '/admin/courses' },
          { name: 'Profile', href: '/profile' }
        ]
      default:
        return []
    }
  }

  const navigationItems = getNavigationItems()

  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case UserRole.STUDENT: return 'Student'
      case UserRole.INSTRUCTOR: return 'Instructor'
      case UserRole.STAFF: return 'Staff'
      case UserRole.ADMIN: return 'Administrator'
      default: return 'User'
    }
  }

  if (!user) {
    return <div>{children}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link 
                  to={getBrandLinkRoute()} 
                  className="text-xl font-bold text-gray-900 hover:text-blue-600"
                >
                  CEGM LMS
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="relative">
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    {(user.role === UserRole.ADMIN || user.role === UserRole.STAFF) ? (
                      <Link 
                        to={getProfileBadgeRoute()}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {getRoleDisplayName(user.role)}
                      </Link>
                    ) : (
                      <div className="text-gray-500">{getRoleDisplayName(user.role)}</div>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-white text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    location.pathname === item.href
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="px-4">
                <div className="text-base font-medium text-gray-800">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-gray-500">{getRoleDisplayName(user.role)}</div>
              </div>
              <div className="mt-3 px-4">
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-base font-medium text-gray-500 hover:text-gray-800"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
