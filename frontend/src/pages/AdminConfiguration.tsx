import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { healthApi, actuatorApi, usersApi, coursesApi, enrollmentsApi, enrollmentWindowApi } from '../services/api'

interface HealthTile {
  title: string
  description: string
  status: 'loading' | 'success' | 'error' | 'disabled'
  value?: string
  error?: string
  lastRefresh?: Date
}

interface EnrollmentWindow {
  state: 'OPEN' | 'CLOSED'
  term?: string
  startDate?: string
  endDate?: string
  window_open_date_est?: string
  window_close_date_est?: string
  today_date_est?: string
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

  // Enrollment window state
  const [enrollmentWindow, setEnrollmentWindow] = useState<EnrollmentWindow>({
    state: 'OPEN',
    term: '',
    startDate: '',
    endDate: ''
  })
  const [windowLoading, setWindowLoading] = useState(true)
  const [showWindowModal, setShowWindowModal] = useState(false)
  const [windowErrors, setWindowErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    refreshAllTiles()
    fetchEnrollmentWindow()
  }, [])

  const fetchEnrollmentWindow = async () => {
    setWindowLoading(true)
    try {
      const response = await enrollmentWindowApi.getEnrollmentWindow()
      if (response) {
        setEnrollmentWindow(response)
      }
    } catch (error: any) {
      console.error('Error fetching enrollment window:', error)
      // Use default values on error
      setEnrollmentWindow({
        state: 'OPEN',
        term: 'Fall 2024',
        startDate: '2024-08-01',
        endDate: '2024-08-31',
        today_date_est: new Date().toISOString().split('T')[0]
      })
    } finally {
      setWindowLoading(false)
    }
  }

  const updateEnrollmentWindow = async (windowData: EnrollmentWindow) => {
    setWindowErrors({})
    
    // Validate dates
    const errors = validateEnrollmentWindow(windowData)
    if (Object.keys(errors).length > 0) {
      setWindowErrors(errors)
      return
    }
    
    try {
      const response = await enrollmentWindowApi.updateEnrollmentWindow({
        state: windowData.state,
        term: windowData.term,
        startDate: windowData.window_open_date_est || windowData.startDate,
        endDate: windowData.window_close_date_est || windowData.endDate
      })
      
      if (response.success) {
        // Refresh the window data to get updated today_date_est
        await fetchEnrollmentWindow()
        toast.success('Enrollment window updated successfully')
        setShowWindowModal(false)
      }
    } catch (error: any) {
      console.error('Error updating enrollment window:', error)
      toast.error(error.response?.data?.message || 'Failed to update enrollment window')
    }
  }

  const validateEnrollmentWindow = (windowData: EnrollmentWindow): Record<string, string> => {
    const errors: Record<string, string> = {}
    const today = windowData.today_date_est || new Date().toISOString().split('T')[0]
    
    const openDate = windowData.window_open_date_est || windowData.startDate
    const closeDate = windowData.window_close_date_est || windowData.endDate
    
    // Block past terms/opens
    if (openDate && openDate < today) {
      errors.startDate = 'Cannot set enrollment window open date in the past'
    }
    
    if (closeDate && openDate && closeDate <= openDate) {
      errors.endDate = 'End date must be after start date'
    }
    
    return errors
  }

  const getEnrollmentWindowWarnings = (windowData: EnrollmentWindow): { message: string; color: string } | null => {
    const openDate = windowData.window_open_date_est || windowData.startDate
    const closeDate = windowData.window_close_date_est || windowData.endDate
    
    if (!openDate || !closeDate) return null
    
    const open = new Date(openDate)
    const close = new Date(closeDate)
    const diffTime = close.getTime() - open.getTime()
    const daysOpen = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (daysOpen < 14) {
      return {
        message: `Shorter than expected (${daysOpen} days)`,
        color: 'text-orange-600'
      }
    } else if (daysOpen > 14) {
      return {
        message: `Longer than expected (${daysOpen} days)`,
        color: 'text-yellow-600'
      }
    }
    
    return null
  }

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
        let count = 0
        if (response.data.content) {
          count = response.data.totalElements || response.data.content.length
        } else if (Array.isArray(response.data)) {
          count = response.data.length
        }
        updateTile(index, {
          status: 'success',
          value: `${count}+ users`,
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
        let count = 0
        if (response.data.content) {
          count = response.data.totalElements || response.data.content.length
        } else if (response.data.items) {
          count = response.data.items.length
        } else if (Array.isArray(response.data)) {
          count = response.data.length
        }
        updateTile(index, {
          status: 'success',
          value: `${count}+ courses`,
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
        let count = 0
        if (response.data.content) {
          count = response.data.totalElements || response.data.content.length
        } else if (Array.isArray(response.data)) {
          count = response.data.length
        }
        updateTile(index, {
          status: 'success',
          value: `${count}+ enrollments`,
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                    : tile.status === 'error'
                    ? 'text-red-600 hover:text-red-800'
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
                ) : tile.status === 'error' ? (
                  'Retry'
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Enrollment Window Configuration */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-semibold">Enrollment Window</h2>
            <p className="text-gray-600">Manage student enrollment periods and availability</p>
          </div>
          <button
            onClick={() => setShowWindowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Configure
          </button>
        </div>
        
        {windowLoading ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading enrollment window...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                enrollmentWindow.state === 'OPEN' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {enrollmentWindow.state}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Term:</span>
              <span className="font-medium">{enrollmentWindow.term || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span>Start Date:</span>
              <span className="font-medium">{enrollmentWindow.startDate || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span>End Date:</span>
              <span className="font-medium">{enrollmentWindow.endDate || 'Not set'}</span>
            </div>
          </div>
        )}
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

      {/* Enrollment Window Configuration Modal */}
      {showWindowModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Configure Enrollment Window
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault()
                updateEnrollmentWindow(enrollmentWindow)
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                      windowErrors.state ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    value={enrollmentWindow.state}
                    onChange={(e) => setEnrollmentWindow({ ...enrollmentWindow, state: e.target.value as 'OPEN' | 'CLOSED' })}
                    required
                  >
                    <option value="OPEN">Open</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  {windowErrors.state && (
                    <p className="mt-1 text-sm text-red-600">{windowErrors.state}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Term
                  </label>
                  <input
                    type="text"
                    className={`block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                      windowErrors.term ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    value={enrollmentWindow.term}
                    onChange={(e) => setEnrollmentWindow({ ...enrollmentWindow, term: e.target.value })}
                    placeholder="e.g., Fall 2024"
                  />
                  {windowErrors.term && (
                    <p className="mt-1 text-sm text-red-600">{windowErrors.term}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className={`block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                      windowErrors.startDate ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    value={enrollmentWindow.startDate}
                    onChange={(e) => setEnrollmentWindow({ ...enrollmentWindow, startDate: e.target.value })}
                  />
                  {windowErrors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{windowErrors.startDate}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    className={`block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                      windowErrors.endDate ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    value={enrollmentWindow.endDate}
                    onChange={(e) => setEnrollmentWindow({ ...enrollmentWindow, endDate: e.target.value })}
                  />
                  {windowErrors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{windowErrors.endDate}</p>
                  )}
                  {(() => {
                    const warning = getEnrollmentWindowWarnings(enrollmentWindow)
                    return warning ? (
                      <p className={`mt-1 text-sm ${warning.color}`}>{warning.message}</p>
                    ) : null
                  })()}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Update Window
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWindowModal(false)
                      setWindowErrors({})
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminConfiguration