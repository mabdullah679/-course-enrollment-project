import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { coursesApi, exportsApi, courseAssignmentsApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { UserRole, Course, CourseCreateRequest } from '../types/api'
import { useDebounce } from '../hooks/useDebounce'
import { normalizePage } from '../utils/normalize'

interface AuditEntry {
  id: number
  field: string
  oldValue: string
  newValue: string
  changedBy: string
  changedAt: string
}

const AdminCourses: React.FC = () => {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [hasNext, setHasNext] = useState(false)
  const [lastId, setLastId] = useState<number | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 400)
  const [filters, setFilters] = useState({
    status: '',
    term: ''
  })
  
  // Request cancellation
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  
  // Form states
  const [newCourse, setNewCourse] = useState<CourseCreateRequest>({
    name: '',
    courseCode: '',
    credits: 3,
    status: 'ACTIVE',
    description: ''
  })
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'ARCHIVED' | 'CLOSED'>('ACTIVE')
  const [auditHistory, setAuditHistory] = useState<AuditEntry[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  // Course assignment request state (for instructors)
  const [selectedCoursesForAssignment, setSelectedCoursesForAssignment] = useState<number[]>([])
  const [showRequestAssignmentModal, setShowRequestAssignmentModal] = useState(false)

  useEffect(() => {
    fetchCourses(true)
    
    // Cleanup function to cancel requests on unmount
    return () => {
      if (abortController) {
        abortController.abort()
      }
    }
  }, [debouncedSearchTerm, filters])

  const fetchCourses = async (reset = false) => {
    // Cancel previous request
    if (abortController) {
      abortController.abort()
    }
    
    const newController = new AbortController()
    setAbortController(newController)
    
    setLoading(true)
    try {
      const currentAfter = reset ? undefined : lastId
      const response = await coursesApi.getCourses(
        currentAfter, 
        20,
        undefined, // ownerId
        filters.term || undefined,
        filters.status || undefined
      )
      
      // Check if request was cancelled
      if (newController.signal.aborted) {
        return
      }
      
      if (response.success && response.data) {
        // Use normalize function to handle multiple response formats
        const courseData = normalizePage<Course>(response.data)
        
        // Handle pagination info
        let hasMore = false
        let nextCursor: number | undefined
        
        if (response.data.items) {
          hasMore = response.data.page?.nextAfter !== undefined
          nextCursor = response.data.page?.nextAfter
        } else if (response.data.content) {
          hasMore = response.data.hasNext
          nextCursor = response.data.nextCursor
        }
        
        // Only apply client-side filtering for polish, not as substitute for server filtering
        let filteredData = courseData
        if (debouncedSearchTerm) {
          filteredData = courseData.filter(course => 
            course.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            course.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            course.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          )
        }
        
        if (reset) {
          setCourses(filteredData)
        } else {
          setCourses(prev => [...prev, ...filteredData])
        }
        setHasNext(hasMore)
        setLastId(nextCursor)
      }
    } catch (error: any) {
      // Don't show error if request was cancelled
      if (error.name !== 'AbortError' && !newController.signal.aborted) {
        console.error('Error fetching courses:', error)
        toast.error('Failed to fetch courses')
      }
    } finally {
      if (!newController.signal.aborted) {
        setLoading(false)
      }
    }
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setFieldErrors({})
    
    if (!newCourse.name.trim() || !newCourse.courseCode.trim() || !newCourse.credits) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const response = await coursesApi.createCourse(newCourse)
      
      if (response.success) {
        toast.success('Course created successfully')
        setShowCreateModal(false)
        setNewCourse({
          name: '',
          courseCode: '',
          credits: 3,
          status: 'ACTIVE',
          description: ''
        })
        setFieldErrors({})
        // Append to list instead of full refresh
        if (response.data) {
          setCourses(prev => [...prev, response.data])
        } else {
          await fetchCourses(true) // Fallback to refetch
        }
      }
    } catch (error: any) {
      console.error('Error creating course:', error)
      
      // Handle field-level validation errors (400 responses)
      if (error.response?.status === 400 && error.response?.data?.details) {
        const errors = error.response.data.details.reduce((acc: any, detail: any) => {
          acc[detail.field] = detail.reason
          return acc
        }, {})
        setFieldErrors(errors)
        return
      }
      
      // Check for 403 with Cookie present (CSRF issue)
      if (error.response?.status === 403) {
        toast.error('Permission denied: CSRF protection may be blocking this request')
        console.error('STOP: Protected POST returns 403 with Cookie present - check CSRF posture')
        return
      }
      
      toast.error(error.response?.data?.message || 'Failed to create course')
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    setLastId(undefined)
  }

  const handleExportCourses = async () => {
    try {
      const exportFilters: any = {}
      if (filters.status) exportFilters.status = filters.status
      if (filters.term) exportFilters.term = filters.term
      if (debouncedSearchTerm) exportFilters.q = debouncedSearchTerm
      
      const blob = await exportsApi.exportCourses(exportFilters)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `courses-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Courses exported successfully')
    } catch (error: any) {
      console.error('Error exporting courses:', error)
      toast.error('Failed to export courses')
    }
  }

  const handleStatusClick = (course: Course) => {
    setSelectedCourse(course)
    setNewStatus(course.status)
    setShowStatusModal(true)
  }

  const handleChangeStatus = async () => {
    if (!selectedCourse) return

    try {
      const response = await coursesApi.updateCourseStatus(selectedCourse.id, newStatus)
      
      if (response.success) {
        toast.success('Course status updated successfully')
        setCourses(prev => prev.map(course => 
          course.id === selectedCourse.id 
            ? { ...course, status: newStatus }
            : course
        ))
        setShowStatusModal(false)
        setSelectedCourse(null)
      }
    } catch (error: any) {
      console.error('Error changing course status:', error)
      toast.error(error.response?.data?.message || 'Failed to change course status')
    }
  }

  const handleViewAuditHistory = async (course: Course) => {
    setSelectedCourse(course)
    try {
      const response = await coursesApi.getCourseAuditHistory(course.id)
      if (response.success && response.data) {
        setAuditHistory(response.data)
      }
      setShowAuditModal(true)
    } catch (error: any) {
      console.error('Error fetching course audit history:', error)
      toast.error('Failed to load audit history')
    }
  }

  const handleRefresh = () => {
    fetchCourses(true)
  }

  const handleRequestCourseAssignment = async () => {
    if (!user || selectedCoursesForAssignment.length === 0) {
      toast.error('Please select at least one course')
      return
    }

    try {
      const response = await courseAssignmentsApi.requestCourseAssignment({
        instructorId: user.id,
        courseIds: selectedCoursesForAssignment,
        semesterId: 'current'
      })

      if (response.success) {
        toast.success('Course assignment request submitted successfully')
        setShowRequestAssignmentModal(false)
        setSelectedCoursesForAssignment([])
      }
    } catch (error: any) {
      console.error('Error requesting course assignment:', error)
      // API interceptor will handle error toast display
    }
  }

  const handleToggleCourseSelection = (courseId: number) => {
    setSelectedCoursesForAssignment(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
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

  if (loading) {
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
          <h1 className="text-xl font-semibold text-gray-900">Course Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage courses, their content, and enrollment settings.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExportCourses}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Export CSV
          </button>
          {user?.role === UserRole.ADMIN && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Course
            </button>
          )}
          {user?.role === UserRole.INSTRUCTOR && (
            <button
              type="button"
              onClick={() => setShowRequestAssignmentModal(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Request Assignment
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Term</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., Fall 2024"
              value={filters.term}
              onChange={(e) => handleFilterChange('term', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{course.name}</div>
                  <div className="text-sm text-gray-500">{course.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {course.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {course.credits}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleStatusClick(course)}
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 ${getStatusColor(course.status)}`}
                  >
                    {course.status}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleViewAuditHistory(course)}
                      className="text-blue-500 hover:text-blue-700"
                      title="View audit history"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleStatusClick(course)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit Status
                  </button>
                  <button
                    onClick={() => handleViewAuditHistory(course)}
                    className="text-green-600 hover:text-green-900"
                  >
                    View History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {courses.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No courses found.</p>
          </div>
        )}
      </div>

      {/* Load More */}
      {hasNext && (
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

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-2/3 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Course</h3>
              <form onSubmit={handleCreateCourse}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Course Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                        fieldErrors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      value={newCourse.name}
                      onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                      required
                    />
                    {fieldErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Course Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                        fieldErrors.courseCode || fieldErrors.code ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      value={newCourse.courseCode}
                      onChange={(e) => setNewCourse({ ...newCourse, courseCode: e.target.value })}
                      required
                    />
                    {(fieldErrors.courseCode || fieldErrors.code) && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.courseCode || fieldErrors.code}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Credits <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                        fieldErrors.credits ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      value={newCourse.credits}
                      onChange={(e) => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) || 0 })}
                      required
                    />
                    {fieldErrors.credits && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.credits}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                        fieldErrors.status ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      value={newCourse.status}
                      onChange={(e) => setNewCourse({ ...newCourse, status: e.target.value as 'ACTIVE' | 'ARCHIVED' | 'CLOSED' })}
                      required
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="ARCHIVED">Archived</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                    {fieldErrors.status && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.status}</p>
                    )}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                      fieldErrors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    rows={3}
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  />
                  {fieldErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
                  )}
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewCourse({
                        name: '',
                        courseCode: '',
                        credits: 3,
                        status: 'ACTIVE',
                        description: ''
                      })
                      setFieldErrors({})
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Create Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Status Change Modal */}
      {showStatusModal && selectedCourse && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Change Status for {selectedCourse.name}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as 'ACTIVE' | 'ARCHIVED' | 'CLOSED')}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                  <option value="CLOSED">Closed</option>
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
                    setSelectedCourse(null)
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
      {showAuditModal && selectedCourse && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Audit History for {selectedCourse.name}
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
                    setSelectedCourse(null)
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

      {/* Request Course Assignment Modal (for instructors) */}
      {showRequestAssignmentModal && user?.role === UserRole.INSTRUCTOR && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-2/3 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Request Course Assignment</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select the courses you would like to be assigned to teach:
              </p>
              
              <div className="max-h-96 overflow-y-auto mb-4">
                {courses.length > 0 ? (
                  <div className="space-y-2">
                    {courses.map((course) => (
                      <label key={course.id} className="flex items-center p-3 border rounded-md hover:bg-gray-50">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          checked={selectedCoursesForAssignment.includes(course.id)}
                          onChange={() => handleToggleCourseSelection(course.id)}
                        />
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-gray-900">{course.code}</div>
                          <div className="text-sm text-gray-500">{course.name}</div>
                          <div className="text-xs text-gray-400">{course.credits} credits</div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                          {course.status}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No courses available</p>
                )}
              </div>
              
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowRequestAssignmentModal(false)
                    setSelectedCoursesForAssignment([])
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestCourseAssignment}
                  disabled={selectedCoursesForAssignment.length === 0}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCourses
