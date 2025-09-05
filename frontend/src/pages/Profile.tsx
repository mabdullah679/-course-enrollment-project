import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { UserRole } from '../types/api'

const Profile: React.FC = () => {
  const { user } = useAuth()

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
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="mt-1 text-sm text-gray-600">
              Your account information and preferences
            </p>
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
                    <label className="block text-sm font-medium text-gray-700">Approval Status</label>
                    <p className={`mt-1 text-sm font-medium ${
                      user.approved ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {user.approved ? 'Approved' : 'Pending Approval'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Status</label>
                    <p className={`mt-1 text-sm font-medium ${
                      user.active ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {user.active ? 'Active' : 'Inactive'}
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled
                >
                  Change Password (Coming Soon)
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled
                >
                  Update Profile (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile