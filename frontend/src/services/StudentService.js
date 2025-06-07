const API_BASE_URL = 'http://localhost:3001/api';

export const studentAPI = {
  async getStudentBySbd(sbd) {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${sbd}`);
      if (!response.ok) {
        throw new Error(`Student not found: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch student data');
    }
  }
};