const API_BASE_URL = 'http://localhost:3000/api/students';

export const studentAPI = {
  async getStudentBySbd(sbd) {
    try {
      const response = await fetch(`${API_BASE_URL}/${sbd}`);
      if (!response.ok) {
        throw new Error(`Student not found: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch student data');
    }
  }
};