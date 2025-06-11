const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('../utils/logger');

// Student Service Proxy Configuration
const studentServiceProxy = createProxyMiddleware({
  target: process.env.STUDENT_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/students': '/api/students'
  },
  timeout: 60000,
  proxyTimeout: 60000,
  selfHandleResponse: true, // Handle response
  onError: (err, req, res) => {
    logger.error('Student service proxy error:', err.message);
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        message: 'Student service is currently unavailable',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Service unavailable'
      });
    }
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('🔗 Proxying to student-service', {
      method: req.method,
      originalUrl: req.originalUrl,
      hasCacheInfo: !!res.locals.cacheInfo
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info('📡 Proxy response from student-service', {
      statusCode: proxyRes.statusCode,
      contentType: proxyRes.headers['content-type'],
      hasCacheInfo: !!res.locals.cacheInfo
    });

    // Set response status code
    res.statusCode = proxyRes.statusCode;
    
    // Copy headers from proxy response (except content-encoding)
    Object.keys(proxyRes.headers).forEach(key => {
      if (key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, proxyRes.headers[key]);
      }
    });

    // Buffer the response body
    let body = '';
    proxyRes.on('data', (chunk) => {
      body += chunk;
    });

    proxyRes.on('end', () => {
      logger.info(`📦 Student proxy complete response - size: ${body.length}, status: ${proxyRes.statusCode}`);
      
      // Handle caching if cache middleware set up cache info
      if (res.locals.cacheInfo && proxyRes.statusCode >= 200 && proxyRes.statusCode < 300 && body) {
        const { cacheKey, config } = res.locals.cacheInfo;
        
        try {
          const responseData = JSON.parse(body);
          
          logger.info(`💾 Student proxy caching response for key: ${cacheKey}`);
          logger.info(`🔍 Student proxy response data structure:`, {
            dataType: typeof responseData,
            isArray: Array.isArray(responseData),
            keys: typeof responseData === 'object' ? Object.keys(responseData) : 'not object',
            dataPreview: JSON.stringify(responseData).substring(0, 200) + '...'
          });
          
          // Import cache service
          const cacheService = require('../services/cacheService');
          
          // Cache the response asynchronously
          cacheService.set(cacheKey, responseData, config.ttl)
            .then(() => {
              logger.info(`✅ Student proxy cached successfully: ${cacheKey} (TTL: ${config.ttl}s)`);
            })
            .catch(error => {
              logger.error('❌ Student proxy cache error:', error.message);
            });
          
          // Add cache headers
          res.setHeader('X-Cache', 'MISS');
          res.setHeader('X-Cache-Key', cacheKey);
          res.setHeader('Cache-Control', `public, max-age=${config.ttl}`);
          
          logger.info(`📤 Student proxy added cache headers (MISS)`);
          
        } catch (e) {
          logger.error('❌ Student proxy response not JSON:', e.message);
          logger.error('❌ Student response body preview:', body.substring(0, 500));
        }
      } else {
        logger.info(`⚠️ Student proxy not caching: hasCacheInfo=${!!res.locals.cacheInfo}, status=${proxyRes.statusCode}, hasBody=${!!body}`);
      }
      
      // Send the response to client
      res.end(body);
      logger.info(`📤 Student proxy response sent to client`);
    });

    proxyRes.on('error', (err) => {
      logger.error('❌ Student proxy response error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Proxy response error' });
      }
    });
  }
});

// Report Service Proxy Configuration - WITH RESPONSE HANDLING
const reportServiceProxy = createProxyMiddleware({
  target: process.env.REPORT_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/reports': '/api/reports'
  },
  timeout: 60000,
  proxyTimeout: 60000,
  selfHandleResponse: true, // IMPORTANT: We handle the response ourselves
  onError: (err, req, res) => {
    logger.error('Report service proxy error:', err.message);
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        message: 'Report service is currently unavailable',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Service unavailable'
      });
    }
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('🔗 Proxying to report-service', {
      method: req.method,
      originalUrl: req.originalUrl,
      hasCacheInfo: !!res.locals.cacheInfo
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info('📡 Proxy response from report-service', {
      statusCode: proxyRes.statusCode,
      contentType: proxyRes.headers['content-type'],
      hasCacheInfo: !!res.locals.cacheInfo
    });

    // Set response status code
    res.statusCode = proxyRes.statusCode;
    
    // Copy headers from proxy response (except content-encoding to avoid issues)
    Object.keys(proxyRes.headers).forEach(key => {
      if (key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, proxyRes.headers[key]);
      }
    });

    // Buffer the response body
    let body = '';
    proxyRes.on('data', (chunk) => {
      body += chunk;
    });

    proxyRes.on('end', () => {
      logger.info(`📦 Proxy complete response - size: ${body.length}, status: ${proxyRes.statusCode}`);
      
      // Handle caching if cache middleware set up cache info
      if (res.locals.cacheInfo && proxyRes.statusCode >= 200 && proxyRes.statusCode < 300 && body) {
        const { cacheKey, config } = res.locals.cacheInfo;
        
        try {
          const responseData = JSON.parse(body);
          
          logger.info(`💾 Proxy caching response for key: ${cacheKey}`);
          logger.info(`🔍 Proxy response data structure:`, {
            dataType: typeof responseData,
            isArray: Array.isArray(responseData),
            keys: typeof responseData === 'object' ? Object.keys(responseData) : 'not object',
            dataPreview: JSON.stringify(responseData).substring(0, 200) + '...'
          });
          
          // Import cache service
          const cacheService = require('../services/cacheService');
          
          // Cache the response asynchronously
          cacheService.set(cacheKey, responseData, config.ttl)
            .then(() => {
              logger.info(`✅ Proxy cached successfully: ${cacheKey} (TTL: ${config.ttl}s)`);
            })
            .catch(error => {
              logger.error('❌ Proxy cache error:', error.message);
            });
          
          // Add cache headers
          res.setHeader('X-Cache', 'MISS');
          res.setHeader('X-Cache-Key', cacheKey);
          res.setHeader('Cache-Control', `public, max-age=${config.ttl}`);
          
          logger.info(`📤 Proxy added cache headers (MISS)`);
          
        } catch (e) {
          logger.error('❌ Proxy response not JSON:', e.message);
          logger.error('❌ Response body preview:', body.substring(0, 500));
        }
      } else {
        logger.info(`⚠️ Proxy not caching: hasCacheInfo=${!!res.locals.cacheInfo}, status=${proxyRes.statusCode}, hasBody=${!!body}`);
      }
      
      // Send the response to client
      res.end(body);
      logger.info(`📤 Proxy response sent to client`);
    });

    proxyRes.on('error', (err) => {
      logger.error('❌ Proxy response error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Proxy response error' });
      }
    });
  }
});

// CSV Service Proxy Configuration
const csvServiceProxy = createProxyMiddleware({
  target: process.env.CSV_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/csv': '/api/csv'
  },
  timeout: 60000,
  proxyTimeout: 60000,
  onError: (err, req, res) => {
    logger.error('CSV service proxy error:', err.message);
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        message: 'CSV service is currently unavailable',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Service unavailable'
      });
    }
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('🔗 Proxying to csv-service', {
      method: req.method,
      originalUrl: req.originalUrl
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info('📡 Proxy response from csv-service', {
      statusCode: proxyRes.statusCode
    });
  }
});

// Export all proxies
module.exports = {
  studentServiceProxy,
  reportServiceProxy,
  csvServiceProxy
};