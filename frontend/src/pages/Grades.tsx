import React, { useState, useEffect } from 'react'
import { toast as hotToast } from 'react-hot-toast'
import { gradesApi, enrollmentsApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Grade, PaginatedResponse, UserRole, Enrollment } from '../types/api'
import { toastGroups } from '../lib/toast'

const Grades: React.FC = () => {
  const { user } = useAuth()
  const [grades, setGrades] = useState<Grade[]>([])
  const [pendingEnrollments, setPendingEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [hasNext, setHasNext] = useState(false)
  const [lastId, setLastId] = useState<number | undefined>(undefined)
  
  // Assign Grade Modal states
  const [showAssignGradeModal, setShowAssignGradeModal] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  const [newGrade, setNewGrade] = useState({
    score: 0,
    feedback: ''
  })

  useEffect(() => {
    fetchGrades()
    if (user?.role === UserRole.INSTRUCTOR) {
      fetchPendingEnrollments()
    }
  }, [])

  const fetchGrades = async (reset = false) => {
    setLoading(true)
    try {
      const currentLastId = reset ? undefined : lastId
      let studentId: number | undefined
      let courseId: number | undefined

      // Filter based on user role
      if (user?.role === UserRole.STUDENT) {
        studentId = user.id
      }
      // For instructors and admin, show all grades (backend should filter by permissions)
      
      const response = await gradesApi.getGrades(
        currentLastId,
        20,
        courseId,
        studentId
      )
      
      if (response.success && response.data) {
        const paginatedData = response.data as PaginatedResponse<Grade>
        if (reset) {
          setGrades(paginatedData.content)
        } else {
          setGrades(prev => [...prev, ...paginatedData.content])
        }
        setHasNext(paginatedData.hasNext)
        setLastId(paginatedData.nextCursor)
      }
    } catch (error: any) {
      console.error('Error fetching grades:', error)
      hotToast.error('Failed to fetch grades')
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingEnrollments = async () => {
    try {
      // Fetch enrollments that don't have grades yet (for instructor's courses)
      const response = await enrollmentsApi.getEnrollments(
        undefined, // lastId
        50,       // limit
        undefined, // type
        'ACTIVE',  // status - only active enrollments
        undefined, // courseId - let backend filter by instructor
        undefined  // studentId
      )
      
      if (response.success && response.data) {
        const paginatedData = response.data as PaginatedResponse<Enrollment>
        // Filter out enrollments that already have grades
        const pending = paginatedData.content.filter(enrollment => 
          !grades.some(grade => grade.enrollment.id === enrollment.id)
        )
        setPendingEnrollments(pending)
      }
    } catch (error: any) {
      console.info('Pending enrollments check failed (possibly no backend support):', error)
    }
  }

  const handleAssignGrade = async () => {
    if (!selectedEnrollment) return

    if (newGrade.score < 0 || newGrade.score > 100) {
      toastGroups.form.error('Score must be between 0 and 100')
      return
    }

    try {
      const response = await gradesApi.createGrade({
        enrollmentId: selectedEnrollment.id,
        score: newGrade.score,
        feedback: newGrade.feedback || undefined
      })
      
      if (response.success) {
        toastGroups.form.success('Grade assigned successfully')
        setShowAssignGradeModal(false)
        setSelectedEnrollment(null)
        setNewGrade({ score: 0, feedback: '' })
        
        // Refresh grades and pending enrollments
        await fetchGrades(true)
        await fetchPendingEnrollments()
      }
    } catch (error: any) {
      console.error('Error assigning grade:', error)
      toastGroups.api.error(error.response?.data?.message || 'Failed to assign grade')
    }
  }

  const openAssignGradeModal = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment)
    setNewGrade({ score: 0, feedback: '' })
    setShowAssignGradeModal(true)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getLetterGrade = (score: number) => {
    if (score >= 97) return 'A+'
    if (score >= 93) return 'A'
    if (score >= 90) return 'A-'
    if (score >= 87) return 'B+'
    if (score >= 83) return 'B'
    if (score >= 80) return 'B-'
    if (score >= 77) return 'C+'
    if (score >= 73) return 'C'
    if (score >= 70) return 'C-'
    if (score >= 67) return 'D+'
    if (score >= 63) return 'D'
    if (score >= 60) return 'D-'
    return 'F'
  }

  const loadMore = () => {
    if (hasNext && !loading) {
      fetchGrades(false)
    }
  }

  const getPageTitle = () => {
    switch (user?.role) {
      case UserRole.STUDENT:
        return 'My Grades'
      case UserRole.INSTRUCTOR:
        return 'Grade Management'
      case UserRole.ADMIN:
      case UserRole.STAFF:
        return 'All Grades'
      default:
        return 'Grades'
    }
  }

  const getPageDescription = () => {
    switch (user?.role) {
      case UserRole.STUDENT:
        return 'View your grades and performance across all courses.'
      case UserRole.INSTRUCTOR:
        return 'Manage grades for your courses and students.'
      case UserRole.ADMIN:
      case UserRole.STAFF:
        return 'View and manage grades across all courses.'
      default:
        return 'Grade information and performance tracking.'
    }
  }

  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
          <p className="mt-2 text-sm text-gray-700">{getPageDescription()}</p>
          {user?.role === UserRole.INSTRUCTOR && pendingEnrollments.length > 0 && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                {pendingEnrollments.length} Pending Grades
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          <button
            type="button"
            onClick={() => fetchGrades(true)}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Refresh
          </button>
          {user?.role === UserRole.INSTRUCTOR && pendingEnrollments.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (pendingEnrollments.length === 1) {
                  openAssignGradeModal(pendingEnrollments[0])
                } else {
                  toastGroups.system.info('Select a student from the pending list below')
                  // Scroll to pending section
                  document.getElementById('pending-grades')?.scrollIntoView({ behavior: 'smooth' })
                }
              }}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Assign Grade
            </button>
          )}
        </div>
      </div>

      {/* Pending Grades Section for Instructors */}
      {user?.role === UserRole.INSTRUCTOR && pendingEnrollments.length > 0 && (
        <div id="pending-grades" className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-medium text-yellow-800 mb-3">Pending Grade Assignments</h2>
          <div className="space-y-2">
            {pendingEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="flex items-center justify-between bg-white p-3 rounded border">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {enrollment.student.firstName} {enrollment.student.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {enrollment.course.name} ({enrollment.course.code})
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                  <button
                    onClick={() => openAssignGradeModal(enrollment)}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Assign Grade
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grades List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course
              </th>
              {user?.role !== UserRole.STUDENT && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Feedback
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {grades.map((grade) => (
              <tr key={grade.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {grade.enrollment.course.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {grade.enrollment.course.code}
                  </div>
                </td>
                {user?.role !== UserRole.STUDENT && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {grade.student.firstName} {grade.student.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {grade.student.email}
                    </div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-bold ${getScoreColor(grade.score)}`}>
                    {grade.score}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    grade.score >= 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {getLetterGrade(grade.score)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {grade.feedback || 'No feedback provided'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(grade.createdAt).toLocaleDateString()}
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

        {!loading && grades.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No grades yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              {user?.role === UserRole.STUDENT 
                ? 'No grades have been posted for your courses yet.'
                : 'No grades have been recorded in the system yet.'
              }
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

      {/* Assign Grade Modal */}
      {showAssignGradeModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Grade: {selectedEnrollment.student.firstName} {selectedEnrollment.student.lastName}
              </h3>
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  Course: {selectedEnrollment.course.name} ({selectedEnrollment.course.code})
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score (0-100) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={newGrade.score}
                  onChange={(e) => setNewGrade({ ...newGrade, score: parseFloat(e.target.value) || 0 })}
                  required
                />
                <div className="mt-1 text-xs text-gray-500">
                  Letter Grade: {getLetterGrade(newGrade.score)}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (Optional)
                </label>
                <textarea
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  rows={3}
                  value={newGrade.feedback}
                  onChange={(e) => setNewGrade({ ...newGrade, feedback: e.target.value })}
                  placeholder="Provide feedback for the student..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignGradeModal(false)
                    setSelectedEnrollment(null)
                    setNewGrade({ score: 0, feedback: '' })
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignGrade}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Assign Grade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Grades
