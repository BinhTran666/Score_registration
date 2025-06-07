import React from 'react';

const MobileStudentCard = ({ student, index }) => {
  return (
    <div className={`p-4 rounded-lg border ${index < 3 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {index === 0 && <span className="text-xl mr-2">🥇</span>}
          {index === 1 && <span className="text-xl mr-2">🥈</span>}
          {index === 2 && <span className="text-xl mr-2">🥉</span>}
          <span className="font-bold text-lg">#{student.rank}</span>
        </div>
        <span className="font-mono text-blue-600 font-medium">{student.sbd}</span>
      </div>
      
      <div className="mb-3 grid grid-cols-2 gap-4">
        <div>
          <span className="text-sm text-gray-600">Total Score: </span>
          <span className="text-lg font-bold text-green-600">{student.total_score}</span>
        </div>
        <div>
          <span className="text-sm text-gray-600">Average: </span>
          <span className="text-lg font-bold text-blue-600">{student.average_score}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <span className="text-sm text-gray-600 block">Subject Scores:</span>
        <div className="grid grid-cols-1 gap-2">
          {student.subjects.map((subject) => (
            <div key={subject.code} className="flex justify-between items-center bg-gray-100 rounded px-3 py-2">
              <span className="text-sm font-medium text-gray-700">{subject.name}</span>
              <span className="text-sm font-bold text-gray-800">{subject.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileStudentCard;