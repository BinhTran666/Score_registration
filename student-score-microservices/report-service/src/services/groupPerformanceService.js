const StudentPerformanceCalculator = require('./studentPerformanceCalculator');
const GroupConfig = require('../config/groupConfig');
const logger = require('../utils/logger');

class GroupPerformanceService {
  
  // Get top students for any group
  async getTopStudentsByGroup(groupCode, limit = 10, options = {}) {
    try {
      const calculator = new StudentPerformanceCalculator(groupCode);
      return await calculator.getTopStudents(limit, options);
    } catch (error) {
      logger.error(`Error in getTopStudentsByGroup for ${groupCode}:`, error);
      throw error;
    }
  }

  // Get statistics for any group
  async getGroupStatistics(groupCode) {
    try {
      const calculator = new StudentPerformanceCalculator(groupCode);
      return await calculator.getGroupStatistics();
    } catch (error) {
      logger.error(`Error in getGroupStatistics for ${groupCode}:`, error);
      throw error;
    }
  }

  // Compare multiple groups
  async compareGroups(groupCodes, limit = 10) {
    try {
      const results = {};
      
      for (const groupCode of groupCodes) {
        const [topStudents, statistics] = await Promise.all([
          this.getTopStudentsByGroup(groupCode, limit),
          this.getGroupStatistics(groupCode)
        ]);
        
        results[groupCode] = {
          top_students: topStudents,
          statistics: statistics
        };
      }

      return {
        comparison: results,
        groups_compared: groupCodes,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error in compareGroups:', error);
      throw error;
    }
  }

  // Get all available groups with their configurations
  getAvailableGroups() {
    return {
      groups: GroupConfig.getAllGroups(),
      total_groups: GroupConfig.getAvailableGroups().length
    };
  }

  // Get top performers across all groups
  async getTopPerformersAllGroups(limit = 10) {
    try {
      const allGroups = GroupConfig.getAvailableGroups();
      const results = {};

      for (const groupCode of allGroups) {
        results[groupCode] = await this.getTopStudentsByGroup(groupCode, limit);
      }

      return {
        all_groups: results,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error in getTopPerformersAllGroups:', error);
      throw error;
    }
  }
}

module.exports = GroupPerformanceService;