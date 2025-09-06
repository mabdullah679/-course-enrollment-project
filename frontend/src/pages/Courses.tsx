import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Course } from '../types/api'
import { coursesApi, enrollmentsApi } from '../services/api'
import { useDebounce } from '../hooks/useDebounce'
import RefreshButton from '../components/common/RefreshButton'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [hasNext, setHasNext] = useState(false)
  const [lastId, setLastId] = useState<number | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 400)
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false)

  useEffect(() => {
    fetchCourses(true)
  }, [debouncedSearchTerm, showEnrolledOnly])

  const fetchCourses = async (reset = false) => {
    setLoading(true)
    try {
      const currentAfter = reset ? undefined : lastId
      let response
      
      if (showEnrolledOnly) {
        response = await coursesApi.getStudentCourses(true)
      } else {
        response = await coursesApi.getCourses(currentAfter, 20)
      }
      
      if (response.success && response.data) {
        // Handle direct array response from backend
        let courseData = response.data as Course[]
        
        // Filter by search term if provided
        if (debouncedSearchTerm) {
          courseData = courseData.filter(course => 
            course.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            course.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            course.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          )
        }
        
        if (reset) {
          setCourses(courseData)
        } else {
          setCourses(prev => [...prev, ...courseData])
        }
        // For now, backend returns all courses at once, so no pagination
        setHasNext(false)
        setLastId(undefined)
      }
    } catch (error: any) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId: number) => {
    try {
      const response = await enrollmentsApi.enrollInCourse(courseId)
      if (response.success) {
        toast.success('Enrollment request submitted successfully')
        // Don't refresh immediately as enrollment might be pending approval
      }
    } catch (error: any) {
      console.error('Error enrolling in course:', error)
      toast.error(error.response?.data?.message || 'Failed to enroll in course')
    }
  }

  const handleRefresh = () => {
    fetchCourses(true)
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

  if (loading && courses.length === 0) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" text="Loading courses..." className="py-12" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">My Courses</h1>
          <p className="mt-2 text-sm text-gray-700">
            Browse and enroll in available courses.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <RefreshButton onClick={handleRefresh} />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search Courses</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Search by name, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                checked={showEnrolledOnly}
                onChange={(e) => setShowEnrolledOnly(e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-700">Enrolled courses only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                  {course.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{course.code}</p>
              <p className="text-sm text-gray-700 mb-4">
                {course.description || 'No description available'}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{course.credits} credits</span>
                {course.status === 'ACTIVE' && !showEnrolledOnly && (
                  <button
                    onClick={() => handleEnroll(course.id)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Enroll
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && !loading && (
        <EmptyState
          title={showEnrolledOnly ? 'No enrolled courses' : 'No courses found'}
          description={showEnrolledOnly ? 'You are not enrolled in any courses yet.' : 'No courses match your search criteria.'}
          icon={
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
      )}

      {/* Load More */}
      {hasNext && !showEnrolledOnly && (
        <div className="mt-6 text-center">
          <button
            onClick={() => fetchCourses(false)}
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

export default Courses
