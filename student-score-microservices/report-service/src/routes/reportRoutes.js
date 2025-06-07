const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/report');

// Get statistics chart data for all subjects
router.get('/statistics/chart', ReportController.getStatisticsChart.bind(ReportController));

// Get statistics for a specific subject
router.get('/statistics/subject/:subjectCode', ReportController.getSubjectStatistics.bind(ReportController));

// Get comprehensive statistics summary
router.get('/statistics/summary', ReportController.getStatisticsSummary.bind(ReportController));

// Get performance overview by category
router.get('/performance/overview', ReportController.getPerformanceOverview.bind(ReportController));

// Calculate/update all statistics
router.post('/statistics/calculate', ReportController.calculateStatistics.bind(ReportController));

// Initialize the report system
router.post('/initialize', ReportController.initializeReports.bind(ReportController));

// Additional utility routes
router.get('/health/detailed', async (req, res) => {
  try {
    const knex = require('../database/connection');
    
    // Check database connection
    await knex.raw('SELECT 1');
    
    // Check if tables exist
    const studentsTableExists = await knex.schema.hasTable('students');
    const statisticsTableExists = await knex.schema.hasTable('subject_statistics');
    
    // Get counts
    const studentCount = studentsTableExists 
      ? await knex('students').count('* as count').first()
      : { count: 0 };
    
    const statsCount = statisticsTableExists 
      ? await knex('subject_statistics').count('* as count').first()
      : { count: 0 };
    
    res.json({
      success: true,
      service: 'report-service',
      database: {
        connected: true,
        tables: {
          students: {
            exists: studentsTableExists,
            count: parseInt(studentCount.count)
          },
          subject_statistics: {
            exists: statisticsTableExists,
            count: parseInt(statsCount.count)
          }
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'report-service',
      database: {
        connected: false,
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Get available subjects and score levels configuration
router.get('/config', (req, res) => {
  const Subjects = require('../config/Subjects');
  const ScoreLevels = require('../config/ScoreLevels');
  
  res.json({
    success: true,
    data: {
      subjects: Subjects.getAllSubjects(),
      score_levels: ScoreLevels.getAllLevels(),
      categories: {
        core: Subjects.getCoreSubjects(),
        science: Subjects.getScienceSubjects(),
        social: Subjects.getSocialSubjects()
      }
    },
    message: 'Configuration retrieved successfully'
  });
});

module.exports = router;