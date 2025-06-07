const SubjectStatistics = require('../models/SubjectStatistic');
const StatisticsCalculator = require('./statisticCalculatorService');
const Subjects = require('../config/subjectConfig');
const ScoreLevels = require('../config/scoreConfig');
const logger = require('../utils/logger');

class ReportService {
  constructor() {
    this.calculator = new StatisticsCalculator();
    this.subjects = Subjects.getAllSubjects();
    this.levels = ScoreLevels.getAllLevels();
  }

  // Get chart data for all subjects with 4 score levels
  async getSubjectStatisticsChart() {
    try {
      logger.info('Generating subject statistics chart data...');
      
      const allStats = await SubjectStatistics.getAll();
      
      // Group statistics by subject
      const chartData = {
        subjects: [],
        levels: this.levels.map(level => ({
          code: level.code,
          name: level.name,
          color: level.color,
          bgColor: level.bgColor,
          icon: level.icon,
          description: level.description
        })),
        data: [],
        metadata: {
          total_subjects: this.subjects.length,
          score_levels: this.levels.length,
          generated_at: new Date().toISOString()
        }
      };

      // Process each subject
      for (const subject of this.subjects) {
        const subjectStats = allStats.filter(stat => stat.subjectCode === subject.code);
        
        const subjectData = {
          code: subject.code,
          name: subject.name,
          icon: subject.icon,
          color: subject.color,
          category: subject.category,
          total_students: 0,
          levels: {}
        };

        // Process each level for this subject
        for (const level of this.levels) {
          const levelStat = subjectStats.find(stat => stat.scoreLevel === level.code);
          const count = levelStat ? levelStat.studentCount : 0;
          const percentage = levelStat ? levelStat.percentage : 0;
          
          subjectData.levels[level.code] = {
            count: count,
            percentage: percentage
          };
          
          subjectData.total_students += count;
        }

        chartData.subjects.push(subject);
        chartData.data.push(subjectData);
      }

      logger.info('Chart data generated successfully');
      return chartData;
    } catch (error) {
      logger.error('Error generating chart data:', error);
      throw new Error(`Failed to generate chart data: ${error.message}`);
    }
  }

  // Get detailed statistics for a specific subject
  async getSubjectDetails(subjectCode) {
    try {
      const subject = Subjects.getSubject(subjectCode);
      if (!subject) {
        throw new Error(`Invalid subject code: ${subjectCode}`);
      }

      const stats = await SubjectStatistics.getBySubject(subjectCode);
      
      const totalStudents = stats.reduce((sum, stat) => sum + stat.studentCount, 0);
      
      return {
        subject: subject,
        total_students: totalStudents,
        levels: stats.map(stat => ({
          ...stat.toJSON(),
          level_info: ScoreLevels.getLevelByCode(stat.scoreLevel)
        })),
        calculated_at: stats.length > 0 ? stats[0].calculatedAt : null
      };
    } catch (error) {
      logger.error(`Error getting subject details for ${subjectCode}:`, error);
      throw error;
    }
  }

  // Get statistics summary with category breakdown
  async getStatisticsSummary() {
    try {
      const [chartData, categoryStats] = await Promise.all([
        this.getSubjectStatisticsChart(),
        this.calculator.getStatisticsByCategory()
      ]);

      // Calculate overall summary
      const totalStudents = chartData.data.reduce((sum, subject) => sum + subject.total_students, 0);
      const averageStudentsPerSubject = Math.round(totalStudents / chartData.data.length);

      // Find best and worst performing subjects
      const subjectPerformance = chartData.data.map(subject => ({
        code: subject.code,
        name: subject.name,
        excellent_percentage: subject.levels.excellent?.percentage || 0,
        poor_percentage: subject.levels.poor?.percentage || 0,
        total_students: subject.total_students
      }));

      const bestSubject = subjectPerformance.reduce((best, current) => 
        current.excellent_percentage > best.excellent_percentage ? current : best
      );

      const worstSubject = subjectPerformance.reduce((worst, current) => 
        current.poor_percentage > worst.poor_percentage ? current : worst
      );

      return {
        summary: {
          total_students_analyzed: totalStudents,
          total_subjects: chartData.subjects.length,
          average_students_per_subject: averageStudentsPerSubject,
          best_performing_subject: bestSubject,
          worst_performing_subject: worstSubject,
          last_calculated: new Date().toISOString()
        },
        chart_data: chartData,
        category_breakdown: categoryStats,
        score_levels: this.levels
      };
    } catch (error) {
      logger.error('Error getting statistics summary:', error);
      throw error;
    }
  }

  // Update all statistics
  async updateAllStatistics() {
    try {
      logger.info('Starting statistics update...');
      const result = await this.calculator.calculateAllStatistics();
      logger.info('Statistics update completed');
      return result;
    } catch (error) {
      logger.error('Error updating statistics:', error);
      throw error;
    }
  }

  // Get performance overview by category
  async getPerformanceOverview() {
    try {
      const categoryStats = await this.calculator.getStatisticsByCategory();
      
      const overview = {};
      
      for (const [categoryKey, category] of Object.entries(categoryStats)) {
        const categoryOverview = {
          name: category.name,
          total_students: category.total_students,
          subjects_count: category.subjects.length,
          performance_summary: {
            excellent: 0,
            good: 0,
            average: 0,
            poor: 0
          }
        };

        // Aggregate performance across all subjects in category
        for (const subject of category.subjects) {
          for (const level of subject.levels) {
            categoryOverview.performance_summary[level.score_level] += level.student_count;
          }
        }

        // Calculate percentages
        const total = categoryOverview.total_students;
        if (total > 0) {
          Object.keys(categoryOverview.performance_summary).forEach(level => {
            const count = categoryOverview.performance_summary[level];
            categoryOverview.performance_summary[level] = {
              count: count,
              percentage: Math.round((count / total) * 100 * 100) / 100
            };
          });
        }

        overview[categoryKey] = categoryOverview;
      }

      return overview;
    } catch (error) {
      logger.error('Error getting performance overview:', error);
      throw error;
    }
  }
}

module.exports = ReportService;