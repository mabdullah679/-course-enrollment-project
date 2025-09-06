import React, { useState, useEffect } from 'react'
import { requestTracker, RequestInfo } from '../../lib/requestTracker'
import { api } from '../../lib/api'

interface QaSanityData {
  seededCourses: number
  seededEnrollments: number
  seededGrades: number
  windowState: string
  counts: {
    users: number
    courses: number
    enrollments: number
  }
}

const QaConsole: React.FC = () => {
  const [requests, setRequests] = useState<RequestInfo[]>([])
  const [sanityData, setSanityData] = useState<QaSanityData | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setSanityLoading] = useState(false)

  useEffect(() => {
    // Update requests every second
    const interval = setInterval(() => {
      setRequests(requestTracker.getRequests())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchSanityData = async () => {
    setSanityLoading(true)
    try {
      const response = await api.get('/api/v1/_qa-sanity')
      setSanityData(response.data)
    } catch (error) {
      console.error('Failed to fetch sanity data:', error)
    } finally {
      setSanityLoading(false)
    }
  }

  const clearRequests = () => {
    requestTracker.clear()
    setRequests([])
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600'
    if (status >= 400 && status < 500) return 'text-yellow-600'
    if (status >= 500) return 'text-red-600'
    return 'text-gray-600'
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          QA Console
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white shadow-2xl border border-gray-200 rounded-lg w-96 max-h-96 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 text-sm">QA Console (Dev)</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ✕
        </button>
      </div>
      
      <div className="p-4 space-y-4 overflow-y-auto max-h-80">
        {/* QA Sanity Check */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-sm text-gray-700">Sanity Check</h4>
            <button
              onClick={fetchSanityData}
              disabled={loading}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          {sanityData && (
            <div className="text-xs bg-gray-50 p-2 rounded border">
              <div>Courses: {sanityData.seededCourses}</div>
              <div>Enrollments: {sanityData.seededEnrollments}</div>
              <div>Grades: {sanityData.seededGrades}</div>
              <div>Window: {sanityData.windowState}</div>
              <div>Counts: U:{sanityData.counts.users} C:{sanityData.counts.courses} E:{sanityData.counts.enrollments}</div>
            </div>
          )}
        </div>

        {/* Request Tracking */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-sm text-gray-700">Recent Requests</h4>
            <button
              onClick={clearRequests}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {requests.length === 0 ? (
              <div className="text-xs text-gray-500 italic">No requests tracked yet</div>
            ) : (
              requests.map((req, index) => (
                <div key={index} className="text-xs bg-gray-50 p-2 rounded border">
                  <div className="flex justify-between items-center">
                    <span className="font-mono truncate flex-1 mr-2">{req.endpoint}</span>
                    <span className={`font-bold ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-gray-500">
                    <span>{req.method}</span>
                    <span>{formatTimestamp(req.timestamp)}</span>
                  </div>
                  <div className="font-mono text-gray-400 mt-1 truncate">
                    ID: {req.id}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QaConsole