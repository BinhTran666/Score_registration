const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('../utils/logger');
const healthChecker = require('../utils/healthCheck');

// Custom error handler for proxy
const proxyErrorHandler = (err, req, res, serviceName) => {
  logger.error(`Proxy error for ${serviceName}:`, {
    error: err.message,
    url: req.originalUrl,
    method: req.method
  });

  if (!res.headersSent) {
    res.status(503).json({
      success: false,
      message: `${serviceName} is currently unavailable`,
      error: process.env.NODE_ENV === 'development' ? err.message : 'Service unavailable',
      timestamp: new Date().toISOString(),
      gateway: 'api-gateway'
    });
  }
};

// Custom response interceptor
const responseInterceptor = (responseBuffer, proxyRes, req, res) => {
  const response = responseBuffer.toString('utf8');
  
  // Log response details
  logger.info('Proxy response', {
    statusCode: proxyRes.statusCode,
    method: req.method,
    url: req.originalUrl,
    responseSize: responseBuffer.length
  });

  return response;
};

// Student Service Proxy Configuration
const studentServiceProxy = createProxyMiddleware({
  target: process.env.STUDENT_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/students': '/api/students' // Keep the same path structure
  },
  timeout: 30000,
  proxyTimeout: 30000,
  onError: (err, req, res) => proxyErrorHandler(err, req, res, 'student-service'),
  onProxyReq: (proxyReq, req, res) => {
    // Log outgoing requests
    logger.info('Proxying to student-service', {
      method: req.method,
      originalUrl: req.originalUrl,
      targetUrl: proxyReq.path,
      userAgent: req.get('User-Agent')
    });

    // Add gateway headers
    proxyReq.setHeader('X-Forwarded-By', 'api-gateway');
    proxyReq.setHeader('X-Gateway-Version', '1.0.0');
  },
  onProxyRes: responseInterceptor,
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
});

// Report Service Proxy Configuration
const reportServiceProxy = createProxyMiddleware({
  target: process.env.REPORT_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/reports': '/api/reports' // Keep the same path structure
  },
  timeout: 60000, // Longer timeout for report generation
  proxyTimeout: 60000,
  onError: (err, req, res) => proxyErrorHandler(err, req, res, 'report-service'),
  onProxyReq: (proxyReq, req, res) => {
    // Log outgoing requests
    logger.info('Proxying to report-service', {
      method: req.method,
      originalUrl: req.originalUrl,
      targetUrl: proxyReq.path,
      userAgent: req.get('User-Agent')
    });

    // Add gateway headers
    proxyReq.setHeader('X-Forwarded-By', 'api-gateway');
    proxyReq.setHeader('X-Gateway-Version', '1.0.0');
  },
  onProxyRes: responseInterceptor,
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
});

// CSV Service Proxy (for report-service CSV endpoints)
const csvServiceProxy = createProxyMiddleware({
  target: process.env.REPORT_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/csv': '/api/csv' // Direct mapping to report service CSV endpoints
  },
  timeout: 120000, // Very long timeout for CSV processing
  proxyTimeout: 120000,
  onError: (err, req, res) => proxyErrorHandler(err, req, res, 'report-service-csv'),
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying to report-service CSV', {
      method: req.method,
      originalUrl: req.originalUrl,
      targetUrl: proxyReq.path
    });

    proxyReq.setHeader('X-Forwarded-By', 'api-gateway');
    proxyReq.setHeader('X-CSV-Proxy', 'true');
  },
  onProxyRes: responseInterceptor
});

module.exports = {
  studentServiceProxy,
  reportServiceProxy,
  csvServiceProxy
};