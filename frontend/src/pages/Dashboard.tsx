import React from 'react'

const Dashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Student Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold">My Courses</h2>
          <p className="text-gray-600">View your enrolled courses</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Grades</h2>
          <p className="text-gray-600">Check your grades</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Enrollments</h2>
          <p className="text-gray-600">Manage enrollments</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
