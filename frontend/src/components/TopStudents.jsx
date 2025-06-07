import React, { useState, useEffect } from 'react';
import { reportAPI } from '../services/reportService';

function TopStudents() {
  const [topStudentsData, setTopStudentsData] = useState(null);
  const [loadingTopStudents, setLoadingTopStudents] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('A');
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchGroupsConfig();
  }, []);

  useEffect(() => {
    if (availableGroups.length > 0) {
      fetchTopStudents();
    }
  }, [availableGroups]);

  const fetchGroupsConfig = async () => {
    try {
      setLoadingGroups(true);
      const result = await reportAPI.getGroupsConfig();
      if (result.success) {
        setAvailableGroups(result.data.groups);
        // Set the first group as selected if no group is selected
        if (result.data.groups.length > 0 && !selectedGroup) {
          setSelectedGroup(result.data.groups[0].code);
        }
      } else {
        throw new Error(result.message || 'Failed to fetch groups configuration');
      }
    } catch (error) {
      console.error('Error fetching groups config:', error);
      setError(error.message);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchTopStudents = async (groupCode = selectedGroup) => {
    try {
      setLoadingTopStudents(true);
      setError(null);
      const result = await reportAPI.getTopStudentsByGroup(groupCode, 10);
      if (result.success) {
        setTopStudentsData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch top students');
      }
    } catch (error) {
      console.error('Error fetching top students:', error);
      setError(error.message);
    } finally {
      setLoadingTopStudents(false);
    }
  };

  const handleGroupChange = (groupCode) => {
    setSelectedGroup(groupCode);
    fetchTopStudents(groupCode);
  };

  const MobileStudentCard = ({ student, index }) => (
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
      
      <div className="mb-3">
        <span className="text-sm text-gray-600">Weighted Average: </span>
        <span className="text-lg font-bold text-green-600">{student.weighted_average}</span>
      </div>
      
      <div className="space-y-2">
        <span className="text-sm text-gray-600 block">Subject Scores:</span>
        <div className="grid grid-cols-1 gap-2">
          {student.subjects.map((subject) => (
            <div key={subject.code} className="flex justify-between items-center bg-gray-100 rounded px-3 py-2">
              <span className="text-sm font-medium text-gray-700">{subject.name}</span>
              <div className="flex items-center">
                <span className="text-sm font-bold text-gray-800">{subject.score}</span>
                {subject.weight > 1 && (
                  <span className="text-xs text-blue-600 ml-1">(×{subject.weight})</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const DesktopStudentsTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 font-semibold text-gray-700">Rank</th>
            <th className="text-left py-3 px-2 font-semibold text-gray-700">SBD</th>
            <th className="text-left py-3 px-2 font-semibold text-gray-700">Weighted Average</th>
            <th className="text-left py-3 px-2 font-semibold text-gray-700">Subject Scores</th>
          </tr>
        </thead>
        <tbody>
          {topStudentsData.students.map((student, index) => (
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
                <span className="text-lg font-bold text-green-600">{student.weighted_average}</span>
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
                      {subject.weight > 1 && (
                        <span className="text-xs text-blue-600 ml-1">
                          (×{subject.weight})
                        </span>
                      )}
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

  const GroupSelector = () => (
    <div className="mt-4 sm:mt-0">
      {isMobile ? (
        // Mobile dropdown selector
        <select
          value={selectedGroup}
          onChange={(e) => handleGroupChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={loadingGroups}
        >
          {availableGroups.map(group => (
            <option key={group.code} value={group.code}>
              {group.icon} {group.name}
            </option>
          ))}
        </select>
      ) : (
        // Desktop button selector
        <div className="flex flex-wrap gap-2">
          {availableGroups.map(group => (
            <button
              key={group.code}
              onClick={() => handleGroupChange(group.code)}
              disabled={loadingGroups}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                selectedGroup === group.code
                  ? 'text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ 
                backgroundColor: selectedGroup === group.code ? group.color : undefined 
              }}
            >
              <span className="mr-1">{group.icon}</span>
              {group.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">🏆 Top Students</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (loadingGroups) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">🏆 Top Students</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading groups configuration...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">🏆 Top Students</h3>
          <p className="text-gray-600">Highest performing students by examination groups</p>
        </div>
        
        {/* Group selector */}
        <GroupSelector />
      </div>

      {loadingTopStudents ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading top students...</div>
        </div>
      ) : topStudentsData ? (
        <div>
          {/* Group info header */}
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: topStudentsData.group.color + '15' }}>
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-3">{topStudentsData.group.icon}</span>
              <h4 className="text-lg font-semibold" style={{ color: topStudentsData.group.color }}>
                {topStudentsData.group.name}
              </h4>
            </div>
            <p className="text-sm text-gray-600 mb-2">{topStudentsData.group.description}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-white rounded">
                Total Eligible: {topStudentsData.total_eligible} students
              </span>
              <span className="px-2 py-1 bg-white rounded">
                Min Score: {topStudentsData.criteria.min_score}
              </span>
              <span className="px-2 py-1 bg-white rounded">
                Required Subjects: {topStudentsData.group.minSubjectsRequired || 3}
              </span>
            </div>
          </div>

          {/* Weight information */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <h5 className="text-sm font-semibold text-blue-800 mb-2">Subject Weights:</h5>
            <div className="flex flex-wrap gap-2">
              {Object.entries(topStudentsData.group.weights || {}).map(([subject, weight]) => (
                <span key={subject} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {subject}: ×{weight}
                </span>
              ))}
            </div>
          </div>

          {/* Students display - responsive */}
          {isMobile ? (
            <div className="space-y-4">
              {topStudentsData.students.map((student, index) => (
                <MobileStudentCard key={student.sbd} student={student} index={index} />
              ))}
            </div>
          ) : (
            <DesktopStudentsTable />
          )}

          {/* Summary footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Generated at: {new Date(topStudentsData.generated_at).toLocaleString()}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No data available</div>
        </div>
      )}
    </div>
  );
}

export default TopStudents;