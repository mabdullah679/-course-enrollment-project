import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { configApi, metricsApi } from '../services/api'

interface CapabilityStatus {
  available: boolean
  probed: boolean
  data?: any
  error?: string
}

interface AdminTile {
  title: string
  description: string
  href?: string
  action?: () => void
  status?: 'loading' | 'success' | 'error' | 'info' | 'disabled'
  value?: string
  disabled?: boolean
  tooltip?: string
}

const AdminDashboard: React.FC = () => {
  const [capabilities, setCapabilities] = useState({
    configMeta: { available: false, probed: false } as CapabilityStatus,
    actuatorHealth: { available: false, probed: false } as CapabilityStatus,
    actuatorInfo: { available: false, probed: false } as CapabilityStatus,
  })
  
  const [counts, setCounts] = useState({
    users: 0,
    courses: 0,
    enrollments: 0,
    grades: 0,
    loading: true
  })

  // One-time capability probe on component mount
  useEffect(() => {
    probeCapabilities()
    loadCounts()
  }, [])

  const loadCounts = async () => {
    try {
      const [usersResp, coursesResp, enrollmentsResp, gradesResp] = await Promise.all([
        metricsApi.getUsersCount(),
        metricsApi.getCoursesCount(), 
        metricsApi.getEnrollmentsCount(),
        metricsApi.getGradesCount()
      ])
      
      setCounts({
        users: usersResp.count || 0,
        courses: coursesResp.count || 0,
        enrollments: enrollmentsResp.count || 0,
        grades: gradesResp.count || 0,
        loading: false
      })
    } catch (error) {
      console.error('Error loading counts:', error)
      setCounts(prev => ({ ...prev, loading: false }))
    }
  }

  const probeCapabilities = async () => {
    console.info('Probing system capabilities...')
    
    // Probe config meta
    try {
      const configResponse = await configApi.getMeta()
      setCapabilities(prev => ({
        ...prev,
        configMeta: { available: true, probed: true, data: configResponse }
      }))
    } catch (error: any) {
      console.info('Config meta endpoint unavailable:', error.response?.status)
      setCapabilities(prev => ({
        ...prev,
        configMeta: { available: false, probed: true, error: 'Endpoint unavailable' }
      }))
    }

    // Skip actuator probes in dev - tiles should stay disabled
    // These endpoints are not available in dev environment per requirements
    setCapabilities(prev => ({
      ...prev,
      actuatorHealth: { available: false, probed: true, error: 'Disabled in dev' },
      actuatorInfo: { available: false, probed: true, error: 'Disabled in dev' }
    }))
  }

  const handleRefreshTile = async (tileType: 'configMeta' | 'actuatorHealth' | 'actuatorInfo') => {
    // Individual tile refresh
    switch (tileType) {
      case 'configMeta':
        if (capabilities.configMeta.available) {
          try {
            const configResponse = await configApi.getMeta()
            setCapabilities(prev => ({
              ...prev,
              configMeta: { ...prev.configMeta, data: configResponse }
            }))
          } catch (error) {
            console.error('Failed to refresh config meta:', error)
          }
        }
        break
      case 'actuatorHealth':
        // Skip refresh for disabled actuator endpoints in dev
        console.info('Actuator health tile is disabled in dev environment')
        break
      case 'actuatorInfo':
        // Skip refresh for disabled actuator endpoints in dev
        console.info('Actuator info tile is disabled in dev environment')
        break
    }
  }

  const handleExecuteTile = async (tileType: string) => {
    // Execute tile action (for demo, we'll just refresh)
    console.info(`Executing ${tileType} action`)
    if (tileType.startsWith('actuator') || tileType === 'configMeta') {
      await handleRefreshTile(tileType as any)
    }
  }

  const getAdminTiles = (): AdminTile[] => [
    {
      title: 'User Management',
      description: 'Manage system users, roles, and approvals',
      href: '/admin/users',
      status: 'info',
      value: counts.loading ? 'Loading...' : `${counts.users}+ users`
    },
    {
      title: 'Course Management',
      description: 'Manage courses and content',
      href: '/admin/course-management',
      status: 'info',
      value: counts.loading ? 'Loading...' : `${counts.courses}+ courses`
    },
    {
      title: 'Grade Management',
      description: 'Administrative oversight of grades and assessments',
      href: '/admin/grade-management',
      status: 'info',
      value: counts.loading ? 'Loading...' : `${counts.grades}+ grades`
    },
    {
      title: 'Enrollment Management',
      description: 'Manage student enrollments and course participation',
      href: '/admin/enrollments',
      status: 'info',
      value: counts.loading ? 'Loading...' : `${counts.enrollments}+ enrollments`
    },
    {
      title: 'Configuration',
      description: 'System health monitoring and configuration',
      href: '/admin/config',
      status: 'info'
    },
    {
      title: 'System Health',
      description: 'Overall system health status',
      status: !capabilities.actuatorHealth.probed ? 'loading' : 
             capabilities.actuatorHealth.available ? 
               (capabilities.actuatorHealth.data?.status === 'UP' ? 'success' : 'error') : 
               'disabled',
      value: capabilities.actuatorHealth.available ? 
             (capabilities.actuatorHealth.data?.status || 'Available') : 
             'Disabled',
      disabled: !capabilities.actuatorHealth.available,
      tooltip: !capabilities.actuatorHealth.available ? 'Endpoint unavailable' : undefined,
      action: () => handleRefreshTile('actuatorHealth')
    }
  ]

  const tiles = getAdminTiles()

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={() => {
            probeCapabilities()
            loadCounts()
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh All
        </button>
      </div>
      
      {/* System Status Summary */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between">
            <span>Health Status:</span>
            <span className={`font-medium ${
              capabilities.actuatorHealth.available ? 
                (capabilities.actuatorHealth.data?.status === 'UP' ? 'text-green-600' : 'text-red-600') : 
                'text-gray-400'
            }`}>
              {capabilities.actuatorHealth.available ? 
                (capabilities.actuatorHealth.data?.status || 'Available') : 
                'Disabled'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Config Meta:</span>
            <span className={`font-medium ${
              capabilities.configMeta.available ? 'text-green-600' : 'text-gray-400'
            }`}>
              {capabilities.configMeta.available ? 'Available' : 'Disabled'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>System Info:</span>
            <span className={`font-medium ${
              capabilities.actuatorInfo.available ? 'text-green-600' : 'text-gray-400'
            }`}>
              {capabilities.actuatorInfo.available ? 'Available' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiles.map((tile, index) => (
          <div 
            key={index} 
            className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow relative ${
              tile.disabled ? 'opacity-60' : ''
            }`}
            title={tile.tooltip}
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-semibold">{tile.title}</h2>
              {tile.status && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  tile.status === 'success' ? 'bg-green-100 text-green-800' :
                  tile.status === 'error' ? 'bg-red-100 text-red-800' :
                  tile.status === 'info' ? 'bg-blue-100 text-blue-800' :
                  tile.status === 'disabled' ? 'bg-gray-100 text-gray-500' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {tile.status === 'disabled' ? 'disabled' : tile.status}
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-4">{tile.description}</p>
            {tile.value && (
              <p className={`text-sm font-medium mb-4 ${
                tile.disabled ? 'text-gray-400' : 'text-blue-600'
              }`}>
                {tile.value}
              </p>
            )}
            
            <div className="flex space-x-2">
              {tile.href ? (
                <Link
                  to={tile.href}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  Manage →
                </Link>
              ) : tile.action ? (
                <>
                  <button
                    onClick={tile.action}
                    disabled={tile.disabled}
                    className={`inline-flex items-center font-medium ${
                      tile.disabled 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-blue-600 hover:text-blue-800'
                    }`}
                  >
                    Refresh
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => handleExecuteTile(tile.title.toLowerCase().replace(/\s+/g, ''))}
                    disabled={tile.disabled}
                    className={`inline-flex items-center font-medium ${
                      tile.disabled 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-green-600 hover:text-green-800'
                    }`}
                  >
                    Execute
                  </button>
                </>
              ) : null}
            </div>
            
            {tile.tooltip && tile.disabled && (
              <div className="absolute top-2 right-2">
                <div className="group">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="invisible group-hover:visible absolute top-6 right-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                    {tile.tooltip}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminDashboard
