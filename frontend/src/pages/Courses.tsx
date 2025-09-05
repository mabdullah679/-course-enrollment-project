import React, { useState, useEffect } from 'react'
import { coursesApi, enrollmentsApi, configApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Course, UserRole } from '../types/api'
import { toastGroups } from '../lib/toast'

const Courses: React.FC = () => {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [enrollmentWindow, setEnrollmentWindow] = useState<'OPEN' | 'CLOSED'>('CLOSED')
  const [enrolling, setEnrolling] = useState<number | null>(null)

  useEffect(() => {
    fetchCourses()
    checkEnrollmentWindow()
  }, [])

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const response = user?.role === UserRole.STUDENT 
        ? await coursesApi.getActiveCourses()  // Only active courses for students
        : await coursesApi.getAllCourses(0, 50)  // All courses for others
      
      if (response.success && response.data) {
        const courseData = Array.isArray(response.data) ? response.data : response.data.content || []
        setCourses(courseData)
      }
    } catch (error: any) {
      console.error('Error fetching courses:', error)
      toastGroups.api.error('Failed to fetch courses')
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

  const handleEnrollInCourse = async (courseId: number) => {
    if (enrollmentWindow === 'CLOSED') {
      toastGroups.system.warning('Enrollment window is closed')
      return
    }

    setEnrolling(courseId)
    try {
      const response = await enrollmentsApi.enrollInCourse(courseId)
      
      if (response.success) {
        toastGroups.form.success('Successfully enrolled in course')
        // Optionally refresh the courses list to update enrollment status
        fetchCourses()
      }
    } catch (error: any) {
      console.error('Error enrolling in course:', error)
      toastGroups.api.error(error.response?.data?.message || 'Failed to enroll in course')
    } finally {
      setEnrolling(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'ARCHIVED':
        return 'bg-yellow-100 text-yellow-800'
      case 'CLOSED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPageTitle = () => {
    switch (user?.role) {
      case UserRole.STUDENT:
        return 'Available Courses'
      case UserRole.INSTRUCTOR:
        return 'All Courses'
      case UserRole.ADMIN:
      case UserRole.STAFF:
        return 'Course Catalog'
      default:
        return 'Courses'
    }
  }

  const getPageDescription = () => {
    switch (user?.role) {
      case UserRole.STUDENT:
        return 'Browse and enroll in available courses.'
      case UserRole.INSTRUCTOR:
        return 'View all courses in the system.'
      case UserRole.ADMIN:
      case UserRole.STAFF:
        return 'Complete course catalog and management overview.'
      default:
        return 'Course information and enrollment.'
    }
  }

  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
          <p className="mt-2 text-sm text-gray-700">{getPageDescription()}</p>
          {user?.role === UserRole.STUDENT && (
            <div className="mt-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                enrollmentWindow === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                Enrollment Window: {enrollmentWindow}
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={fetchCourses}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  {course.name}
                </h2>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                  {course.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {course.code} • {course.credits} credits
              </div>
              {course.description && (
                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                  {course.description}
                </p>
              )}
              <div className="text-xs text-gray-500 mb-4">
                Created: {new Date(course.createdAt).toLocaleDateString()}
              </div>
              
              {user?.role === UserRole.STUDENT && course.status === 'ACTIVE' && (
                <div className="mt-4">
                  {enrollmentWindow === 'OPEN' ? (
                    <button
                      onClick={() => handleEnrollInCourse(course.id)}
                      disabled={enrolling === course.id}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {enrolling === course.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Enrolling...
                        </>
                      ) : (
                        'Enroll'
                      )}
                    </button>
                  ) : (
                    <div className="w-full text-center py-2 text-sm text-gray-500 bg-gray-100 rounded-md">
                      Enrollment Closed
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!loading && courses.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No courses available</h3>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === UserRole.STUDENT 
              ? 'There are no active courses available for enrollment at this time.'
              : 'No courses have been created in the system yet.'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default Courses
