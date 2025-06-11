const express = require('express');
const cors = require('cors');
require('dotenv').config();

const logger = require('./utils/logger');

// Import routes
const reportRoutes = require('./routes/reportRoutes');
const groupRoutes = require('./routes/groupRoutes');
const csvRoutes = require('./routes/CsvRoute');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '100mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '100mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  const testMode = process.env.CSV_TEST_MODE === 'true';
  const testLines = parseInt(process.env.CSV_TEST_LINES) || 10000;
  
  res.json({
    status: 'OK',
    service: 'report-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME
    },
    testMode: {
      enabled: testMode,
      maxLines: testMode ? testLines : null
    },
    features: [
      'Statistical Analysis',
      'Group Performance Calculation',
      'CSV Data Import',
      'Performance Rankings',
      'Subject Statistics'
    ]
  });
});

// Routes
app.use('/api/reports', reportRoutes);
app.use('/api/reports/groups', groupRoutes);
app.use('/api/csv', csvRoutes);

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
    service: 'report-service'
  });
});

// Global initialization flags
global.reportServiceInitialized = false;
global.initializationInProgress = false;

// Auto-initialization function
async function safeAutoInitialize() {
  if (global.initializationInProgress) {
    logger.info('🔄 Initialization already in progress, skipping...');
    return;
  }

  global.initializationInProgress = true;

  try {
    logger.info('🚀 Starting report service auto-initialization...');
    logger.info(`📊 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    
    // Show TEST MODE status
    const testMode = process.env.CSV_TEST_MODE === 'true';
    const testLines = parseInt(process.env.CSV_TEST_LINES) || 10000;
    
    if (testMode) {
      logger.info(`🧪 TEST MODE ENABLED: Will process only ${testLines} lines from CSV files`);
    } else {
      logger.info(`🏭 PRODUCTION MODE: Will process all lines from CSV files`);
    }

    // Step 1: Test database connection
    const knex = require('./database/connection');
    await knex.raw('SELECT 1');
    logger.info('✅ Database connection successful');

    // Step 2: Check if we have students data
    const studentsCount = await knex('students').count('id as count').first();
    const totalStudents = parseInt(studentsCount.count);

    logger.info(`📊 Current students in report database: ${totalStudents}`);

    // Step 3: Auto-import CSV if enabled and no data exists
    if (process.env.AUTO_IMPORT_CSV === 'true' && totalStudents === 0) {
      const csvFilename = process.env.CSV_FILENAME || 'diem_thi_thpt_2024.csv';
      logger.info(`📥 Auto-importing CSV file: ${csvFilename}`);
      
      if (testMode) {
        logger.info(`🧪 TEST MODE: Will import only first ${testLines} records`);
      }
      
      try {
        const CsvService = require('./services/CsvService');
        const csvService = new CsvService();
        
        // Check if file exists
        const files = csvService.getAvailableFiles();
        const targetFile = files.find(f => f.filename === csvFilename);
        
        if (!targetFile) {
          logger.warn(`⚠️ CSV file ${csvFilename} not found in csv-files directory`);
          logger.info('📋 Available files:', files.map(f => f.filename));
        } else {
          logger.info(`📁 Processing CSV file: ${csvFilename} (${targetFile.sizeFormatted})`);
          const importResult = await csvService.processCSVFile(csvFilename);
          
          const modeInfo = importResult.testMode ? ` (TEST MODE - ${importResult.totalProcessed} lines processed)` : '';
          logger.info(`✅ CSV import completed${modeInfo}: ${importResult.validRecords} valid records, ${importResult.invalidRecords} invalid records`);
          
          if (importResult.importResult) {
            logger.info(`📊 Database import: ${importResult.importResult.inserted} inserted, ${importResult.importResult.updated} updated`);
          }

          // Update student count after import
          const newCount = await knex('students').count('id as count').first();
          logger.info(`📊 Total students after import: ${parseInt(newCount.count)}`);
        }
      } catch (csvError) {
        logger.error('❌ CSV import failed:', csvError.message);
        // Continue with initialization even if CSV import fails
      }
    }

    // Step 4: Check statistics
    const totalStats = await knex('subject_statistics').count('id as count').first();
    
    if (parseInt(totalStats.count) > 0) {
      const recentStats = await knex('subject_statistics')
        .count('id as count')
        .where('calculated_at', '>', knex.raw("NOW() - INTERVAL '1 day'"))
        .first();
      
      if (parseInt(recentStats.count) > 0) {
        logger.info('📊 Recent statistics found, skipping statistics initialization');
        global.reportServiceInitialized = true;
        global.initializationInProgress = false;
        return;
      }
    }
    
    // Step 5: Initialize report system
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
    
  } catch (error) {
    logger.error('❌ Auto-initialization failed:', error);
    global.reportServiceInitialized = false;
    global.initializationInProgress = false;
    
    // Don't throw error - let service start anyway
    logger.warn('⚠️ Service will start without full initialization');
  }
}

// Start server
app.listen(PORT, async () => {
  const testMode = process.env.CSV_TEST_MODE === 'true';
  const testLines = parseInt(process.env.CSV_TEST_LINES) || 10000;
  
  logger.info(`📊 Report Service running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🗄️ Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  
  // Show TEST MODE status at startup
  if (testMode) {
    logger.info(`🧪 TEST MODE: CSV processing limited to ${testLines} lines`);
  } else {
    logger.info(`🏭 PRODUCTION MODE: Full CSV processing enabled`);
  }
  
  // Auto-initialize if enabled
  if (process.env.AUTO_INITIALIZE === 'true') {
    logger.info('🔄 Auto-initialization enabled');
    // Use setTimeout to prevent blocking the server startup
    setTimeout(() => {
      safeAutoInitialize().catch(error => {
        logger.error('Auto-initialization error:', error);
      });
    }, 1000);
  } else {
    logger.info('ℹ️ Auto-initialization disabled. Set AUTO_INITIALIZE=true to enable.');
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