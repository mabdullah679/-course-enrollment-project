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
  const [windowRequired, setWindowRequired] = useState(false)
  const [hasNext, setHasNext] = useState(false)
  const [lastId, setLastId] = useState<number | undefined>(undefined)

  const [showModifyModal, setShowModifyModal] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  const [withdrawReason, setWithdrawReason] = useState('')
  const [acknowledgeWithdraw, setAcknowledgeWithdraw] = useState(false)
  const [modifyLoading, setModifyLoading] = useState(false)

  useEffect(() => {
    fetchEnrollments(true)
    checkEnrollmentWindow()
  }, [])

  const fetchEnrollments = async (reset = false) => {
    setLoading(true)
    try {
      const currentAfter = reset ? undefined : lastId
      const studentId = user?.id

      const response = await enrollmentsApi.getEnrollments(
        currentAfter,
        20,
        undefined,
        undefined,
        undefined,
        studentId
      )

      if (response.success && response.data) {
        const paginatedData = response.data as PaginatedResponse<Enrollment>
        setEnrollments(prev => {
          const merged = new Map<number, Enrollment>()
          if (!reset) {
            prev.forEach(enrollment => merged.set(enrollment.id, enrollment))
          }
          paginatedData.content.forEach(enrollment => merged.set(enrollment.id, enrollment))
          return Array.from(merged.values())
        })
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
        const details = response.data.enrollmentWindowDetails || {}
        const state = (details.state || response.data.enrollmentWindow || 'CLOSED') as 'OPEN' | 'CLOSED'
        setEnrollmentWindow(state)
        setWindowRequired(Boolean(response.data.enrollmentWindowRequired))
      }
    } catch (error) {
      console.info('Enrollment window status unavailable, defaulting to CLOSED')
    }
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

  const openModifyModal = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment)
    setWithdrawReason('')
    setAcknowledgeWithdraw(false)
    setShowModifyModal(true)
  }

  const closeModifyModal = () => {
    setShowModifyModal(false)
    setSelectedEnrollment(null)
  }

  const refreshAfterAction = async () => {
    await fetchEnrollments(true)
    closeModifyModal()
  }

  const cancelEnrollment = async () => {
    if (!selectedEnrollment) return
    setModifyLoading(true)
    try {
      await enrollmentsApi.deleteEnrollment(selectedEnrollment.id)
      hotToast.success('Enrollment removed')
      await refreshAfterAction()
    } catch (error: any) {
      console.error('Failed to remove enrollment', error)
      hotToast.error(error.response?.data?.message || 'Unable to update enrollment')
    } finally {
      setModifyLoading(false)
    }
  }

  const withdrawEnrollment = async () => {
    if (!selectedEnrollment) return
    if (!withdrawReason.trim()) {
      hotToast.error('Reason is required to withdraw')
      return
    }
    if (!acknowledgeWithdraw) {
      hotToast.error('Please confirm the acknowledgement')
      return
    }

    setModifyLoading(true)
    try {
      await enrollmentsApi.withdrawEnrollment(selectedEnrollment.id, withdrawReason.trim())
      hotToast.success('Withdrawal request submitted')
      await refreshAfterAction()
    } catch (error: any) {
      console.error('Failed to withdraw enrollment', error)
      hotToast.error(error.response?.data?.message || 'Unable to submit withdrawal')
    } finally {
      setModifyLoading(false)
    }
  }

  const reapplyEnrollment = async () => {
    if (!selectedEnrollment) return
    setModifyLoading(true)
    try {
      await enrollmentsApi.enrollInCourse(selectedEnrollment.course.id)
      const reopened = selectedEnrollment.status === 'DROPPED'
      hotToast.success(reopened ? 'Enrollment request reopened' : 'Enrollment request resubmitted')
      await refreshAfterAction()
    } catch (error: any) {
      console.error('Failed to resubmit enrollment', error)
      hotToast.error(error.response?.data?.message || 'Unable to resubmit request')
    } finally {
      setModifyLoading(false)
    }
  }

  const hasModifyActions = (enrollment: Enrollment) => {
    const actionableStatuses = ['PENDING', 'REJECTED', 'ACTIVE', 'APPROVED', 'DROPPED']
    return actionableStatuses.includes(enrollment.status)
  }

  return (
    <>
      <div className="p-6">
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">My Enrollments</h1>
            <p className="mt-2 text-sm text-gray-700">
              View your course enrollments and registration status.
            </p>
            <div className="mt-2 space-y-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                enrollmentWindow === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                Enrollment Window: {enrollmentWindow}
              </span>
              {windowRequired && enrollmentWindow === 'CLOSED' && (
                <div className="text-xs text-gray-500">
                  Enrollment requests are disabled until an administrator opens the window.
                </div>
              )}
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

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
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
              {enrollments.map(enrollment => (
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(enrollment.status)}`}>
                      {enrollment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {hasModifyActions(enrollment) ? (
                      <button
                        onClick={() => openModifyModal(enrollment)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Modify
                      </button>
                    ) : (
                      <span className="text-gray-400">No actions</span>
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
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showModifyModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Manage Enrollment</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedEnrollment.course.name} ({selectedEnrollment.course.code})
                </p>
                <p className="text-xs text-gray-500">Current status: {selectedEnrollment.status}</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600" onClick={closeModifyModal}>✕</button>
            </div>

            <div className="mt-4 space-y-4">
              {(selectedEnrollment.status === 'PENDING' || selectedEnrollment.status === 'REJECTED' || selectedEnrollment.status === 'DROPPED') && (
                <div className="border rounded-md p-4">
                  <h4 className="text-sm font-semibold text-gray-800">Remove this request</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Delete this enrollment entry from your history.
                  </p>
                  <button
                    onClick={cancelEnrollment}
                    className="mt-3 inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                    disabled={modifyLoading}
                  >
                    {modifyLoading ? 'Updating...' : 'Delete request'}
                  </button>
                </div>
              )}

              {['REJECTED', 'DROPPED'].includes(selectedEnrollment.status) && (
                <div className="border rounded-md p-4">
                  <h4 className="text-sm font-semibold text-gray-800">
                    {selectedEnrollment.status === 'DROPPED' ? 'Reopen enrollment' : 'Resubmit for approval'}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedEnrollment.status === 'DROPPED'
                      ? 'Reopen this request without losing its history so staff can review it again.'
                      : 'Send a new enrollment request for this course.'}
                  </p>
                  <button
                    onClick={reapplyEnrollment}
                    className="mt-3 inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                    disabled={modifyLoading}
                  >
                    {modifyLoading
                      ? 'Submitting...'
                      : selectedEnrollment.status === 'DROPPED'
                        ? 'Reopen request'
                        : 'Resubmit request'}
                  </button>
                </div>
              )}

              {(selectedEnrollment.status === 'ACTIVE' || selectedEnrollment.status === 'APPROVED') && (
                <div className="border rounded-md p-4">
                  <h4 className="text-sm font-semibold text-gray-800">Withdraw from course</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Provide a short explanation so staff can review your request.
                  </p>
                  <textarea
                    className="mt-3 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    rows={3}
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value)}
                    placeholder="Reason for withdrawal"
                  />
                  <label className="mt-2 flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={acknowledgeWithdraw}
                      onChange={(e) => setAcknowledgeWithdraw(e.target.checked)}
                    />
                    <span className="ml-2">I acknowledge this request notifies administrators.</span>
                  </label>
                  <button
                    onClick={withdrawEnrollment}
                    className="mt-3 inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md"
                    disabled={modifyLoading}
                  >
                    {modifyLoading ? 'Submitting...' : 'Submit withdrawal'}
                  </button>
                </div>
              )}

              {!hasModifyActions(selectedEnrollment) && (
                <p className="text-sm text-gray-500">No available actions for this enrollment.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Enrollments
