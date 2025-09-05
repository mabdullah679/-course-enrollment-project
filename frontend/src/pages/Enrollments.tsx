import React, { useState, useEffect } from 'react'
import { toast as hotToast } from 'react-hot-toast'
import { enrollmentsApi, configApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Enrollment, PaginatedResponse } from '../types/api'

const Enrollments: React.FC = () => {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [enrollmentWindow, setEnrollmentWindow] = useState<'OPEN' | 'CLOSED'>('CLOSED')
  const [hasNext, setHasNext] = useState(false)
  const [lastId, setLastId] = useState<number | undefined>(undefined)

  useEffect(() => {
    fetchEnrollments()
    checkEnrollmentWindow()
  }, [])

  const fetchEnrollments = async (reset = false) => {
    setLoading(true)
    try {
      const currentAfter = reset ? undefined : lastId
      const studentId = user?.id // Filter by current user if student
      
      const response = await enrollmentsApi.getEnrollments(
        currentAfter,
        20,
        undefined, // type
        undefined, // semester 
        undefined, // courseId
        studentId  // studentId
      )
      
      if (response.success && response.data) {
        const paginatedData = response.data as PaginatedResponse<Enrollment>
        if (reset) {
          setEnrollments(paginatedData.content)
        } else {
          setEnrollments(prev => [...prev, ...paginatedData.content])
        }
        setHasNext(paginatedData.hasNext)
        setLastId(paginatedData.nextCursor)
      }
    } catch (error: any) {
      console.error('Error fetching enrollments:', error)
      hotToast.error('Failed to fetch enrollments')
    } finally {
      setLoading(false)
    }
  }

  const checkEnrollmentWindow = async () => {
    try {
      const response = await configApi.getMeta()
      if (response.success && response.data) {
        setEnrollmentWindow(response.data.enrollmentWindow || 'CLOSED')
      }
    } catch (error) {
      console.info('Enrollment window status unavailable, defaulting to CLOSED')
    }
  }

  const handleEnrollmentAction = (action: string) => {
    if (enrollmentWindow === 'CLOSED') {
      hotToast.error('Enrollment window is closed')
      return
    }
    
    // Handle enrollment action
    hotToast(`${action} functionality would be implemented here`, { icon: 'ℹ️' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'DROPPED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const loadMore = () => {
    if (hasNext && !loading) {
      fetchEnrollments(false)
    }
  }

  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">My Enrollments</h1>
          <p className="mt-2 text-sm text-gray-700">
            View your course enrollments and registration status.
          </p>
          <div className="mt-2">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              enrollmentWindow === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              Enrollment Window: {enrollmentWindow}
            </span>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => fetchEnrollments(true)}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Enrollments List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {enrollment.course.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {enrollment.course.code} • {enrollment.course.credits} credits
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
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
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {enrollmentWindow === 'OPEN' ? (
                    <button
                      onClick={() => handleEnrollmentAction('Modify')}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Modify
                    </button>
                  ) : (
                    <span className="text-gray-400">View Only</span>
                  )}
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

        {!loading && enrollments.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No enrollments yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't enrolled in any courses yet. Visit the Courses page to browse available courses.
            </p>
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
    </div>
  )
}

export default Enrollments
