const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const logger = require('./utils/logger');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'report-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'Subject Statistics (4 Score Levels)',
      'Chart Data Generation',
      'Performance Analytics by Category'
    ],
    database: 'Connected'
  });
});

// API Routes
app.use('/api/reports', reportRoutes);

// Schedule automatic statistics calculation (every 2 hours in production)
if (process.env.ENABLE_CRON === 'true' && process.env.NODE_ENV === 'production') {
  const ReportService = require('./services/ReportService');
  const reportService = new ReportService();
  
  cron.schedule('0 */2 * * *', async () => {
    try {
      logger.info('Starting scheduled statistics calculation...');
      await reportService.updateAllStatistics();
      logger.info('Scheduled statistics calculation completed');
    } catch (error) {
      logger.error('Error in scheduled statistics calculation:', error);
    }
  });
  
  logger.info('📅 Cron job scheduled: Statistics calculation every 2 hours');
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    service: 'report-service',
    available_endpoints: [
      'GET /health',
      'GET /api/reports/statistics/chart',
      'GET /api/reports/statistics/subject/:subjectCode',
      'GET /api/reports/statistics/summary',
      'GET /api/reports/performance/overview',
      'POST /api/reports/statistics/calculate',
      'POST /api/reports/initialize'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🎯 Report Service running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
  logger.info('📊 Available endpoints:');
  logger.info('- GET /api/reports/statistics/chart (Chart data for all subjects)');
  logger.info('- GET /api/reports/statistics/subject/:code (Subject details)');
  logger.info('- GET /api/reports/statistics/summary (Complete summary)');
  logger.info('- GET /api/reports/performance/overview (Performance by category)');
  logger.info('- POST /api/reports/statistics/calculate (Update statistics)');
  logger.info('- POST /api/reports/initialize (Initialize system)');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;