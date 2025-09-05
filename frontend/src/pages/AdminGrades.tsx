import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Grade, PaginatedResponse } from '../types/api'
import { gradesApi } from '../services/api'

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

  useEffect(() => {
    fetchGrades(true)
  }, [filters])

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
                    {grade.student.firstName} {grade.student.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{grade.student.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {grade.enrollment.course.name}
                  </div>
                  <div className="text-sm text-gray-500">{grade.enrollment.course.code}</div>
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
                  {new Date(grade.createdAt).toLocaleDateString()}
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
    </div>
  )
}

export default AdminGrades