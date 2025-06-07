const knex = require('../database/connection');
const GroupConfig = require('../config/groupConfig');
const Subjects = require('../config/subjectConfig');
const logger = require('../utils/logger');

class StudentPerformanceCalculator {
  constructor(groupCode) {
    this.groupConfig = GroupConfig.getGroup(groupCode);
    if (!this.groupConfig) {
      throw new Error(`Invalid group code: ${groupCode}`);
    }
  }

  // Calculate weighted average for a student in this group
  calculateWeightedAverage(studentScores) {
    const { subjects, weights } = this.groupConfig;
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let validSubjects = 0;

    for (const subject of subjects) {
      const score = studentScores[subject];
      if (score !== null && score !== undefined && score > 0) {
        const weight = weights[subject] || 1;
        totalWeightedScore += score * weight;
        totalWeight += weight;
        validSubjects++;
      }
    }

    // Must have minimum required subjects
    if (validSubjects < this.groupConfig.minSubjectsRequired) {
      return null;
    }

    return totalWeight > 0 ? (totalWeightedScore / totalWeight) : null;
  }

  // Get top students for this group
  async getTopStudents(limit = 10, options = {}) {
    try {
      const {
        minScore = 5.0,
        includeZeroScores = false,
        orderBy = 'weighted_average',
        direction = 'desc'
      } = options;

      logger.info(`Getting top ${limit} students for Group ${this.groupConfig.code}`);

      // Build the query
      let query = knex('students')
        .select('sbd', 'ho_ten', 'nam_sinh', 'gioi_tinh', ...this.groupConfig.subjects);

      // Add filters to ensure students have valid scores for this group
      if (!includeZeroScores) {
        for (const subject of this.groupConfig.subjects) {
          query = query.whereNotNull(subject).where(subject, '>', 0);
        }
      }

      // Get students data
      const students = await query;
      
      if (students.length === 0) {
        return {
          group: this.groupConfig,
          students: [],
          total_eligible: 0,
          message: `No students found with valid scores for Group ${this.groupConfig.code}`
        };
      }

      // Calculate weighted averages and ranking
      const studentsWithScores = students
        .map(student => {
          const weightedAverage = this.calculateWeightedAverage(student);
          
          if (weightedAverage === null || weightedAverage < minScore) {
            return null;
          }

          // Get individual subject details
          const subjectDetails = this.groupConfig.subjects.map(subjectCode => {
            const subject = Subjects.getSubject(subjectCode);
            return {
              code: subjectCode,
              name: subject ? subject.name : subjectCode,
              score: student[subjectCode],
              weight: this.groupConfig.weights[subjectCode] || 1
            };
          });

          return {
            sbd: student.sbd,
            ho_ten: student.ho_ten,
            nam_sinh: student.nam_sinh,
            gioi_tinh: student.gioi_tinh,
            weighted_average: Math.round(weightedAverage * 100) / 100,
            subjects: subjectDetails,
            total_score: subjectDetails.reduce((sum, s) => sum + (s.score || 0), 0),
            valid_subjects: subjectDetails.filter(s => s.score > 0).length
          };
        })
        .filter(student => student !== null)
        .sort((a, b) => {
          if (orderBy === 'weighted_average') {
            return direction === 'desc' ? b.weighted_average - a.weighted_average : a.weighted_average - b.weighted_average;
          } else if (orderBy === 'total_score') {
            return direction === 'desc' ? b.total_score - a.total_score : a.total_score - b.total_score;
          }
          return 0;
        })
        .slice(0, limit)
        .map((student, index) => ({
          ...student,
          rank: index + 1
        }));

      return {
        group: this.groupConfig,
        students: studentsWithScores,
        total_eligible: students.length,
        criteria: {
          min_score: minScore,
          min_subjects_required: this.groupConfig.minSubjectsRequired,
          order_by: orderBy,
          direction: direction
        },
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Error getting top students for Group ${this.groupConfig.code}:`, error);
      throw new Error(`Failed to get top students: ${error.message}`);
    }
  }

  // Get group statistics
  async getGroupStatistics() {
    try {
      const query = knex('students');
      
      // Add filters for this group's subjects
      for (const subject of this.groupConfig.subjects) {
        query.whereNotNull(subject).where(subject, '>', 0);
      }

      const students = await query.select('sbd', ...this.groupConfig.subjects);
      
      const eligibleStudents = students.filter(student => {
        return this.calculateWeightedAverage(student) !== null;
      });

      const weightedAverages = eligibleStudents.map(student => 
        this.calculateWeightedAverage(student)
      );

      if (weightedAverages.length === 0) {
        return {
          group: this.groupConfig,
          total_students: 0,
          average_score: 0,
          max_score: 0,
          min_score: 0
        };
      }

      return {
        group: this.groupConfig,
        total_students: eligibleStudents.length,
        average_score: Math.round((weightedAverages.reduce((sum, avg) => sum + avg, 0) / weightedAverages.length) * 100) / 100,
        max_score: Math.max(...weightedAverages),
        min_score: Math.min(...weightedAverages),
        score_distribution: this.calculateScoreDistribution(weightedAverages)
      };

    } catch (error) {
      logger.error(`Error getting Group ${this.groupConfig.code} statistics:`, error);
      throw error;
    }
  }

  // Calculate score distribution
  calculateScoreDistribution(scores) {
    const ranges = [
      { min: 8.0, max: 10.0, label: 'Excellent (8.0-10.0)' },
      { min: 6.5, max: 7.99, label: 'Good (6.5-7.99)' },
      { min: 5.0, max: 6.49, label: 'Average (5.0-6.49)' },
      { min: 0, max: 4.99, label: 'Below Average (<5.0)' }
    ];

    return ranges.map(range => {
      const count = scores.filter(score => score >= range.min && score <= range.max).length;
      return {
        ...range,
        count,
        percentage: scores.length > 0 ? Math.round((count / scores.length) * 100 * 100) / 100 : 0
      };
    });
  }
}

module.exports = StudentPerformanceCalculator;