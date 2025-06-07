import React from 'react';

function DetailedScores({ studentData, onClear, isLoading, error }) {
  
  console.log('DetailedScores - Received props:', {
    hasStudentData: !!studentData,
    studentData: studentData,
    isLoading,
    error
  });

  if (isLoading) {
    console.log('DetailedScores - Showing loading state');
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600 text-lg">Searching for student...</span>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('DetailedScores - Showing error state:', error);
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-red-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <span className="text-2xl mr-3">❌</span>
            Search Error
          </h3>
          {onClear && (
            <button
              onClick={onClear}
              className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    console.log('DetailedScores - Showing empty state (no student data)');
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="text-center">
          <span className="text-6xl mb-4 block">📊</span>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Student Scores</h3>
          <p className="text-gray-500">
            Enter a registration number above to view detailed student scores and performance analytics.
          </p>
        </div>
      </div>
    );
  }

  console.log('DetailedScores - Showing student data for SBD:', studentData.sbd);

  const subjects = [
    { key: 'toan', label: 'Toán', color: 'bg-blue-100 text-blue-800', icon: '🧮' },
    { key: 'ngu_van', label: 'Ngữ Văn', color: 'bg-green-100 text-green-800', icon: '📚' },
    { key: 'ngoai_ngu', label: 'Ngoại Ngữ', color: 'bg-purple-100 text-purple-800', icon: '🌍' },
    { key: 'vat_li', label: 'Vật Lí', color: 'bg-red-100 text-red-800', icon: '⚡' },
    { key: 'hoa_hoc', label: 'Hóa Học', color: 'bg-yellow-100 text-yellow-800', icon: '🧪' },
    { key: 'sinh_hoc', label: 'Sinh Học', color: 'bg-pink-100 text-pink-800', icon: '🌱' },
    { key: 'lich_su', label: 'Lịch Sử', color: 'bg-indigo-100 text-indigo-800', icon: '📜' },
    { key: 'dia_li', label: 'Địa Lí', color: 'bg-teal-100 text-teal-800', icon: '🗺️' },
    { key: 'gdcd', label: 'GDCD', color: 'bg-orange-100 text-orange-800', icon: '⚖️' }
  ];

  const getScoreColor = (score) => {
    if (score === null || score === undefined || score === 0) return 'text-gray-400';
    if (score >= 8) return 'text-green-600 font-bold';
    if (score >= 6.5) return 'text-blue-600 font-semibold';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatScore = (score) => {
    if (score === null || score === undefined || score === 0) return 'N/A';
    return score;
  };

  const getScoreStatus = (score) => {
    if (score === null || score === undefined || score === 0) return '';
    if (score >= 8) return '🏆 Excellent';
    if (score >= 6.5) return '👍 Good';
    if (score >= 5) return '⚠️ Average';
    return '❌ Below Average';
  };

  // Calculate statistics
  const validScores = subjects
    .map(subject => studentData[subject.key])
    .filter(score => score !== null && score !== undefined && score !== 0);
  
  console.log('DetailedScores - Valid scores found:', validScores);
  
  const average = validScores.length > 0 
    ? (validScores.reduce((sum, score) => sum + score, 0) / validScores.length).toFixed(2)
    : 'N/A';

  const highestScore = validScores.length > 0 ? Math.max(...validScores) : 0;
  const lowestScore = validScores.length > 0 ? Math.min(...validScores) : 0;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="text-2xl mr-3">📊</span>
          Student Score Details
        </h3>
        {onClear && (
          <button
            onClick={onClear}
            className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
          >
            🔄 New Search
          </button>
        )}
      </div>

      {/* Student Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6 border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center md:text-left">
            <span className="text-sm font-medium text-gray-600">Registration Number</span>
            <p className="text-2xl font-bold text-blue-600">{studentData.sbd}</p>
          </div>
          <div className="text-center md:text-left">
            <span className="text-sm font-medium text-gray-600">Foreign Language</span>
            <p className="text-lg font-semibold text-gray-800">{studentData.ma_ngoai_ngu || 'N/A'}</p>
          </div>
          <div className="text-center md:text-left">
            <span className="text-sm font-medium text-gray-600">Average Score</span>
            <p className={`text-xl font-bold ${getScoreColor(parseFloat(average))}`}>
              {average}
            </p>
          </div>
          <div className="text-center md:text-left">
            <span className="text-sm font-medium text-gray-600">Total Subjects</span>
            <p className="text-xl font-bold text-purple-600">{validScores.length}</p>
          </div>
        </div>
      </div>

      {/* Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {subjects.map((subject) => {
          const score = studentData[subject.key];
          console.log(`DetailedScores - ${subject.label} (${subject.key}):`, score);
          return (
            <div key={subject.key} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <span className="text-lg mr-2">{subject.icon}</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${subject.color}`}>
                    {subject.label}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className={`text-3xl font-bold ${getScoreColor(score)}`}>
                    {formatScore(score)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getScoreStatus(score)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Statistics */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">📈 Performance Analysis</h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
            <p className="text-sm text-green-600 font-medium">Excellent (≥8)</p>
            <p className="text-2xl font-bold text-green-700">
              {validScores.filter(score => score >= 8).length}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Good (6.5-7.9)</p>
            <p className="text-2xl font-bold text-blue-700">
              {validScores.filter(score => score >= 6.5 && score < 8).length}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-200">
            <p className="text-sm text-yellow-600 font-medium">Average (5-6.4)</p>
            <p className="text-2xl font-bold text-yellow-700">
              {validScores.filter(score => score >= 5 && score < 6.5).length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
            <p className="text-sm text-red-600 font-medium">{'Below (<5)'}</p>
            <p className="text-2xl font-bold text-red-700">
              {validScores.filter(score => score < 5).length}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-200">
            <p className="text-sm text-purple-600 font-medium">Highest</p>
            <p className="text-2xl font-bold text-purple-700">
              {highestScore || 'N/A'}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-200">
            <p className="text-sm text-orange-600 font-medium">Lowest</p>
            <p className="text-2xl font-bold text-orange-700">
              {lowestScore || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailedScores;