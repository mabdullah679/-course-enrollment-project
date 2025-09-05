import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { UserRole } from '../types/api'
import { coursesApi, enrollmentsApi, gradesApi } from '../services/api'
import RefreshButton from '../components/common/RefreshButton'
import LoadingSpinner from '../components/common/LoadingSpinner'

interface DashboardTile {
  title: string
  description: string
  href?: string
  action?: () => void
  status?: 'loading' | 'success' | 'error'
  value?: string
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [dashboardData, setDashboardData] = useState({
    coursesCount: 0,
    enrollmentsCount: 0,
    gradesCount: 0,
    loading: true
  })

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return
    
    setDashboardData(prev => ({ ...prev, loading: true }))
    
    try {
      if (user.role === UserRole.STUDENT) {
        const [coursesResp, enrollmentsResp, gradesResp] = await Promise.all([
          coursesApi.getStudentCourses(true).catch(() => ({ data: { content: [] } })),
          enrollmentsApi.getStudentEnrollments(user.id).catch(() => ({ data: { content: [] } })),
          gradesApi.getStudentGrades(user.id).catch(() => ({ data: { content: [] } }))
        ])
        
        setDashboardData({
          coursesCount: coursesResp.data?.content?.length || 0,
          enrollmentsCount: enrollmentsResp.data?.content?.length || 0,
          gradesCount: gradesResp.data?.content?.length || 0,
          loading: false
        })
      } else {
        // For other roles, just mark as loaded
        setDashboardData(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setDashboardData(prev => ({ ...prev, loading: false }))
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to refresh dashboard:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const getStudentTiles = (): DashboardTile[] => [
    {
      title: 'My Courses',
      description: 'View your enrolled courses',
      href: '/student/courses',
      value: dashboardData.loading ? 'Loading...' : `${dashboardData.coursesCount} courses`
    },
    {
      title: 'Grades',
      description: 'Check your grades',
      href: '/student/grades',
      value: dashboardData.loading ? 'Loading...' : `${dashboardData.gradesCount} grades`
    },
    {
      title: 'Enrollments',
      description: 'Manage enrollments',
      href: '/student/enrollments',
      value: dashboardData.loading ? 'Loading...' : `${dashboardData.enrollmentsCount} enrollments`
    },
    {
      title: 'Profile',
      description: 'View and update your profile',
      href: '/student/profile'
    }
  ]

  const getInstructorTiles = (): DashboardTile[] => [
    {
      title: 'Courses',
      description: 'Manage your courses',
      href: '/instructor/courses'
    },
    {
      title: 'Enrollments',
      description: 'Review student enrollments',
      href: '/enrollments'
    },
    {
      title: 'Gradebook',
      description: 'Grade student work',
      href: '/instructor/grades'
    },
    {
      title: 'Quick Actions',
      description: 'Common instructor tasks',
      action: handleRefresh
    }
  ]

  const getStaffTiles = (): DashboardTile[] => [
    {
      title: 'User Management',
      description: 'Manage user approvals and roles',
      href: '/staff/users'
    },
    {
      title: 'Support Dashboard',
      description: 'Staff support and system monitoring',
      href: '/staff/support'
    },
    {
      title: 'Quick Actions',
      description: 'Common staff tasks',
      action: handleRefresh
    }
  ]

  const getTiles = (): DashboardTile[] => {
    if (!user) return []
    
    switch (user.role) {
      case UserRole.STUDENT:
        return getStudentTiles()
      case UserRole.INSTRUCTOR:
        return getInstructorTiles()
      case UserRole.STAFF:
        return getStaffTiles()
      case UserRole.ADMIN:
        // Admin uses separate AdminDashboard component
        return []
      default:
        return []
    }
  }

  const getDashboardTitle = (): string => {
    if (!user) return 'Dashboard'
    
    switch (user.role) {
      case UserRole.STUDENT:
        return 'Student Dashboard'
      case UserRole.INSTRUCTOR:
        return 'Instructor Dashboard'
      case UserRole.STAFF:
        return 'Staff Dashboard'
      case UserRole.ADMIN:
        return 'Admin Dashboard'
      default:
        return 'Dashboard'
    }
  }

  const tiles = getTiles()

  if (dashboardData.loading && user?.role === UserRole.STUDENT) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" text="Loading your dashboard..." className="py-12" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{getDashboardTitle()}</h1>
        <RefreshButton onClick={handleRefresh} loading={refreshing} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiles.map((tile, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-semibold">{tile.title}</h2>
              {tile.status && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  tile.status === 'success' ? 'bg-green-100 text-green-800' :
                  tile.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {tile.status}
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-4">{tile.description}</p>
            {tile.value && (
              <p className="text-sm font-medium text-blue-600 mb-4">{tile.value}</p>
            )}
            {tile.href ? (
              <Link
                to={tile.href}
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                View →
              </Link>
            ) : tile.action ? (
              <button
                onClick={tile.action}
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                Execute →
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
