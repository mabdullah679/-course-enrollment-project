import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { configApi, actuatorApi } from '../services/api'

interface AdminTile {
  title: string
  description: string
  href?: string
  action?: () => void
  status?: 'loading' | 'success' | 'error' | 'info'
  value?: string
}

const AdminDashboard: React.FC = () => {
  const [configMeta, setConfigMeta] = useState<any>(null)
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [infoStatus, setInfoStatus] = useState<any>(null)

  useEffect(() => {
    loadSystemData()
  }, [])

  const loadSystemData = async () => {
    try {
      // Load config meta
      try {
        const configResponse = await configApi.getMeta()
        setConfigMeta(configResponse.data)
      } catch (error) {
        console.error('Failed to load config meta:', error)
      }

      // Load health status
      try {
        const healthResponse = await actuatorApi.getHealth()
        setHealthStatus(healthResponse)
      } catch (error) {
        console.error('Failed to load health status:', error)
      }

      // Load system info
      try {
        const infoResponse = await actuatorApi.getInfo()
        setInfoStatus(infoResponse)
      } catch (error) {
        console.error('Failed to load system info:', error)
      }
    } catch (error) {
      console.error('Error loading admin dashboard data:', error)
    }
  }

  const handleRefresh = async () => {
    await loadSystemData()
  }

  const getAdminTiles = (): AdminTile[] => [
    {
      title: 'System Health',
      description: 'Overall system health status',
      status: healthStatus ? (healthStatus.status === 'UP' ? 'success' : 'error') : 'loading',
      value: healthStatus?.status || 'Loading...',
      action: handleRefresh
    },
    {
      title: 'System Info',
      description: 'Application information',
      status: infoStatus ? 'info' : 'loading',
      value: infoStatus ? 'Available' : 'Loading...',
      action: handleRefresh
    },
    {
      title: 'Config Meta',
      description: 'System configuration metadata',
      status: configMeta ? 'success' : 'loading',
      value: configMeta ? 'Loaded' : 'Loading...',
      action: handleRefresh
    },
    {
      title: 'User Management',
      description: 'Manage system users',
      href: '/admin/users'
    },
    {
      title: 'Course Management',
      description: 'Manage courses and content',
      href: '/admin/courses'
    },
    {
      title: 'Quick Actions',
      description: 'Common administrative tasks',
      action: handleRefresh
    }
  ]

  const tiles = getAdminTiles()

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh
        </button>
      </div>
      
      {/* System Status Summary */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between">
            <span>Health Status:</span>
            <span className={`font-medium ${
              healthStatus?.status === 'UP' ? 'text-green-600' : 
              healthStatus?.status ? 'text-red-600' : 'text-gray-500'
            }`}>
              {healthStatus?.status || 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Config Meta:</span>
            <span className={`font-medium ${configMeta ? 'text-green-600' : 'text-gray-500'}`}>
              {configMeta ? 'Available' : 'Loading...'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>System Info:</span>
            <span className={`font-medium ${infoStatus ? 'text-green-600' : 'text-gray-500'}`}>
              {infoStatus ? 'Available' : 'Loading...'}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiles.map((tile, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-semibold">{tile.title}</h2>
              {tile.status && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  tile.status === 'success' ? 'bg-green-100 text-green-800' :
                  tile.status === 'error' ? 'bg-red-100 text-red-800' :
                  tile.status === 'info' ? 'bg-blue-100 text-blue-800' :
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
                Manage →
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

export default AdminDashboard
