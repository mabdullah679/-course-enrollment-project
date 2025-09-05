import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Enrollment, PaginatedResponse } from '../types/api'
import { enrollmentsApi } from '../services/api'

const AdminEnrollments: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [hasNext, setHasNext] = useState(false)
  const [lastId, setLastId] = useState<number | undefined>(undefined)
  const [filters, setFilters] = useState({
    type: '',
    semester: '',
    courseId: '',
    studentId: '',
    upcomingOnly: false
  })

  useEffect(() => {
    fetchEnrollments(true)
  }, [filters])

  const fetchEnrollments = async (reset = false) => {
    setLoading(true)
    try {
      const currentAfter = reset ? undefined : lastId
      const response = await enrollmentsApi.getEnrollments(
        currentAfter,
        20,
        filters.type || undefined,
        filters.semester || undefined,
        filters.courseId ? parseInt(filters.courseId) : undefined,
        filters.studentId ? parseInt(filters.studentId) : undefined
      )
      
      if (response.success && response.data) {
        const paginatedData = response.data as PaginatedResponse<Enrollment>
        let enrollmentData = paginatedData.content
        
        // Apply upcoming filter client-side if needed
        if (filters.upcomingOnly) {
          const today = new Date()
          enrollmentData = enrollmentData.filter(enrollment => 
            new Date(enrollment.enrolledAt) >= today
          )
        }
        
        if (reset) {
          setEnrollments(enrollmentData)
        } else {
          setEnrollments(prev => [...prev, ...enrollmentData])
        }
        setHasNext(paginatedData.hasNext)
        setLastId(paginatedData.nextCursor)
      }
    } catch (error: any) {
      console.error('Error fetching enrollments:', error)
      toast.error('Failed to fetch enrollments')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    setLastId(undefined)
  }

  const handleRefresh = () => {
    fetchEnrollments(true)
  }

  const handleUpdateEnrollmentStatus = async (enrollmentId: number, newStatus: string) => {
    try {
      const response = await enrollmentsApi.updateEnrollmentStatus(enrollmentId, newStatus)
      if (response.success) {
        toast.success('Enrollment status updated successfully')
        setEnrollments(prev => prev.map(enrollment => 
          enrollment.id === enrollmentId 
            ? { ...enrollment, status: newStatus as any }
            : enrollment
        ))
      }
    } catch (error: any) {
      console.error('Error updating enrollment status:', error)
      toast.error(error.response?.data?.message || 'Failed to update enrollment status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800'
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800'
      case 'DROPPED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return 'bg-green-100 text-green-800'
      case 'AUDIT':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && enrollments.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Enrollment Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage student enrollments and course participation.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="DROPPED">Dropped</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Semester</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., Fall 2024"
              value={filters.semester}
              onChange={(e) => handleFilterChange('semester', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Course ID</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Course ID..."
              value={filters.courseId}
              onChange={(e) => handleFilterChange('courseId', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Student ID</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Student ID..."
              value={filters.studentId}
              onChange={(e) => handleFilterChange('studentId', e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                checked={filters.upcomingOnly}
                onChange={(e) => handleFilterChange('upcomingOnly', e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-700">Upcoming only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Enrollments List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enrolled
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {enrollment.student.firstName} {enrollment.student.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{enrollment.student.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {enrollment.course.name}
                  </div>
                  <div className="text-sm text-gray-500">{enrollment.course.code}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(enrollment.type)}`}>
                    {enrollment.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(enrollment.status)}`}>
                    {enrollment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(enrollment.enrolledAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {enrollment.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleUpdateEnrollmentStatus(enrollment.id, 'APPROVED')}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateEnrollmentStatus(enrollment.id, 'DROPPED')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {enrollment.status === 'APPROVED' && (
                    <button
                      onClick={() => handleUpdateEnrollmentStatus(enrollment.id, 'ACTIVE')}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Activate
                    </button>
                  )}
                  {enrollment.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleUpdateEnrollmentStatus(enrollment.id, 'COMPLETED')}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {enrollments.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No enrollments found.</p>
          </div>
        )}
      </div>

      {/* Load More */}
      {hasNext && (
        <div className="mt-6 text-center">
          <button
            onClick={() => fetchEnrollments(false)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminEnrollments