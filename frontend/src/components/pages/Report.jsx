import React from 'react';

function Report() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Reports</h3>
          <p className="text-gray-600 mb-6">Generate and download score reports</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Subject Performance</h4>
              <p className="text-sm text-gray-600 mb-4">Detailed analysis of each subject</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Generate
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Top Performers</h4>
              <p className="text-sm text-gray-600 mb-4">List of highest scoring students</p>
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Generate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Report;