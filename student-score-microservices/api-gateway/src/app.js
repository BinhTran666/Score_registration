const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const logger = require('./utils/logger');
const healthChecker = require('./utils/healthCheck');
const cacheService = require('./services/cacheService');
const { createCacheMiddleware, createCacheInvalidationMiddleware } = require('./middleware/cacheMiddleware');
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control']
}));

// Body parsing middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length'),
    cacheControl: req.get('Cache-Control')
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      cacheStatus: res.get('X-Cache') || 'NONE'
    });
  });

  next();
});

// Health check endpoint for the gateway itself
app.get('/health', async (req, res) => {
  try {
    const serviceStatuses = await healthChecker.checkAllServices();
    const allServicesHealthy = Object.values(serviceStatuses).every(status => status);
    
    // Check cache health
    const cacheHealth = await cacheService.healthCheck();
    
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
      cache: cacheHealth,
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

// Cache management endpoints
app.get('/cache/stats', async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    res.json({
      success: true,
      cache: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get cache stats',
      error: error.message
    });
  }
});

app.delete('/cache/clear', async (req, res) => {
  try {
    const { pattern } = req.query;
    
    if (pattern) {
      await cacheService.delPattern(pattern);
      res.json({
        success: true,
        message: `Cache cleared for pattern: ${pattern}`,
        timestamp: new Date().toISOString()
      });
    } else {
      await cacheService.clearReportCache();
      res.json({
        success: true,
        message: 'Report cache cleared',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
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

// Apply cache middleware to report routes
const cacheMiddleware = createCacheMiddleware();
const cacheInvalidationMiddleware = createCacheInvalidationMiddleware();

// Proxy routes with caching
app.use('/api/students', 
  checkServiceAvailability('student-service'),
  createCacheMiddleware(),           // ✅ Add cache middleware
  createCacheInvalidationMiddleware(), // ✅ Add cache invalidation
  studentServiceProxy
);
app.use('/api/reports', 
  checkServiceAvailability('report-service'), 
  cacheMiddleware,
  cacheInvalidationMiddleware,
  reportServiceProxy
);
app.use('/api/csv', checkServiceAvailability('report-service'), csvServiceProxy);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Student Score Management API Gateway',
    version: '1.0.0',
    description: 'API Gateway for Student Score Management System with Redis Caching',
    features: ['Request Proxying', 'Health Monitoring', 'Redis Caching', 'Error Handling'],
    cache: {
      enabled: true,
      provider: 'Redis',
      defaultTTL: '5 minutes',
      management: {
        stats: 'GET /cache/stats',
        clear: 'DELETE /cache/clear'
      }
    },
    endpoints: {
      gateway: {
        health: 'GET /health - Gateway and services health status',
        status: 'GET /status - Detailed service status information',
        docs: 'GET /api - This documentation',
        cacheStats: 'GET /cache/stats - Cache statistics',
        cacheClear: 'DELETE /cache/clear - Clear cache'
      },
      students: {
        base: '/api/students',
        description: 'Student management operations',
        service: 'student-service',
        caching: 'No caching applied',
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
        caching: 'Redis caching enabled (5-60 minutes TTL)',
        cached_endpoints: [
          'GET /api/reports/statistics/chart - Cache: 5 min',
          'GET /api/reports/statistics/summary - Cache: 5 min',
          'GET /api/reports/statistics/subject/:code - Cache: 5 min',
          'GET /api/reports/performance/overview - Cache: 10 min',
          'GET /api/reports/groups - Cache: 15 min',
          'GET /api/reports/groups/:group/top-students - Cache: 15 min',
          'GET /api/reports/config - Cache: 1 hour'
        ]
      },
      csv: {
        base: '/api/csv',
        description: 'CSV data import and export operations',
        service: 'report-service',
        caching: 'No caching applied (real-time operations)',
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
    availableRoutes: ['/health', '/status', '/api', '/cache/stats', '/api/students/*', '/api/reports/*', '/api/csv/*'],
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
  logger.info(`🚀 API Gateway with Redis Cache running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 Student Service: ${process.env.STUDENT_SERVICE_URL}`);
  logger.info(`📊 Report Service: ${process.env.REPORT_SERVICE_URL}`);
  logger.info(`🗄️ Redis Cache: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
  
  // Start periodic health checks
  healthChecker.startPeriodicHealthChecks();
  
  logger.info('✅ API Gateway initialization completed');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await cacheService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await cacheService.close();
  process.exit(0);
});

module.exports = app;