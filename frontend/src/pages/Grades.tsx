import React, { useState, useEffect } from 'react'
import { toast as hotToast } from 'react-hot-toast'
import { gradesApi, meApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Grade, PaginatedResponse, UserRole } from '../types/api'

const Grades: React.FC = () => {
  const { user } = useAuth()
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [hasNext, setHasNext] = useState(false)
  const [lastId, setLastId] = useState<number | undefined>(undefined)

  useEffect(() => {
    fetchGrades()
  }, [])

  const fetchGrades = async (reset = false) => {
    setLoading(true)
    try {
      const currentAfter = reset ? undefined : lastId

      // Use different endpoints based on user role
      if (user?.role === UserRole.STUDENT) {
        // Students use the /me/grades endpoint
        const gradesArray = await meApi.getMyGrades(20, currentAfter)
        
        if (reset) {
          setGrades(gradesArray)
        } else {
          setGrades(prev => [...prev, ...gradesArray])
        }
        setHasNext(gradesArray.length === 20) // Assume more if we got exactly the page size
        if (gradesArray.length > 0) {
          setLastId(gradesArray[gradesArray.length - 1].id)
        }
      } else {
        // Admin/Instructor use the regular grades endpoint
        const response = await gradesApi.getGrades(
          currentAfter,
          20
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
      }
    } catch (error: any) {
      console.error('Error fetching grades:', error)
      hotToast.error('Failed to fetch grades')
    } finally {
      setLoading(false)
    }
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
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => fetchGrades(true)}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Refresh
          </button>
        </div>
      </div>

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
    </div>
  )
}

export default Grades
