import React, { useState, useEffect } from 'react'
import { healthApi, actuatorApi, usersApi, coursesApi, enrollmentsApi } from '../services/api'

interface HealthTile {
  title: string
  description: string
  status: 'loading' | 'success' | 'error' | 'disabled'
  value?: string
  error?: string
  lastRefresh?: Date
}

const AdminConfiguration: React.FC = () => {
  const [tiles, setTiles] = useState<HealthTile[]>([
    {
      title: 'Backend Health',
      description: 'Core application health status',
      status: 'loading'
    },
    {
      title: 'Actuator Health',
      description: 'Spring Boot actuator health check',
      status: 'loading'
    },
    {
      title: 'System Info',
      description: 'Application metadata and build info',
      status: 'loading'
    },
    {
      title: 'User Count',
      description: 'Total users in the system',
      status: 'loading'
    },
    {
      title: 'Course Count',
      description: 'Total courses in the system',
      status: 'loading'
    },
    {
      title: 'Enrollment Count',
      description: 'Total enrollments in the system',
      status: 'loading'
    }
  ])

  useEffect(() => {
    refreshAllTiles()
  }, [])

  const refreshAllTiles = async () => {
    await Promise.all([
      refreshBackendHealth(),
      refreshActuatorHealth(),
      refreshSystemInfo(),
      refreshUserCount(),
      refreshCourseCount(),
      refreshEnrollmentCount()
    ])
  }

  const updateTile = (index: number, updates: Partial<HealthTile>) => {
    setTiles(prev => prev.map((tile, i) => 
      i === index ? { ...tile, ...updates, lastRefresh: new Date() } : tile
    ))
  }

  const refreshBackendHealth = async () => {
    const index = 0
    updateTile(index, { status: 'loading' })
    try {
      const response = await healthApi.getHealth()
      updateTile(index, {
        status: 'success',
        value: response.status || 'UP',
        error: undefined
      })
    } catch (error: any) {
      updateTile(index, {
        status: 'error',
        value: 'DOWN',
        error: error.response?.data?.message || 'Service unavailable'
      })
    }
  }

  const refreshActuatorHealth = async () => {
    const index = 1
    updateTile(index, { status: 'loading' })
    try {
      const response = await actuatorApi.getHealth()
      updateTile(index, {
        status: response.status === 'UP' ? 'success' : 'error',
        value: response.status || 'UP',
        error: undefined
      })
    } catch (error: any) {
      updateTile(index, {
        status: 'disabled',
        value: 'Disabled',
        error: 'Actuator endpoint not available'
      })
    }
  }

  const refreshSystemInfo = async () => {
    const index = 2
    updateTile(index, { status: 'loading' })
    try {
      const response = await actuatorApi.getInfo()
      updateTile(index, {
        status: 'success',
        value: response.app?.name || 'Available',
        error: undefined
      })
    } catch (error: any) {
      updateTile(index, {
        status: 'disabled',
        value: 'Disabled',
        error: 'Info endpoint not available'
      })
    }
  }

  const refreshUserCount = async () => {
    const index = 3
    updateTile(index, { status: 'loading' })
    try {
      const response = await usersApi.getUsers(undefined, 1) // Just get count info
      if (response.success && response.data) {
        updateTile(index, {
          status: 'success',
          value: `${response.data.content?.length || 0}+ users`,
          error: undefined
        })
      }
    } catch (error: any) {
      updateTile(index, {
        status: 'error',
        value: 'Error',
        error: 'Failed to get user count'
      })
    }
  }

  const refreshCourseCount = async () => {
    const index = 4
    updateTile(index, { status: 'loading' })
    try {
      const response = await coursesApi.getCourses(undefined, 1) // Just get count info
      if (response.success && response.data) {
        updateTile(index, {
          status: 'success',
          value: `${response.data.content?.length || 0}+ courses`,
          error: undefined
        })
      }
    } catch (error: any) {
      updateTile(index, {
        status: 'error',
        value: 'Error',
        error: 'Failed to get course count'
      })
    }
  }

  const refreshEnrollmentCount = async () => {
    const index = 5
    updateTile(index, { status: 'loading' })
    try {
      const response = await enrollmentsApi.getEnrollments(undefined, 1) // Just get count info
      if (response.success && response.data) {
        updateTile(index, {
          status: 'success',
          value: `${response.data.content?.length || 0}+ enrollments`,
          error: undefined
        })
      }
    } catch (error: any) {
      updateTile(index, {
        status: 'error',
        value: 'Error',
        error: 'Failed to get enrollment count'
      })
    }
  }

  const getRefreshFunction = (index: number) => {
    switch (index) {
      case 0: return refreshBackendHealth
      case 1: return refreshActuatorHealth
      case 2: return refreshSystemInfo
      case 3: return refreshUserCount
      case 4: return refreshCourseCount
      case 5: return refreshEnrollmentCount
      default: return () => Promise.resolve()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'disabled':
        return 'bg-gray-100 text-gray-500'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Configuration</h1>
          <p className="mt-2 text-sm text-gray-700">
            System health monitoring and configuration overview.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={refreshAllTiles}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Refresh All
          </button>
        </div>
      </div>

      {/* Health Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiles.map((tile, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-semibold">{tile.title}</h2>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(tile.status)}`}>
                {tile.status}
              </span>
            </div>
            
            <p className="text-gray-600 mb-4">{tile.description}</p>
            
            {tile.value && (
              <p className={`text-sm font-medium mb-4 ${
                tile.status === 'error' ? 'text-red-600' : 
                tile.status === 'disabled' ? 'text-gray-400' : 'text-blue-600'
              }`}>
                {tile.value}
              </p>
            )}
            
            {tile.error && (
              <p className="text-sm text-red-600 mb-4">{tile.error}</p>
            )}
            
            {tile.lastRefresh && (
              <p className="text-xs text-gray-500 mb-4">
                Last refresh: {tile.lastRefresh.toLocaleTimeString()}
              </p>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={getRefreshFunction(index)}
                disabled={tile.status === 'loading'}
                className={`inline-flex items-center font-medium text-sm ${
                  tile.status === 'loading' 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                {tile.status === 'loading' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* System Information */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span>Environment:</span>
            <span className="font-medium">Development</span>
          </div>
          <div className="flex justify-between">
            <span>Database:</span>
            <span className="font-medium">H2 In-Memory</span>
          </div>
          <div className="flex justify-between">
            <span>Frontend URL:</span>
            <span className="font-medium">http://localhost:3000</span>
          </div>
          <div className="flex justify-between">
            <span>Backend URL:</span>
            <span className="font-medium">http://localhost:8080</span>
          </div>
          <div className="flex justify-between">
            <span>Session Type:</span>
            <span className="font-medium">Cookie-based</span>
          </div>
          <div className="flex justify-between">
            <span>CORS Enabled:</span>
            <span className="font-medium text-green-600">Yes</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminConfiguration