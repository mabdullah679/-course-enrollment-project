import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { UserRole } from '../types/api'
import { authApi } from '../services/api'
import { toast } from 'react-hot-toast'

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false)
  
  // Change Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // Update Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  })
  
  // Store original values to detect changes
  const [originalProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  })
  
  // Field errors for inline display
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  // Suppress unused variable warning - errors are set for future UI enhancement
  void fieldErrors

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshUser()
    } catch (error) {
      console.error('Failed to refresh profile:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous field errors
    setFieldErrors({})
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' })
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      setFieldErrors({ newPassword: 'Password must be at least 6 characters long' })
      return
    }
    
    try {
      const response = await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      
      // Check for 204 success status (no content) or success flag
      if (response.success) {
        toast.success('Password changed successfully')
        setShowChangePasswordModal(false)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setFieldErrors({})
      }
    } catch (error: any) {
      console.error('Error changing password:', error)
      
      if (error.response?.status === 403) {
        setFieldErrors({ currentPassword: 'Current password is incorrect' })
      } else if (error.response?.status === 400 && error.response?.data?.details) {
        // Handle field-level errors from backend
        const errors = error.response.data.details.reduce((acc: any, detail: any) => {
          acc[detail.field] = detail.reason
          return acc
        }, {})
        setFieldErrors(errors)
      } else {
        toast.error(error.response?.data?.message || 'Failed to change password')
      }
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous field errors
    setFieldErrors({})
    
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim() || !profileForm.email.trim()) {
      setFieldErrors({
        ...(profileForm.firstName.trim() ? {} : { firstName: 'First name is required' }),
        ...(profileForm.lastName.trim() ? {} : { lastName: 'Last name is required' }),
        ...(profileForm.email.trim() ? {} : { email: 'Email is required' })
      })
      return
    }
    
    try {
      // JSON Merge Patch semantics: only send changed fields
      const changedFields: any = {}
      
      if (profileForm.firstName !== originalProfile.firstName) {
        changedFields.firstName = profileForm.firstName
      }
      if (profileForm.lastName !== originalProfile.lastName) {
        changedFields.lastName = profileForm.lastName
      }
      if (profileForm.email !== originalProfile.email) {
        changedFields.email = profileForm.email
      }
      
      // Only make request if there are changes
      if (Object.keys(changedFields).length === 0) {
        toast.success('No changes to save')
        setShowUpdateProfileModal(false)
        return
      }
      
      const response = await authApi.updateProfile(changedFields)
      
      if (response.success) {
        toast.success('Profile updated successfully')
        await refreshUser() // Refresh to get updated user data
        setShowUpdateProfileModal(false)
        setFieldErrors({})
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      
      if (error.response?.status === 400 && error.response?.data?.details) {
        // Handle field-level errors from backend
        const errors = error.response.data.details.reduce((acc: any, detail: any) => {
          acc[detail.field] = detail.reason
          return acc
        }, {})
        setFieldErrors(errors)
      } else {
        toast.error(error.response?.data?.message || 'Failed to update profile')
      }
    }
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Please log in to view your profile.</p>
      </div>
    )
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

  const getUsersFilterRoute = () => {
    // Admin and staff can access filtered users page
    if (user.role === UserRole.ADMIN) {
      return `/admin/users?role=${user.role}`
    } else if (user.role === UserRole.STAFF) {
      return `/staff/users?role=${user.role}`
    }
    return null
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Your account information and preferences
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {refreshing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
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
          
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <p className="mt-1 text-sm text-gray-900">{user.username}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Status</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <div className="mt-1">
                      {getUsersFilterRoute() ? (
                        <Link
                          to={getUsersFilterRoute()!}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 ${getRoleColor(user.role)}`}
                        >
                          {user.role}
                        </Link>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.approved && user.active ? 'bg-green-100 text-green-800' :
                      user.approved && !user.active ? 'bg-yellow-100 text-yellow-800' :
                      !user.approved ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.approved && user.active ? 'APPROVED & ACTIVE' :
                       user.approved && !user.active ? 'APPROVED & INACTIVE' :
                       !user.approved && user.active ? 'PENDING APPROVAL' :
                       'PENDING APPROVAL'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Active</label>
                    <p className={`mt-1 text-sm font-medium ${
                      user.active ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {user.active ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member Since</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Change Password
                </button>
                <button
                  onClick={() => setShowUpdateProfileModal(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
              <form onSubmit={handleChangePassword}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                    <input
                      type="password"
                      required
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        fieldErrors.currentPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    />
                    {fieldErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.currentPassword}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        fieldErrors.newPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    />
                    {fieldErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.newPassword}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        fieldErrors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                    {fieldErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowChangePasswordModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Update Profile Modal */}
      {showUpdateProfileModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Profile</h3>
              <form onSubmit={handleUpdateProfile}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowUpdateProfileModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Update Profile
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

export default Profile