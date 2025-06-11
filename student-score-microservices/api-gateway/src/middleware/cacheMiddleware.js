const cacheService = require("../services/cacheService");
const logger = require("../utils/logger");

// Cache configuration for different report endpoints
const CACHE_CONFIG = {
  'statistics/chart': { ttl: 300, vary: [] },
  'statistics/summary': { ttl: 300, vary: [] },
  'statistics/subject': { ttl: 300, vary: ['subjectCode'] },
  'performance/overview': { ttl: 600, vary: [] },
  'groups': { ttl: 900, vary: ['groupCode', 'limit'] },
  'config': { ttl: 3600, vary: [] },
  'health/detailed': { ttl: 60, vary: [] },
  
  //Student endpoints
  'students': { ttl: 1800, vary: ['sbd'] }, // 30 minutes cache for individual students
  'students/search': { ttl: 600, vary: ['query', 'limit', 'offset'] }, // 10 minutes for search results
};

// Check if endpoint should be cached
function shouldCache(req) {
  logger.info(`🔍 shouldCache() - Checking: ${req.method} ${req.originalUrl}`);
  
  if (req.method !== "GET") {
    logger.info(`❌ shouldCache() - Skip: Method ${req.method} not GET`);
    return false;
  }
  
  if (!req.originalUrl.includes("/api/reports/") && !req.originalUrl.includes("/api/students/")) {
    logger.info(`❌ shouldCache() - Skip: URL ${req.originalUrl} not in /api/reports/ or /api/students/`);
    return false;
  }
  
  logger.info(`✅ shouldCache() - Eligible: ${req.originalUrl}`);
  return true;
}

// Extract endpoint pattern from URL
function getEndpointPattern(url) {
  let path, apiType;
  
  // Handle both report and student APIs
  if (url.includes("/api/reports/")) {
    path = url.replace("/api/reports/", "").split("?")[0];
    apiType = "reports";
  } else if (url.includes("/api/students/")) {
    path = url.replace("/api/students/", "").split("?")[0];
    apiType = "students";
  } else {
    logger.info(`❌ getEndpointPattern() - Unsupported API type: ${url}`);
    return null;
  }
  
  logger.info(`🔍 getEndpointPattern() - Input URL: ${url}`);
  logger.info(`🔍 getEndpointPattern() - API Type: ${apiType}`);
  logger.info(`🔍 getEndpointPattern() - Extracted path: "${path}"`);
  logger.info(`🔍 getEndpointPattern() - Available patterns: [${Object.keys(CACHE_CONFIG).join(', ')}]`);

  // Handle student patterns
  if (apiType === "students") {
    // Check if it's a direct student ID lookup (e.g., "26020938")
    if (/^\d+$/.test(path)) {
      logger.info(`✅ getEndpointPattern() - Student ID pattern match: "${path}" matches "students"`);
      return "students";
    }
    
    // Check if it's a search endpoint (e.g., "search")
    if (path.startsWith("search")) {
      logger.info(`✅ getEndpointPattern() - Student search pattern match: "${path}" matches "students/search"`);
      return "students/search";
    }
  }

  // Handle report patterns
  if (apiType === "reports") {
    // Direct matches first
    if (CACHE_CONFIG[path]) {
      logger.info(`✅ getEndpointPattern() - Direct match found: "${path}"`);
      return path;
    }

    // Pattern matches - More specific matches first
    for (const pattern of Object.keys(CACHE_CONFIG)) {
      logger.info(`🔍 getEndpointPattern() - Testing pattern: "${pattern}" against path: "${path}"`);
      
      if (pattern.includes('/')) {
        // For patterns like "statistics/subject", check if path starts with the full pattern
        if (path.startsWith(pattern + '/') || path === pattern) {
          logger.info(`✅ getEndpointPattern() - Exact pattern match: "${path}" matches "${pattern}"`);
          return pattern;
        }
      } else {
        // For single-word patterns like "groups", check if path starts with pattern/
        if (path.startsWith(pattern + '/') || path === pattern) {
          logger.info(`✅ getEndpointPattern() - Single pattern match: "${path}" matches "${pattern}"`);
          return pattern;
        }
      }
      
      logger.info(`❌ getEndpointPattern() - No match: "${path}" does not match pattern "${pattern}"`);
    }
  }

  logger.info(`❌ getEndpointPattern() - No pattern match found for: "${path}"`);
  return null;
}

