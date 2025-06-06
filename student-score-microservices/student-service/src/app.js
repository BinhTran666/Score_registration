const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const logger = require('./utils/logger');
const database = require('./database/connection');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for CSV files (changed from uploads)
app.use('/csv-files', express.static(path.join(__dirname, '../csv-files')));

// Health check
app.get('/health', async (req, res) => {
  try {
    await database.testConnection();
    res.json({ 
      status: 'OK', 
      service: 'student-service',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'student-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Routes
const studentRoutes = require('./routes/students');
const csvRoutes = require('./routes/csv');

app.use('/api/students', studentRoutes);
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
    path: req.originalUrl
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await database.closeConnection();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await database.closeConnection();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`Student service is running on port ${PORT}`);
  logger.info('Available endpoints:');
  logger.info('- GET /health');
  logger.info('- GET /api/students');
  logger.info('- GET /api/students/:sbd');
  logger.info('- POST /api/students');
  logger.info('- PUT /api/students/:sbd');
  logger.info('- DELETE /api/students/:sbd');
  logger.info('- GET /api/students/subject/:subject/scores?minScore=8');
  logger.info('- GET /api/students/subject/:subject/statistics');
  logger.info('- GET /api/csv/files');
  logger.info('- GET /api/csv/validate/:filename');
  logger.info('- GET /api/csv/preview/:filename');
  logger.info('- POST /api/csv/process/:filename');
});

module.exports = app;