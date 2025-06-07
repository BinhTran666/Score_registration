const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const logger = require('./utils/logger');
const reportRoutes = require('./routes/reportRoutes');
const groupRoutes = require('./routes/groupRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

// Global state
global.reportServiceInitialized = false;
global.initializationInProgress = false;

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
    initialized: global.reportServiceInitialized,
    initialization_in_progress: global.initializationInProgress,
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
app.use('/api/reports/groups', groupRoutes);

// SIMPLIFIED WAITING FOR STUDENT DATA
async function waitForStudentData() {
  const maxWaitTime = 10 * 60 * 1000; // 10 minutes max
  const checkInterval = 10000; // Check every 10 seconds
  const minStudents = 800; // Minimum threshold
  
  const startTime = Date.now();
  let attempt = 1;
  
  logger.info('🔍 Waiting for student data to be available...');
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const knex = require('./database/connection');
      
      // Check if students table exists
      const studentsTableExists = await knex.schema.hasTable('students');
      if (!studentsTableExists) {
        logger.info(`⏳ Attempt ${attempt}: Students table does not exist yet...`);
        await sleep(checkInterval);
        attempt++;
        continue;
      }
      
      // Check total student count - simple check only
      const studentCountResult = await knex('students').count('* as count').first();
      const totalStudents = parseInt(studentCountResult.count);
      
      if (totalStudents >= minStudents) {
        logger.info(`✅ Student data ready! Found ${totalStudents} students`);
        return {
          ready: true,
          totalStudents,
          waitTime: Date.now() - startTime
        };
      }
      
      logger.info(`⏳ Attempt ${attempt}: Found ${totalStudents} students, waiting for at least ${minStudents}...`);
      
    } catch (error) {
      logger.warn(`⚠️ Attempt ${attempt}: Database check failed: ${error.message}`);
    }
    
    await sleep(checkInterval);
    attempt++;
  }
  
  // Timeout reached - proceed with whatever data we have
  logger.warn(`⚠️ Timeout reached after ${maxWaitTime/1000}s. Proceeding with available data...`);
  return {
    ready: false,
    timeout: true,
    waitTime: maxWaitTime
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// SAFE AUTO-INITIALIZATION
async function safeAutoInitialize() {
  if (global.initializationInProgress) {
    logger.info('⏭️ Initialization already in progress, skipping...');
    return;
  }
  
  global.initializationInProgress = true;
  
  try {
    logger.info('🔄 Starting safe auto-initialization...');
    
    // Step 1: Wait for student data
    const studentDataStatus = await waitForStudentData();
    
    // Step 2: Check if statistics already exist and are recent
    const knex = require('./database/connection');
    const statsCount = await knex('subject_statistics').count('* as count').first();
    const totalStats = parseInt(statsCount.count);
    
    if (totalStats > 0) {
      // Check if statistics are recent (within last 2 hours)
      const recentStats = await knex('subject_statistics')
        .where('calculated_at', '>', knex.raw("NOW() - INTERVAL '2 hours'"))
        .count('* as count')
        .first();
      
      if (parseInt(recentStats.count) > 0) {
        logger.info(`✅ Recent statistics found (${totalStats} records), skipping initialization`);
        global.reportServiceInitialized = true;
        global.initializationInProgress = false;
        return;
      }
    }
    
    // Step 3: Initialize if needed
    logger.info('🔧 Initializing report system...');
    
    const SubjectStatistics = require('./models/SubjectStatistic');
    const ReportService = require('./services/ReportService');
    
    // Initialize defaults
    await SubjectStatistics.initializeDefaults();
    logger.info('📋 Default statistics structure created');
    
    // Calculate actual statistics
    const reportService = new ReportService();
    const result = await reportService.updateAllStatistics();
    
    global.reportServiceInitialized = true;
    global.initializationInProgress = false;
    
    logger.info('✅ Auto-initialization completed successfully!');
    logger.info(`📊 Processed ${result.subjects_processed} subjects for ${result.total_students} students`);
    
    return result;
    
  } catch (error) {
    logger.error('❌ Auto-initialization failed:', error);
    global.reportServiceInitialized = false;
    global.initializationInProgress = false;
    throw error;
  }
}

// Schedule automatic updates
if (process.env.ENABLE_CRON === 'true') {
  cron.schedule('0 */2 * * *', async () => {
    if (global.reportServiceInitialized && !global.initializationInProgress) {
      try {
        logger.info('🔄 Running scheduled statistics update...');
        const ReportService = require('./services/ReportService');
        const reportService = new ReportService();
        await reportService.updateAllStatistics();
        logger.info('✅ Scheduled statistics update completed');
      } catch (error) {
        logger.error('❌ Scheduled statistics update failed:', error);
      }
    }
  });
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
    initialized: global.reportServiceInitialized
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🎯 Report Service running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
  
  // Start initialization in background (non-blocking)
  if (process.env.AUTO_INITIALIZE !== 'false') {
    logger.info('🔄 Starting background initialization...');
    setImmediate(() => {
      safeAutoInitialize().catch(error => {
        logger.error('Background initialization failed:', error);
        logger.info('💡 Manual initialization available: POST /api/reports/initialize');
      });
    });
  } else {
    logger.info('💡 Auto-initialization disabled. Manual init: POST /api/reports/initialize');
  }
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