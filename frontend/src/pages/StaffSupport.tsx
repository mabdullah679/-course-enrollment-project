import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toastGroups } from '../lib/toast'
import { usersApi, exportsApi, configApi, actuatorApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { UserRole, User, PaginatedResponse } from '../types/api'

interface HealthStatus {
  status: string
  available: boolean
  error?: string
}

const StaffSupport: React.FC = () => {
  const { user } = useAuth()
  const [pendingApprovals, setPendingApprovals] = useState<User[]>([])
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({ status: 'Unknown', available: false })
  const [configStatus, setConfigStatus] = useState<{ available: boolean; error?: string }>({ available: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSupportData()
  }, [])

  const loadSupportData = async () => {
    setLoading(true)
    
    // Load pending approvals
    await loadPendingApprovals()
    
    // Check health status
    await checkHealthStatus()
    
    // Check config availability
    await checkConfigAvailability()
    
    setLoading(false)
  }

  const loadPendingApprovals = async () => {
    try {
      const response = await usersApi.getUsers(
        undefined, // lastId
        20,        // limit
        undefined, // search
        undefined, // role
        false,     // approved - only unapproved
        undefined  // active
      )
      
      if (response.success && response.data) {
        const paginatedData = response.data as PaginatedResponse<User>
        setPendingApprovals(paginatedData.content)
      }
    } catch (error: any) {
      console.error('Error loading pending approvals:', error)
      toastGroups.api.error('Failed to load pending approvals')
    }
  }

  const checkHealthStatus = async () => {
    try {
      const response = await actuatorApi.getHealth()
      setHealthStatus({
        status: response.status || 'UP',
        available: true
      })
    } catch (error: any) {
      console.info('Health endpoint unavailable:', error.response?.status)
      setHealthStatus({
        status: 'Unavailable',
        available: false,
        error: 'Endpoint not available'
      })
    }
  }

  const checkConfigAvailability = async () => {
    try {
      await configApi.getMeta()
      setConfigStatus({ available: true })
    } catch (error: any) {
      console.info('Config meta endpoint unavailable:', error.response?.status)
      setConfigStatus({
        available: false,
        error: 'Endpoint not available'
      })
    }
  }

  const handleApproveUser = async (userId: number) => {
    try {
      const response = await usersApi.approveUser(userId)
      
      if (response.success) {
        toastGroups.form.success('User approved successfully')
        setPendingApprovals(prev => prev.filter(user => user.id !== userId))
      }
    } catch (error: any) {
      console.error('Error approving user:', error)
      toastGroups.api.error(error.response?.data?.message || 'Failed to approve user')
    }
  }

  const handleExportData = async (type: string) => {
    try {
      let blob: Blob
      let filename: string

      switch (type) {
        case 'users':
          blob = await exportsApi.exportUsers()
          filename = `users-export-${new Date().toISOString().split('T')[0]}.csv`
          break
        case 'courses':
          blob = await exportsApi.exportCourses()
          filename = `courses-export-${new Date().toISOString().split('T')[0]}.csv`
          break
        case 'enrollments':
          blob = await exportsApi.exportEnrollments()
          filename = `enrollments-export-${new Date().toISOString().split('T')[0]}.csv`
          break
        case 'grades':
          blob = await exportsApi.exportGrades()
          filename = `grades-export-${new Date().toISOString().split('T')[0]}.csv`
          break
        default:
          throw new Error('Unknown export type')
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toastGroups.form.success(`${type} exported successfully`)
    } catch (error: any) {
      console.error(`Error exporting ${type}:`, error)
      if (error.response?.status === 403) {
        toastGroups.system.warning(`Export ${type}: Access denied. Staff may not have permission for this export.`)
      } else {
        toastGroups.api.error(`Failed to export ${type}`)
      }
    }
  }

  const handleRefreshSection = async (section: string) => {
    switch (section) {
      case 'approvals':
        await loadPendingApprovals()
        break
      case 'health':
        await checkHealthStatus()
        break
      case 'config':
        await checkConfigAvailability()
        break
      default:
        await loadSupportData()
    }
  }

  if (user?.role !== UserRole.STAFF) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">This page is only accessible to Staff members.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Staff Support Center</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage user approvals, data exports, configuration, and system health monitoring.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => handleRefreshSection('all')}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Refresh All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approvals Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">User Approvals</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleRefreshSection('approvals')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Refresh
                </button>
                <Link
                  to="/staff/users"
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Manage Users
                </Link>
              </div>
            </div>
          </div>
          <div className="px-6 py-4">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : pendingApprovals.length > 0 ? (
              <div className="space-y-3">
                {pendingApprovals.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email} • {user.role}
                      </div>
                    </div>
                    <button
                      onClick={() => handleApproveUser(user.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-white bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </button>
                  </div>
                ))}
                {pendingApprovals.length > 5 && (
                  <div className="text-center pt-2">
                    <Link
                      to="/staff/users?approved=false"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View all {pendingApprovals.length} pending approvals →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No pending approvals</p>
            )}
          </div>
        </div>

        {/* Data Exports Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Data Exports</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleExportData('users')}
                className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <svg className="w-6 h-6 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <span className="text-sm font-medium">Users</span>
              </button>
              <button
                onClick={() => handleExportData('courses')}
                className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <svg className="w-6 h-6 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm font-medium">Courses</span>
              </button>
              <button
                onClick={() => handleExportData('enrollments')}
                className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <svg className="w-6 h-6 text-purple-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm font-medium">Enrollments</span>
              </button>
              <button
                onClick={() => handleExportData('grades')}
                className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <svg className="w-6 h-6 text-orange-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm font-medium">Grades</span>
              </button>
            </div>
          </div>
        </div>

        {/* System Health Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">System Health</h2>
              <button
                onClick={() => handleRefreshSection('health')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Application Status</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                healthStatus.available 
                  ? (healthStatus.status === 'UP' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {healthStatus.available ? healthStatus.status : 'Disabled'}
              </span>
            </div>
            {!healthStatus.available && (
              <div className="mt-2 text-sm text-gray-500" title={healthStatus.error}>
                Health monitoring unavailable
              </div>
            )}
          </div>
        </div>

        {/* Configuration Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Configuration</h2>
              <button
                onClick={() => handleRefreshSection('config')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Config Metadata</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                configStatus.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
              }`}>
                {configStatus.available ? 'Available' : 'Disabled'}
              </span>
            </div>
            {!configStatus.available && (
              <div className="mt-2 text-sm text-gray-500" title={configStatus.error}>
                Configuration endpoint unavailable
              </div>
            )}
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Staff role has limited access to configuration management. 
                Contact an administrator for advanced configuration changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffSupport