import React, { useState } from "react";
import { studentAPI } from "../services/StudentService.js"; // Adjust the import path as necessary

function UserRegistration({ onStudentFound, onError, onLoading }) {
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);
  const [inputError, setInputError] = useState("");

  const handleInputChange = (e) => {
    const value = e.target.value;

    setRegistrationNumber(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!registrationNumber.trim()) {
      onError("Please enter a registration number.");
      return;
    }

    const sbd = registrationNumber.trim();
    onLoading(true);
    onError("");

    try {
      if (sbd < 0 || isNaN(sbd)) {
        throw new Error(
          "Invalid registration number. Do not use characters or negative numbers."
        );
      }
      console.log("Searching for student:", sbd);
      const response = await studentAPI.getStudentBySbd(sbd);

      // Check if response has the expected structure
      console.log("Full API response:", response);

      // Extract student data (it might be in response.data or just response)
      const studentData = response.data || response;
      console.log("Student data extracted:", studentData);

      if (!studentData || !studentData.sbd) {
        throw new Error("Invalid student data received");
      }

      // Add to search history
      setSearchHistory((prev) => {
        const newHistory = [sbd, ...prev.filter((item) => item !== sbd)].slice(
          0,
          5
        );
        return newHistory;
      });

      // Pass the student data to parent component
      onStudentFound(studentData);

      // Clear the input after successful search
      setRegistrationNumber("");
    } catch (error) {
      console.error("Search error:", error);
      onError(
        error.message ||
          "Student not found. Please check the registration number."
      );
    } finally {
      onLoading(false);
    }
  };

  const handleHistoryClick = (sbd) => {
    setRegistrationNumber(sbd);
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center mb-6">
        <span className="text-2xl mr-3">📝</span>
        <h3 className="text-2xl font-bold text-gray-800">Student Search</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="regNumber"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Registration Number (SBD):
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-3 sm:space-y-0">
            <input
              type="text"
              id="regNumber"
              name="regNumber"
              value={registrationNumber}
              onChange={handleInputChange}
              placeholder="Enter registration number (e.g., 01000001)"
              className="flex-grow px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
            <button
              type="submit"
              disabled={!registrationNumber.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔍 Search
            </button>
          </div>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Recent Searches:
              </span>
              <button
                type="button"
                onClick={clearHistory}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((sbd, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleHistoryClick(sbd)}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {sbd}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default UserRegistration;
