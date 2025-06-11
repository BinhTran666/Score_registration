const Redis = require("ioredis");
const logger = require("../utils/logger");

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.config = {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB) || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
      lazyConnect: true,
    };

    this.defaultTTL = parseInt(process.env.CACHE_TTL) || 300; // 5 minutes default
    this.connect();
  }

  async connect() {
    try {
      this.redis = new Redis(this.config);

      this.redis.on("connect", () => {
        logger.info("🔗 Redis cache connected successfully");
        this.isConnected = true;
      });

      this.redis.on("error", (error) => {
        logger.error("❌ Redis connection error:", error.message);
        this.isConnected = false;
      });

      this.redis.on("close", () => {
        logger.warn("⚠️ Redis connection closed");
        this.isConnected = false;
      });

      this.redis.on("reconnecting", () => {
        logger.info("🔄 Redis reconnecting...");
      });

      // Test connection
      await this.redis.ping();
      logger.info("✅ Redis cache service initialized");
    } catch (error) {
      logger.error("❌ Failed to connect to Redis:", error.message);
      this.isConnected = false;
    }
  }

  // Generate cache key for reports
generateCacheKey(pattern, params = {}) {

  const baseKey = this.keyPrefix || 'api-gateway'; // Fallback if keyPrefix is undefined
  
  let apiType = "reports"; // default
  if (pattern === "students" || pattern.startsWith("students/")) {
    apiType = "students";
  }
  
  let key = `${baseKey}:${apiType}:${pattern}`;
  
  // Add parameters to the key
  const sortedParams = Object.keys(params).sort();
  sortedParams.forEach(paramKey => {
    if (params[paramKey]) {
      key += `:${paramKey}=${params[paramKey]}`;
    }
  });
  
  return key;
}

  // Get cached data
  async get(key) {
    if (!this.isConnected) {
      logger.debug("Cache not available, skipping get operation");
      return null;
    }

    try {
      const data = await this.redis.get(key);
      if (data) {
        logger.debug(`Cache HIT: ${key}`);
        return JSON.parse(data);
      }
      logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      logger.error("Cache get error:", error.message);
      return null;
    }
  }

  // Set cached data
  async set(key, data, ttl = this.defaultTTL) {
    if (!this.isConnected) {
      logger.debug("Cache not available, skipping set operation");
      return false;
    }

    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
      logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error("Cache set error:", error.message);
      return false;
    }
  }

  // Delete cached data
  async del(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.redis.del(key);
      logger.debug(`Cache DEL: ${key}`);
      return true;
    } catch (error) {
      logger.error("Cache delete error:", error.message);
      return false;
    }
  }

  // Delete all cache entries matching pattern
  async delPattern(pattern) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info(`Cache pattern DELETE: ${pattern} (${keys.length} keys)`);
      }
      return true;
    } catch (error) {
      logger.error("Cache pattern delete error:", error.message);
      return false;
    }
  }

  // Clear all report cache
  async clearReportCache() {
    return await this.delPattern("api-gateway:reports:*");
  }

  // Get cache statistics
  async getStats() {
    if (!this.isConnected) {
      return { connected: false };
    }

    try {
      const info = await this.redis.info("memory");
      const keyCount = await this.redis.dbsize();

      return {
        connected: this.isConnected,
        keyCount,
        memoryInfo: info,
        config: {
          host: this.config.host,
          port: this.config.port,
          db: this.config.db,
        },
      };
    } catch (error) {
      logger.error("Cache stats error:", error.message);
      return { connected: false, error: error.message };
    }
  }

  // Health check
  async healthCheck() {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;

      return {
        status: "healthy",
        latency: `${latency}ms`,
        connected: this.isConnected,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
        connected: false,
      };
    }
  }

  // Close connection
  async close() {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
      logger.info("Redis connection closed");
    }
  }
}

module.exports = new CacheService();
