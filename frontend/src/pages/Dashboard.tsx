import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { UserRole } from '../types/api'
import { configApi, actuatorApi } from '../services/api'

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
  const [configMeta, setConfigMeta] = useState<any>(null)
  const [healthStatus, setHealthStatus] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      
      try {
        // Load config meta if user is staff/admin
        if (user.role === UserRole.STAFF || user.role === UserRole.ADMIN) {
          try {
            const configResponse = await configApi.getMeta()
            setConfigMeta(configResponse.data)
          } catch (error) {
            console.error('Failed to load config meta:', error)
          }

          try {
            const healthResponse = await actuatorApi.getHealth()
            setHealthStatus(healthResponse)
          } catch (error) {
            console.error('Failed to load health status:', error)
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      }
    }

    loadData()
  }, [user])

  const handleRefresh = async () => {
    // Reload the page data
    window.location.reload()
  }

  const getStudentTiles = (): DashboardTile[] => [
    {
      title: 'My Courses',
      description: 'View your enrolled courses',
      href: '/courses'
    },
    {
      title: 'Grades',
      description: 'Check your grades',
      href: '/grades'
    },
    {
      title: 'Enrollments',
      description: 'Manage enrollments',
      href: '/enrollments'
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
      title: 'Health',
      description: 'System health status',
      status: healthStatus ? 'success' : 'error',
      value: healthStatus?.status || 'Unknown'
    },
    {
      title: 'Config',
      description: 'System configuration',
      status: configMeta ? 'success' : 'loading',
      value: configMeta ? 'Loaded' : 'Loading...'
    },
    {
      title: 'Approvals',
      description: 'User approval requests',
      href: '/staff/users'
    },
    {
      title: 'Data Exports',
      description: 'Export system data',
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{getDashboardTitle()}</h1>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh
        </button>
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
