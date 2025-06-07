const knex = require('../database/connection');
const SubjectStatistics = require('../models/SubjectStatistic');
const Subjects = require('../config/subjectConfig');
const ScoreLevels = require('../config/scoreConfig');
const logger = require('../utils/logger');

class StatisticsCalculator {
  constructor() {
    this.subjects = Subjects.getAllSubjects();
    this.levels = ScoreLevels.getAllLevels();
  }

  // Calculate statistics for all subjects by reading from students table
  async calculateAllStatistics() {
    logger.info('Starting calculation of all subject statistics from students table...');
    
    try {
      const results = [];
      
      // Check if students table exists and has data
      const studentCount = await this.getStudentTableCount();
      if (studentCount === 0) {
        throw new Error('No students found in database. Please import student data first.');
      }
      
      logger.info(`Found ${studentCount} students in database`);
      
      for (const subject of this.subjects) {
        const subjectStats = await this.calculateSubjectStatistics(subject.code);
        results.push(subjectStats);
      }
      
      logger.info('All statistics calculated successfully');
      return {
        success: true,
        total_students: studentCount,
        subjects_processed: results.length,
        calculated_at: new Date().toISOString(),
        results: results
      };
    } catch (error) {
      logger.error('Error calculating all statistics:', error);
      throw error;
    }
  }

  // Get total count from students table
  async getStudentTableCount() {
    try {
      const result = await knex('students').count('* as count').first();
      return parseInt(result.count) || 0;
    } catch (error) {
      logger.error('Error getting student count:', error);
      return 0;
    }
  }

  // Calculate statistics for a specific subject from students table
  async calculateSubjectStatistics(subjectCode) {
    logger.info(`Calculating statistics for subject: ${subjectCode}`);
    
    const subject = Subjects.getSubject(subjectCode);
    if (!subject) {
      throw new Error(`Invalid subject code: ${subjectCode}`);
    }

    try {
      // Get total students with scores for this subject from students table
      const totalStudents = await this.getTotalStudentsForSubject(subjectCode);
      
      if (totalStudents === 0) {
        logger.warn(`No students found for subject: ${subjectCode}`);
        // Still update the database with zero counts
        await this.updateZeroStatistics(subjectCode, subject.name);
        return { 
          subject: subjectCode, 
          subject_name: subject.name,
          total_students: 0, 
          levels: this.levels.map(level => ({ level: level.code, count: 0, percentage: 0 }))
        };
      }

      const levelStats = [];
      
      for (const level of this.levels) {
        const count = await this.getStudentCountForLevel(subjectCode, level);
        const percentage = totalStudents > 0 ? ((count / totalStudents) * 100) : 0;
        
        // Update subject_statistics table
        await SubjectStatistics.upsert({
          subject_code: subjectCode,
          subject_name: subject.name,
          score_level: level.code,
          min_score: level.minScore,
          max_score: level.maxScore,
          student_count: count,
          percentage: Math.round(percentage * 100) / 100
        });

        levelStats.push({
          level: level.code,
          level_name: level.name,
          count: count,
          percentage: Math.round(percentage * 100) / 100
        });
      }

      logger.info(`Statistics calculated for ${subjectCode}: ${totalStudents} total students`);
      
      return {
        subject: subjectCode,
        subject_name: subject.name,
        total_students: totalStudents,
        levels: levelStats
      };
    } catch (error) {
      logger.error(`Error calculating statistics for ${subjectCode}:`, error);
      throw error;
    }
  }

  // Update statistics with zero counts
  async updateZeroStatistics(subjectCode, subjectName) {
    try {
      for (const level of this.levels) {
        await SubjectStatistics.upsert({
          subject_code: subjectCode,
          subject_name: subjectName,
          score_level: level.code,
          min_score: level.minScore,
          max_score: level.maxScore,
          student_count: 0,
          percentage: 0
        });
      }
    } catch (error) {
      logger.error(`Error updating zero statistics for ${subjectCode}:`, error);
    }
  }

  // Get total students with valid scores for a subject from students table
  async getTotalStudentsForSubject(subjectCode) {
    try {
      const result = await knex('students')
        .count('* as count')
        .whereNotNull(subjectCode)
        .where(subjectCode, '>', 0)
        .first();
      
      return parseInt(result.count) || 0;
    } catch (error) {
      throw new Error(`Failed to get total students for ${subjectCode}: ${error.message}`);
    }
  }

  // Get student count for a specific score level from students table
  async getStudentCountForLevel(subjectCode, level) {
    try {
      let query = knex('students')
        .count('* as count')
        .whereNotNull(subjectCode)
        .where(subjectCode, '>', 0)
        .where(subjectCode, '>=', level.minScore);

      // Handle the highest level (no upper bound)
      if (level.maxScore < 10) {
        query = query.where(subjectCode, '<=', level.maxScore);
      }

      const result = await query.first();
      return parseInt(result.count) || 0;
    } catch (error) {
      throw new Error(`Failed to get count for level ${level.code}: ${error.message}`);
    }
  }

  // Get aggregated statistics by category
  async getStatisticsByCategory() {
    try {
      const allStats = await SubjectStatistics.getAll();
      const categories = {
        core: { name: 'Core Subjects', subjects: [], total_students: 0 },
        science: { name: 'Science Subjects', subjects: [], total_students: 0 },
        social: { name: 'Social Subjects', subjects: [], total_students: 0 }
      };

      // Group by category
      for (const subject of this.subjects) {
        const subjectStats = allStats.filter(stat => stat.subjectCode === subject.code);
        const totalStudents = subjectStats.reduce((sum, stat) => sum + stat.studentCount, 0);
        
        categories[subject.category].subjects.push({
          code: subject.code,
          name: subject.name,
          icon: subject.icon,
          color: subject.color,
          total_students: totalStudents,
          levels: subjectStats.map(stat => stat.toJSON())
        });
        
        categories[subject.category].total_students += totalStudents;
      }

      return categories;
    } catch (error) {
      throw new Error(`Failed to get statistics by category: ${error.message}`);
    }
  }
}

module.exports = StatisticsCalculator;