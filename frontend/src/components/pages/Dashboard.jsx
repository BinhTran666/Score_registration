import React from 'react';

function Dashboard() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h3>
          <p className="text-gray-600">Welcome to the Student Score Management System</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800">Total Students</h4>
              <p className="text-2xl font-bold text-blue-600">1,000+</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800">High Performers</h4>
              <p className="text-2xl font-bold text-green-600">250+</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800">Subjects</h4>
              <p className="text-2xl font-bold text-purple-600">9</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;