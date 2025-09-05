import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { User, UserRole, UserStatus, PaginatedResponse } from '../types/api'
import { usersApi, exportsApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

interface AuditEntry {
  id: number
  field: string
  oldValue: string
  newValue: string
  changedBy: string
  changedAt: string
}

const AdminUsers: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [hasNext, setHasNext] = useState(false)
  const [lastId, setLastId] = useState<number | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    role: searchParams.get('role') || '',
    status: searchParams.get('status') || ''
  })
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState<number | null>(null)
  
  // Form states
  const [newRole, setNewRole] = useState<UserRole>(UserRole.STUDENT)
  const [newActiveStatus, setNewActiveStatus] = useState(true)
  const [auditHistory, setAuditHistory] = useState<AuditEntry[]>([])
  
  const { refreshUser } = useAuth()

  const fetchUsers = async (reset = false) => {
    setLoading(true)
    try {
      const currentAfter = reset ? undefined : lastId
      
      const response = await usersApi.getUsers(
        currentAfter,
        20,
        searchTerm || undefined,
        filters.role || undefined,
        filters.status || undefined
      )
      
      if (response.success && response.data) {
        const paginatedData = response.data as PaginatedResponse<User>
        if (reset) {
          setUsers(paginatedData.content)
        } else {
          setUsers(prev => [...prev, ...paginatedData.content])
        }
        setHasNext(paginatedData.hasNext)
        setLastId(paginatedData.nextCursor)
      }
    } catch (error: any) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(true)
  }, [searchTerm, filters])

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowActionsMenu(null)
    }
    
    if (showActionsMenu !== null) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showActionsMenu])

  const handleApproveUser = async (userId: number) => {
    try {
      const response = await usersApi.approveUser(userId)
      
      if (response.success) {
        toast.success('User approved successfully')
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, status: UserStatus.APPROVED, approved: true }
            : user
        ))
      }
    } catch (error: any) {
      console.error('Error approving user:', error)
      toast.error(error.response?.data?.message || 'Failed to approve user')
    }
  }

  const handleChangeRole = async () => {
    if (!selectedUser) return

    try {
      const response = await usersApi.changeUserRole(selectedUser.id, [newRole])
      
      if (response.success) {
        toast.success('User role updated successfully')
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id 
            ? { ...user, role: newRole }
            : user
        ))
        setShowRoleModal(false)
        setSelectedUser(null)
        
        if (response.data?.sessionRotated) {
          await refreshUser()
        }
      }
    } catch (error: any) {
      console.error('Error changing user role:', error)
      toast.error(error.response?.data?.message || 'Failed to change user role')
    }
  }

  const handleChangeStatus = async () => {
    if (!selectedUser) return

    try {
      const response = await usersApi.changeUserStatus(selectedUser.id, newActiveStatus)
      
      if (response.success) {
        toast.success('User status updated successfully')
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id 
            ? { ...user, active: newActiveStatus }
            : user
        ))
        setShowStatusModal(false)
        setSelectedUser(null)
      }
    } catch (error: any) {
      console.error('Error changing user status:', error)
      toast.error(error.response?.data?.message || 'Failed to change user status')
    }
  }

  const handleViewAuditHistory = async (user: User) => {
    setSelectedUser(user)
    try {
      const response = await usersApi.getUserAuditHistory(user.id)
      if (response.success && response.data) {
        setAuditHistory(response.data)
      }
      setShowAuditModal(true)
    } catch (error: any) {
      console.error('Error fetching audit history:', error)
      toast.error('Failed to load audit history')
    }
  }

  const handleViewProfile = async (user: User) => {
    setSelectedUser(user)
    setShowProfileModal(true)
  }

  const handleRoleClick = (user: User) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setShowRoleModal(true)
  }

  const handleStatusClick = (user: User) => {
    setSelectedUser(user)
    setNewActiveStatus(user.active)
    setShowStatusModal(true)
  }

  const handleRoleBadgeClick = (role: UserRole) => {
    // Navigate to users page filtered by role
    navigate(`/admin/users?role=${role}`)
  }

  const handleExportUsers = async () => {
    try {
      // Prepare filters for export that match current view
      const exportFilters: any = {}
      if (filters.role) exportFilters.role = filters.role
      if (filters.status) exportFilters.status = filters.status
      if (searchTerm) exportFilters.q = searchTerm
      
      const blob = await exportsApi.exportUsers(exportFilters)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Users exported successfully')
    } catch (error: any) {
      console.error('Error exporting users:', error)
      toast.error('Failed to export users')
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    setLastId(undefined)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setLastId(undefined)
  }

  const loadMore = () => {
    if (hasNext && !loading) {
      fetchUsers(false)
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800'
      case UserRole.INSTRUCTOR:
        return 'bg-blue-100 text-blue-800'
      case UserRole.STAFF:
        return 'bg-green-100 text-green-800'
      case UserRole.STUDENT:
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (user: User) => {
    if (user.approved && user.active) {
      return 'bg-green-100 text-green-800'
    } else if (user.approved && !user.active) {
      return 'bg-yellow-100 text-yellow-800'
    } else {
      return 'bg-red-100 text-red-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage users, their roles, and approval status. Export data for reporting.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={handleExportUsers}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <form onSubmit={handleSearch}>
              <label className="block text-sm font-medium text-gray-700">Search Users</label>
              <div className="mt-1 flex">
                <input
                  type="text"
                  className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Search by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm text-gray-500 hover:bg-gray-100"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="INSTRUCTOR">Instructor</option>
              <option value="STAFF">Staff</option>
              <option value="STUDENT">Student</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-xs text-gray-400">@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleRoleClick(user)}
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 ${getRoleColor(user.role)}`}
                  >
                    {user.role}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleStatusClick(user)}
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 ${getStatusColor(user)}`}
                  >
                    {user.approved ? 'Approved' : 'Pending'} • {user.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleViewAuditHistory(user)}
                      className="text-blue-500 hover:text-blue-700"
                      title="View audit history"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative">
                    <button
                      onClick={() => setShowActionsMenu(showActionsMenu === user.id ? null : user.id)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    
                    {showActionsMenu === user.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              handleRoleClick(user)
                              setShowActionsMenu(null)
                            }}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            Change Role
                          </button>
                          <button
                            onClick={() => {
                              handleStatusClick(user)
                              setShowActionsMenu(null)
                            }}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            Change Status
                          </button>
                          <button
                            onClick={() => {
                              handleViewProfile(user)
                              setShowActionsMenu(null)
                            }}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            View Profile
                          </button>
                          {!user.approved && (
                            <button
                              onClick={() => {
                                handleApproveUser(user.id)
                                setShowActionsMenu(null)
                              }}
                              className="block px-4 py-2 text-sm text-green-600 hover:bg-gray-100 w-full text-left"
                            >
                              Approve User
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No users found</p>
          </div>
        )}

        {hasNext && !loading && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={loadMore}
              className="w-full bg-gray-50 hover:bg-gray-100 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Change Role for {selectedUser.firstName} {selectedUser.lastName}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Role
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                >
                  <option value={UserRole.STUDENT}>Student</option>
                  <option value={UserRole.INSTRUCTOR}>Instructor</option>
                  <option value={UserRole.STAFF}>Staff</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleChangeRole}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Change Role
                </button>
                <button
                  onClick={() => {
                    setShowRoleModal(false)
                    setSelectedUser(null)
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Change Status for {selectedUser.firstName} {selectedUser.lastName}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active Status
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={newActiveStatus.toString()}
                  onChange={(e) => setNewActiveStatus(e.target.value === 'true')}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleChangeStatus}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Change Status
                </button>
                <button
                  onClick={() => {
                    setShowStatusModal(false)
                    setSelectedUser(null)
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit History Modal */}
      {showAuditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Audit History for {selectedUser.firstName} {selectedUser.lastName}
              </h3>
              <div className="max-h-96 overflow-y-auto">
                {auditHistory.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Field
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Old Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          New Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Changed By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auditHistory.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {entry.field}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.oldValue}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.newValue}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.changedBy}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(entry.changedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-center py-4">No audit history available</p>
                )}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    setShowAuditModal(false)
                    setSelectedUser(null)
                    setAuditHistory([])
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                User Profile: {selectedUser.firstName} {selectedUser.lastName}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.firstName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.lastName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <button
                      onClick={() => handleRoleBadgeClick(selectedUser.role)}
                      className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 ${getRoleColor(selectedUser.role)}`}
                    >
                      {selectedUser.role}
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedUser)}`}>
                      {selectedUser.approved ? 'Approved' : 'Pending'} • {selectedUser.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.id}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowProfileModal(false)
                    setSelectedUser(null)
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
