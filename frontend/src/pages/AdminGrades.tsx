import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Grade, Enrollment } from '../types/api'
import { gradesApi, enrollmentsApi } from '../services/api'
import { normalizePage } from '../utils/normalize'

interface GradeCreateRequest {
  studentId: number
  courseId: number
  score: number
  feedback?: string
}

const AdminGrades: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [hasNext, setHasNext] = useState(false)
  const [lastId, setLastId] = useState<number | undefined>(undefined)
  const [filters, setFilters] = useState({
    courseId: '',
    studentId: '',
    status: ''
  })

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGrade, setNewGrade] = useState<GradeCreateRequest>({
    studentId: 0,
    courseId: 0,
    score: 0,
    feedback: ''
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)

  useEffect(() => {
    fetchGrades(true)
    fetchEnrollments()
  }, [filters])

  const fetchEnrollments = async () => {
    try {
      const response = await enrollmentsApi.getEnrollments()
      if (response.success && response.data) {
        // Use normalize function to handle multiple response formats
        const enrollmentData = normalizePage<Enrollment>(response.data)
        setEnrollments(enrollmentData)
      }
    } catch (error: any) {
      console.error('Error fetching enrollments:', error)
    }
  }

  const fetchGrades = async (reset = false) => {
    setLoading(true)
    try {
      const currentAfter = reset ? undefined : lastId
      const response = await gradesApi.getGrades(
        currentAfter,
        20,
        filters.courseId ? parseInt(filters.courseId) : undefined,
        filters.studentId ? parseInt(filters.studentId) : undefined,
        filters.status || undefined
      )
      
      if (response.success && response.data) {
        // Use normalize function to handle multiple response formats
        const gradeData = normalizePage<Grade>(response.data)
        
        // Handle pagination info
        let hasMore = false
        let nextCursor: number | undefined
        
        if (response.data.content) {
          hasMore = response.data.hasNext
          nextCursor = response.data.nextCursor
        }
        
        if (reset) {
          setGrades(gradeData)
        } else {
          setGrades(prev => [...prev, ...gradeData])
        }
        setHasNext(hasMore)
        setLastId(nextCursor)
      }
    } catch (error: any) {
      console.error('Error fetching grades:', error)
      toast.error('Failed to fetch grades')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    setLastId(undefined)
  }

  const handleRefresh = () => {
    fetchGrades(true)
  }

  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setFieldErrors({})
    
    if (!selectedEnrollment || !newGrade.score) {
      toast.error('Please select an enrollment and enter a score')
      return
    }

    try {
      // Use enrollment ID directly as per backend API
      const gradeData = {
        enrollmentId: selectedEnrollment.id,
        score: newGrade.score,
        feedback: newGrade.feedback || undefined
      }
      
      const response = await gradesApi.createGrade(gradeData)
      
      if (response.success) {
        toast.success('Grade created successfully')
        setShowCreateModal(false)
        setNewGrade({
          studentId: 0,
          courseId: 0,
          score: 0,
          feedback: ''
        })
        setSelectedEnrollment(null)
        setFieldErrors({})
        // Append to list if data returned, otherwise refresh
        if (response.data) {
          setGrades(prev => [...prev, response.data])
        } else {
          await fetchGrades(true)
        }
      }
    } catch (error: any) {
      console.error('Error creating grade:', error)
      
      // Handle field-level validation errors (400 responses)
      if (error.response?.status === 400 && error.response?.data?.details) {
        const errors = error.response.data.details.reduce((acc: any, detail: any) => {
          acc[detail.field] = detail.reason
          return acc
        }, {})
        setFieldErrors(errors)
        return
      }
      
      toast.error(error.response?.data?.message || 'Failed to create grade')
    }
  }

  const handleUpdateGrade = async (gradeId: number, score: number, feedback?: string) => {
    try {
      const response = await gradesApi.updateGrade(gradeId, score, feedback)
      if (response.success) {
        toast.success('Grade updated successfully')
        setGrades(prev => prev.map(grade => 
          grade.id === gradeId 
            ? { ...grade, score, feedback }
            : grade
        ))
      }
    } catch (error: any) {
      console.error('Error updating grade:', error)
      toast.error(error.response?.data?.message || 'Failed to update grade')
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
          <h1 className="text-xl font-semibold text-gray-900">Grade Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Administrative oversight of all grades and student assessments.
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
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Grade
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Course ID</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Filter by course ID..."
              value={filters.courseId}
              onChange={(e) => handleFilterChange('courseId', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Student ID</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Filter by student ID..."
              value={filters.studentId}
              onChange={(e) => handleFilterChange('studentId', e.target.value)}
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
              <option value="PENDING">Pending</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="GRADED">Graded</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grades List */}
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
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Feedback
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
            {grades.map((grade) => (
              <tr key={grade.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {grade.student?.firstName || 'Unknown'} {grade.student?.lastName || 'Student'}
                  </div>
                  <div className="text-sm text-gray-500">{grade.student?.email || 'No email'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {grade.enrollment?.course?.name || 'Unknown Course'}
                  </div>
                  <div className="text-sm text-gray-500">{grade.enrollment?.course?.code || 'No code'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{grade.score}%</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {grade.feedback || 'No feedback'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(grade.createdAt || grade.assignedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      const newScore = prompt('Enter new score (0-100):', grade.score.toString())
                      if (newScore && !isNaN(parseFloat(newScore))) {
                        const score = Math.max(0, Math.min(100, parseFloat(newScore)))
                        handleUpdateGrade(grade.id, score, grade.feedback)
                      }
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit Score
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {grades.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No grades found.</p>
          </div>
        )}
      </div>

      {/* Load More */}
      {hasNext && (
        <div className="mt-6 text-center">
          <button
            onClick={() => fetchGrades(false)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Create Grade Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-2/3 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Grade</h3>
              <form onSubmit={handleCreateGrade}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Student & Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                      fieldErrors.enrollmentId ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    value={selectedEnrollment?.id || ''}
                    onChange={(e) => {
                      const enrollment = enrollments.find(enr => enr.id === parseInt(e.target.value))
                      setSelectedEnrollment(enrollment || null)
                    }}
                    required
                  >
                    <option value="">Select Student & Course</option>
                    {enrollments.map((enrollment) => (
                      <option key={enrollment.id} value={enrollment.id}>
                        {enrollment.student.firstName} {enrollment.student.lastName} - {enrollment.course.name} ({enrollment.course.code})
                      </option>
                    ))}
                  </select>
                  {fieldErrors.enrollmentId && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.enrollmentId}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Score (0-100) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                      fieldErrors.score ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    value={newGrade.score}
                    onChange={(e) => setNewGrade({ ...newGrade, score: parseFloat(e.target.value) || 0 })}
                    required
                  />
                  {fieldErrors.score && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.score}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Feedback</label>
                  <textarea
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
                      fieldErrors.feedback ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    rows={3}
                    value={newGrade.feedback}
                    onChange={(e) => setNewGrade({ ...newGrade, feedback: e.target.value })}
                    placeholder="Optional feedback for the student..."
                  />
                  {fieldErrors.feedback && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.feedback}</p>
                  )}
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewGrade({
                        studentId: 0,
                        courseId: 0,
                        score: 0,
                        feedback: ''
                      })
                      setSelectedEnrollment(null)
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
                    Add Grade
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

export default AdminGrades