// Extract parameters from URL - ENHANCED
function extractParams(url, pattern) {
  logger.info(`🔍 extractParams() - URL: ${url}, Pattern: ${pattern}`);
  
  const urlObj = new URL(`http://localhost${url}`);
  const params = {};

  // Extract query parameters
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
    logger.info(`📋 extractParams() - Query param: ${key} = ${value}`);
  });

  // ✅ NEW: Extract path parameters for student endpoints
  if (url.includes("/api/students/")) {
    const path = url.replace("/api/students/", "").split("?")[0];
    const pathParts = path.split('/');

    if (pattern === 'students' && /^\d+$/.test(pathParts[0])) {
      params.sbd = pathParts[0]; // Extract "26020938" from "students/26020938"
      logger.info(`📋 extractParams() - Student ID param: sbd = ${params.sbd}`);
    }
    
    if (pattern === 'students/search') {
      // Query parameters are already extracted above
      logger.info(`📋 extractParams() - Search endpoint detected`);
    }
  }

  // ✅ EXISTING: Extract path parameters for report endpoints
  if (url.includes("/api/reports/")) {
    const path = url.replace("/api/reports/", "").split("?")[0];
    const pathParts = path.split('/');

    // Handle dynamic path segments
    if (pattern === 'statistics/subject' && pathParts.length === 3) {
      params.subjectCode = pathParts[2]; // Extract "toan" from "statistics/subject/toan"
      logger.info(`📋 extractParams() - Path param: subjectCode = ${params.subjectCode}`);
    }
    
    if (pattern === 'groups' && pathParts.length >= 2) {
      params.groupCode = pathParts[1]; // Extract "C" from "groups/C/top-students"
      logger.info(`📋 extractParams() - Path param: groupCode = ${params.groupCode}`);
      
      // Also extract the endpoint type if needed
      if (pathParts.length >= 3) {
        params.endpoint = pathParts[2]; // Extract "top-students" from "groups/C/top-students"
        logger.info(`📋 extractParams() - Path param: endpoint = ${params.endpoint}`);
      }
    }
  }

  logger.info(`📋 extractParams() - Final params:`, params);
  return params;
}

// Cache invalidation for mutations
function createCacheMiddleware() {
  return async (req, res, next) => {
    logger.info(`🚀 Cache middleware START - ${req.method} ${req.originalUrl}`);
    
    if (!shouldCache(req)) {
      logger.info(`⏭️ Cache middleware - Skipping (not cacheable)`);
      return next();
    }

    const endpointPattern = getEndpointPattern(req.originalUrl);
    if (!endpointPattern) {
      logger.info(`⏭️ Cache middleware - Skipping (no pattern match)`);
      return next();
    }

    logger.info(`🎯 Cache middleware - Pattern matched: "${endpointPattern}"`);
    
    const config = CACHE_CONFIG[endpointPattern];
    logger.info(`⚙️ Cache middleware - Config:`, config);
    
    const params = extractParams(req.originalUrl, endpointPattern);
    logger.info(`📋 Cache middleware - Extracted params:`, params);

    const relevantParams = {};
    config.vary.forEach((key) => {
      if (params[key]) {
        relevantParams[key] = params[key];
        logger.info(`🔑 Cache middleware - Adding vary param: ${key} = ${params[key]}`);
      } else {
        logger.info(`⚠️ Cache middleware - Vary param "${key}" not found in extracted params`);
      }
    });

    logger.info(`🔑 Cache middleware - Relevant params for cache key:`, relevantParams);

    const cacheKey = cacheService.generateCacheKey(endpointPattern, relevantParams);
    logger.info(`🔑 Cache middleware - Generated cache key: ${cacheKey}`);

    try {
      logger.info(`🔍 Cache middleware - Checking cache for key: ${cacheKey}`);
      const cachedData = await cacheService.get(cacheKey);

      if (cachedData) {
        logger.info(`✅ Cache HIT - Found cached data for: ${cacheKey}`);
        logger.info(`🔍 Cache HIT - Data structure:`, {
          dataType: typeof cachedData,
          isArray: Array.isArray(cachedData),
          keys: typeof cachedData === "object" ? Object.keys(cachedData) : "not object",
          dataPreview: JSON.stringify(cachedData).substring(0, 200) + "...",
        });

        res.set({
          "X-Cache": "HIT",
          "X-Cache-Key": cacheKey,
          "Cache-Control": `public, max-age=${config.ttl}`,
          "Content-Type": "application/json",
        });

        logger.info(`📤 Cache HIT - Returning cached data`);
        return res.json(cachedData);
      }

      logger.info(`❌ Cache MISS - No cached data found for: ${cacheKey}`);
      
      // Store cache info for proxy to handle
      res.locals.cacheInfo = { cacheKey, config };
      logger.info(`🔧 Cache MISS - Stored cache info for proxy`);
      
    } catch (error) {
      logger.error(`❌ Cache middleware error:`, error.message);
    }

    logger.info(`⏭️ Cache middleware - Calling next() for proxy`);
    next();
  };
}

function createCacheInvalidationMiddleware() {
  return async (req, res, next) => {
    logger.info(`🗑️ Cache invalidation middleware - ${req.method} ${req.originalUrl}`);
    
    if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
      logger.info(`🗑️ Mutation detected - Setting up cache invalidation`);
      
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      const handleInvalidation = async () => {
        if (res.statusCode >= 200 && res.statusCode < 300 && req.originalUrl.includes("/api/reports/")) {
          logger.info(`🗑️ Invalidating cache due to successful mutation`);
          
          try {
            await cacheService.clearReportCache();
            logger.info("✅ Cache cleared successfully due to mutation");
          } catch (error) {
            logger.error("❌ Cache clear error:", error.message);
          }
        }
      };

      res.json = function (data) {
        handleInvalidation();
        return originalJson(data);
      };

      res.send = function (data) {
        handleInvalidation();
        return originalSend(data);
      };
    } else {
      logger.info(`⏭️ Not a mutation, skipping invalidation setup`);
    }

    next();
  };
}

module.exports = {
  createCacheMiddleware,
  createCacheInvalidationMiddleware,
  CACHE_CONFIG,
};