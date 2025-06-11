const axios = require('axios');
const logger = require('./logger');

class ServiceHealthChecker {
  constructor() {
    this.services = {
      'student-service': {
        url: process.env.STUDENT_SERVICE_URL || 'http://localhost:3001',
        healthEndpoint: '/health',
        status: 'unknown',
        lastCheck: null,
        lastError: null
      },
      'report-service': {
        url: process.env.REPORT_SERVICE_URL || 'http://localhost:3002',
        healthEndpoint: '/health',
        status: 'unknown',
        lastCheck: null,
        lastError: null
      }
    };

    this.timeout = parseInt(process.env.SERVICE_TIMEOUT) || 5000;
    this.checkInterval = parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000;
  }

  async checkServiceHealth(serviceName) {
    const service = this.services[serviceName];
    if (!service) return false;

    try {
      const response = await axios.get(`${service.url}${service.healthEndpoint}`, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'API-Gateway-Health-Check'
        }
      });

      service.status = response.status === 200 ? 'healthy' : 'unhealthy';
      service.lastCheck = new Date();
      service.lastError = null;

      return service.status === 'healthy';
    } catch (error) {
      service.status = 'unhealthy';
      service.lastCheck = new Date();
      service.lastError = error.message;

      logger.warn(`Service ${serviceName} health check failed: ${error.message}`);
      return false;
    }
  }

  async checkAllServices() {
    const results = {};
    
    for (const serviceName of Object.keys(this.services)) {
      results[serviceName] = await this.checkServiceHealth(serviceName);
    }

    return results;
  }

  getServiceStatus(serviceName) {
    return this.services[serviceName] || null;
  }

  getAllServicesStatus() {
    return { ...this.services };
  }

  isServiceHealthy(serviceName) {
    const service = this.services[serviceName];
    return service && service.status === 'healthy';
  }

  startPeriodicHealthChecks() {
    logger.info(`🔄 Starting periodic health checks every ${this.checkInterval}ms`);
    
    // Initial check
    this.checkAllServices();

    // Periodic checks
    setInterval(async () => {
      await this.checkAllServices();
    }, this.checkInterval);
  }
}

module.exports = new ServiceHealthChecker();