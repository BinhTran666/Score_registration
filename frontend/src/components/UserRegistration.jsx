import React, { useState } from 'react';

function UserRegistration() {
  const [registrationNumber, setRegistrationNumber] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!registrationNumber.trim()) {
      alert('Please enter a registration number.');
      return;
    }
    console.log('Submitting registration number:', registrationNumber);
    // Placeholder for API call
    alert(`Registration number submitted: ${registrationNumber}`);
    setRegistrationNumber(''); // Clear input after submission
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">User Registration</h3>
      <form onSubmit={handleSubmit}>
        <label htmlFor="regNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Registration Number:
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            id="regNumber"
            name="regNumber"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="Enter registration number"
            className="flex-grow mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <button
            type="submit"
            className="mt-1 px-6 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}

export default UserRegistration;