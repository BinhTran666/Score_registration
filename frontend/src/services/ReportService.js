const API_BASE_URL = "http://localhost:3002/api";

export const reportAPI = {
  // Get statistics chart data for all subjects
  async getStatisticsChart() {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/statistics/chart`);
      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(error.message || "Failed to fetch statistics chart data");
    }
  },

  // Get statistics for a specific subject
  async getSubjectStatistics(subjectCode) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/reports/statistics/subject/${subjectCode}`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch subject statistics: ${response.status}`
        );
      }
      return await response.json();
    } catch (error) {
      throw new Error(error.message || "Failed to fetch subject statistics");
    }
  },

  // Get comprehensive statistics summary
  async getStatisticsSummary() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/reports/statistics/summary`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch statistics summary: ${response.status}`
        );
      }
      return await response.json();
    } catch (error) {
      throw new Error(error.message || "Failed to fetch statistics summary");
    }
  },

  // Get performance overview by category
  async getPerformanceOverview() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/reports/performance/overview`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch performance overview: ${response.status}`
        );
      }
      return await response.json();
    } catch (error) {
      throw new Error(error.message || "Failed to fetch performance overview");
    }
  },

  // Calculate/update all statistics
  async calculateStatistics() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/reports/statistics/calculate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to calculate statistics: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(error.message || "Failed to calculate statistics");
    }
  },

  // Initialize the report system
  async initializeReports() {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to initialize reports: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(error.message || "Failed to initialize reports");
    }
  },

  // Get service health check with detailed information
  async getDetailedHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/health/detailed`);
      if (!response.ok) {
        throw new Error(`Failed to fetch health status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(error.message || "Failed to fetch health status");
    }
  },

  // Get available subjects and score levels configuration
  async getConfig() {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/config`);
      if (!response.ok) {
        throw new Error(`Failed to fetch configuration: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(error.message || "Failed to fetch configuration");
    }
  },

  async getTopStudentsByGroup(groupCode = "A", limit = 10) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/reports/groups/${groupCode}/top-students?limit=${limit}`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch top students for group ${groupCode}: ${response.status}`
        );
      }
      return await response.json();
    } catch (error) {
      throw new Error(
        error.message || `Failed to fetch top students for group ${groupCode}`
      );
    }
  },
  async getGroupsConfig() {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/groups`);
      if (!response.ok) {
        throw new Error(`Failed to fetch groups config: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(error.message || "Failed to fetch groups configuration");
    }
  },
};
