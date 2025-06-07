import React, { useState, useEffect } from 'react';
import { reportAPI } from '../services/reportService';
import MobileStudentCard from './MobileStudentCard';
import DesktopStudentTable from './DeskTopStudentsTable';

function TopStudents() {
  const [topStudentsData, setTopStudentsData] = useState(null);
  const [loadingTopStudents, setLoadingTopStudents] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('A');
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [limit, setLimit] = useState(10);

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
  }, [availableGroups, selectedGroup, limit]);

  // Using your existing reportAPI service
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

  // Using your existing reportAPI service
  const fetchTopStudents = async (groupCode = selectedGroup) => {
    try {
      setLoadingTopStudents(true);
      setError(null);
      const result = await reportAPI.getTopStudentsByGroup(groupCode, limit);
      if (result.success) {
        console.log(result.data);
        setTopStudentsData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch top students');
      }
    } catch (error) {
      console.error('Error fetching top students:', error);
      setError(error.message);
      setTopStudentsData(null);
    } finally {
      setLoadingTopStudents(false);
    }
  };

  const handleGroupChange = (groupCode) => {
    setSelectedGroup(groupCode);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
  };

  const handleRefresh = () => {
    fetchTopStudents(selectedGroup);
  };

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
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">🏆 Top Students</h3>
          <p className="text-gray-600">Highest performing students by total score across examination groups</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0">
          {/* Limit selector */}
          <select
            value={limit}
            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>
          
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={loadingTopStudents}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loadingTopStudents ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Group selector */}
      <GroupSelector />

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
                Min Total Score: {topStudentsData.criteria.min_total_score}
              </span>
              <span className="px-2 py-1 bg-white rounded">
                Required Subjects: {topStudentsData.group.minSubjectsRequired || 3}
              </span>
            </div>
          </div>

          {/* Ranking information */}
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <h5 className="text-sm font-semibold text-green-800 mb-2">📊 Ranking Criteria:</h5>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                Ranked by: Total Score (sum of 3 subjects)
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                Order: {topStudentsData.criteria.direction === 'desc' ? 'Highest to Lowest' : 'Lowest to Highest'}
              </span>
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
            <DesktopStudentTable 
              students={topStudentsData.students} 
              isLoading={loadingTopStudents}
            />
          )}

          {/* Summary footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Generated at: {new Date(topStudentsData.generated_at).toLocaleString()}</p>
            {topStudentsData.optimization && (
              <p className="mt-1">Optimization: {topStudentsData.optimization}</p>
            )}
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