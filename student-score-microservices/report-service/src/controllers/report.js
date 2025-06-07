const ReportService = require('../services/ReportService');
const SubjectStatistics = require('../models/SubjectStatistic');
const logger = require('../utils/logger');

class ReportController {
  constructor() {
    this.reportService = new ReportService();
  }

  // GET /api/reports/statistics/chart
  async getStatisticsChart(req, res) {
    try {
      logger.info('Getting statistics chart data...');
      const chartData = await this.reportService.getSubjectStatisticsChart();
      
      res.json({
        success: true,
        data: chartData,
        message: 'Statistics chart data retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting statistics chart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics chart',
        error: error.message
      });
    }
  }

  // GET /api/reports/statistics/subject/:subjectCode
  async getSubjectStatistics(req, res) {
    try {
      const { subjectCode } = req.params;
      logger.info(`Getting statistics for subject: ${subjectCode}`);
      
      const details = await this.reportService.getSubjectDetails(subjectCode);
      
      res.json({
        success: true,
        data: details,
        message: `Statistics for ${subjectCode} retrieved successfully`
      });
    } catch (error) {
      logger.error(`Error getting subject statistics for ${req.params.subjectCode}:`, error);
      res.status(400).json({
        success: false,
        message: 'Failed to retrieve subject statistics',
        error: error.message
      });
    }
  }

  // GET /api/reports/statistics/summary
  async getStatisticsSummary(req, res) {
    try {
      logger.info('Getting statistics summary...');
      const summary = await this.reportService.getStatisticsSummary();
      
      res.json({
        success: true,
        data: summary,
        message: 'Statistics summary retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting statistics summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics summary',
        error: error.message
      });
    }
  }

  // GET /api/reports/performance/overview
  async getPerformanceOverview(req, res) {
    try {
      logger.info('Getting performance overview...');
      const overview = await this.reportService.getPerformanceOverview();
      
      res.json({
        success: true,
        data: overview,
        message: 'Performance overview retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting performance overview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve performance overview',
        error: error.message
      });
    }
  }

  // POST /api/reports/statistics/calculate
  async calculateStatistics(req, res) {
    try {
      logger.info('Starting statistics calculation...');
      const result = await this.reportService.updateAllStatistics();
      
      res.json({
        success: true,
        data: result,
        message: 'Statistics calculated successfully'
      });
    } catch (error) {
      logger.error('Error calculating statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate statistics',
        error: error.message
      });
    }
  }

  // POST /api/reports/initialize
  async initializeReports(req, res) {
    try {
      logger.info('Initializing report system...');
      
      // Step 1: Initialize default statistics records
      await SubjectStatistics.initializeDefaults();
      
      // Step 2: Calculate statistics from students data
      const result = await this.reportService.updateAllStatistics();
      
      res.json({
        success: true,
        data: result,
        message: 'Report system initialized and statistics calculated successfully'
      });
    } catch (error) {
      logger.error('Error initializing reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize report system',
        error: error.message
      });
    }
  }
}

module.exports = new ReportController();