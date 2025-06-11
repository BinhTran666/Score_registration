const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const logger = require('./utils/logger');
const healthChecker = require('./utils/healthCheck');
const { studentServiceProxy, reportServiceProxy, csvServiceProxy } = require('./config/proxyConfig');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:8080'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log incoming request
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length')
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length')
    });
  });

  next();
});

// Health check endpoint for the gateway itself
app.get('/health', async (req, res) => {
  try {
    const serviceStatuses = await healthChecker.checkAllServices();
    const allServicesHealthy = Object.values(serviceStatuses).every(status => status);

    res.status(allServicesHealthy ? 200 : 503).json({
      status: allServicesHealthy ? 'OK' : 'DEGRADED',
      gateway: 'api-gateway',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        'student-service': {
          url: process.env.STUDENT_SERVICE_URL,
          status: healthChecker.getServiceStatus('student-service').status,
          healthy: serviceStatuses['student-service'],
          lastCheck: healthChecker.getServiceStatus('student-service').lastCheck
        },
        'report-service': {
          url: process.env.REPORT_SERVICE_URL,
          status: healthChecker.getServiceStatus('report-service').status,
          healthy: serviceStatuses['report-service'],
          lastCheck: healthChecker.getServiceStatus('report-service').lastCheck
        }
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Service status endpoint
app.get('/status', (req, res) => {
  const services = healthChecker.getAllServicesStatus();
  res.json({
    gateway: 'api-gateway',
    services,
    timestamp: new Date().toISOString()
  });
});

// Middleware to check service availability before proxying
const checkServiceAvailability = (serviceName) => {
  return (req, res, next) => {
    if (!healthChecker.isServiceHealthy(serviceName)) {
      logger.warn(`Request to unavailable service: ${serviceName}`, {
        url: req.originalUrl,
        method: req.method
      });
      
      return res.status(503).json({
        success: false,
        message: `${serviceName} is currently unavailable`,
        service: serviceName,
        timestamp: new Date().toISOString(),
        suggestion: 'Please try again later or check service status'
      });
    }
    next();
  };
};

// Proxy routes with service availability checks
app.use('/api/students', checkServiceAvailability('student-service'), studentServiceProxy);
app.use('/api/reports', checkServiceAvailability('report-service'), reportServiceProxy);
app.use('/api/csv', checkServiceAvailability('report-service'), csvServiceProxy);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Student Score Management API Gateway',
    version: '1.0.0',
    description: 'API Gateway for Student Score Management System',
    endpoints: {
      gateway: {
        health: 'GET /health - Gateway and services health status',
        status: 'GET /status - Detailed service status information',
        docs: 'GET /api - This documentation'
      },
      students: {
        base: '/api/students',
        description: 'Student management operations',
        service: 'student-service',
        examples: [
          'GET /api/students - List all students',
          'GET /api/students/:id - Get student by ID',
          'POST /api/students - Create new student',
          'PUT /api/students/:id - Update student',
          'DELETE /api/students/:id - Delete student'
        ]
      },
      reports: {
        base: '/api/reports',
        description: 'Reporting and analytics operations',
        service: 'report-service',
        examples: [
          'GET /api/reports/statistics - Get score statistics',
          'GET /api/reports/groups/:group - Get group performance',
          'GET /api/reports/top-students - Get top performing students'
        ]
      },
      csv: {
        base: '/api/csv',
        description: 'CSV data import and export operations',
        service: 'report-service',
        examples: [
          'GET /api/csv/files - List available CSV files',
          'POST /api/csv/process/:filename - Process CSV file',
          'GET /api/csv/preview/:filename - Preview CSV content'
        ]
      }
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    message: 'Route not found',
    gateway: 'api-gateway',
    availableRoutes: ['/health', '/status', '/api', '/api/students/*', '/api/reports/*', '/api/csv/*'],
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled gateway error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      message: 'Internal gateway error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  }
});

// Start server and health checking
app.listen(PORT, () => {
  logger.info(`🚀 API Gateway running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 Student Service: ${process.env.STUDENT_SERVICE_URL}`);
  logger.info(`📊 Report Service: ${process.env.REPORT_SERVICE_URL}`);
  
  // Start periodic health checks
  healthChecker.startPeriodicHealthChecks();
  
  logger.info('✅ API Gateway initialization completed');
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