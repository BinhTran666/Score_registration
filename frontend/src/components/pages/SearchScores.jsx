import React, { useState } from 'react';
import UserRegistration from '../UserRegistration';
import DetailedScores from '../DetailedScores';

function SearchScore() {
  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStudentFound = (data) => {
    // console.log('SearchScore - Student found:', data);
    console.log('SearchScore - Setting student data...');
    setStudentData(data);
    setError('');
    console.log('SearchScore - Student data set, current state will update on next render');
  };

  const handleClearResults = () => {
    console.log('SearchScore - Clearing results');
    setStudentData(null);
    setError('');
  };

  const handleError = (errorMessage) => {
    console.log('SearchScore - Error occurred:', errorMessage);
    setError(errorMessage);
    setStudentData(null);
  };

  const handleLoading = (loading) => {
    console.log('SearchScore - Loading state:', loading);
    setIsLoading(loading);
  };

  console.log('SearchScore - Current render state:', {
    studentData,
    isLoading,
    error,
    hasStudentData: !!studentData
  });

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Page Introduction */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🔍 Student Score Search</h2>
            <p className="text-gray-600">
              Enter a student's registration number (SBD) to view their detailed examination scores across all subjects.
            </p>
          </div>
        </div>

        {/* Debug Info (remove in production)
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Debug:</strong> StudentData: {studentData ? 'Found' : 'None'} | 
            Loading: {isLoading ? 'Yes' : 'No'} | 
            Error: {error ? 'Yes' : 'No'}
          </p>
          {studentData && (
            <p className="text-xs text-yellow-700 mt-1">
              SBD: {studentData.sbd} | Subjects with scores: {
                Object.keys(studentData).filter(key => 
                  key !== 'sbd' && key !== 'ma_ngoai_ngu' && key !== 'id' && 
                  key !== 'created_at' && key !== 'updated_at' && 
                  studentData[key] !== null && studentData[key] !== 0
                ).length
              }
            </p>
          )}
        </div> */}

        {/* Search Section */}
        <div className="space-y-8">
          <UserRegistration 
            onStudentFound={handleStudentFound}
            onError={handleError}
            onLoading={handleLoading}
          />
          
          {/* Results Section */}
          <DetailedScores 
            studentData={studentData} 
            onClear={handleClearResults}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}

export default SearchScore;