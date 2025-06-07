import React from 'react';

const DesktopStudentTable = ({ students, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading top students...</div>
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 font-semibold text-gray-700">Rank</th>
            <th className="text-left py-3 px-2 font-semibold text-gray-700">SBD</th>
            <th className="text-left py-3 px-2 font-semibold text-gray-700">Total Score</th>
            <th className="text-left py-3 px-2 font-semibold text-gray-700">Average</th>
            <th className="text-left py-3 px-2 font-semibold text-gray-700">Subject Scores</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={student.sbd} className={`border-b border-gray-100 ${index < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
              <td className="py-4 px-2">
                <div className="flex items-center">
                  {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                  {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                  {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                  <span className="font-semibold text-lg">{student.rank}</span>
                </div>
              </td>
              <td className="py-4 px-2">
                <span className="font-mono text-blue-600 font-medium">{student.sbd}</span>
              </td>
              <td className="py-4 px-2">
                <span className="text-lg font-bold text-green-600">{student.total_score}</span>
              </td>
              <td className="py-4 px-2">
                <span className="text-lg font-bold text-blue-600">{student.average_score}</span>
              </td>
              <td className="py-4 px-2">
                <div className="flex flex-wrap gap-2">
                  {student.subjects.map((subject) => (
                    <div 
                      key={subject.code}
                      className="flex items-center bg-gray-100 rounded-lg px-3 py-1"
                    >
                      <span className="text-xs font-medium text-gray-600 mr-2">
                        {subject.name}:
                      </span>
                      <span className="text-sm font-bold text-gray-800">
                        {subject.score}
                      </span>
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DesktopStudentTable;