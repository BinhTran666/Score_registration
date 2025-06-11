# Score Registration System

A comprehensive student score management and reporting system built with React frontend and Node.js microservices architecture with Redis caching and API Gateway.

## Youtube Demo Link Attempt-1
https://youtu.be/6qjdmxi5nkA
## Youtube Demo Link Attempt-2
https://youtu.be/IMHcBeoxMq8



## 🏗️ System Architecture

This project consists of:
- **Frontend**: React application with Vite (Port 3000)
- **API Gateway**: Centralized gateway with Redis caching (Port 3000)
- **Student Service**: Node.js microservice for student data management (Port 3001)
- **Report Service**: Node.js microservice for analytics and reporting (Port 3002)
- **CSV Service**: Node.js microservice for CSV processing (Port 3003)
- **Redis Cache**: High-performance caching layer (Port 6379)
- **Database**: PostgreSQL databases for data storage (Student DB: 5432, Report DB: 5433)
- **PgAdmin**: Database administration interface (Port 8080)

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed:

- **Docker** and **Docker Compose** (Recommended)
- **Node.js** (v18 or higher) - for local development
- **Git**

## 🚀 Quick Start with Docker (Recommended)

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Score_registration/student-score-microservices
```

### 2. Environment Setup

Create `.env` file in the `student-score-microservices` directory:

```env
# Network Configuration
NETWORK_NAME=student-scores-network

# Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=scores_student
POSTGRES_USER=student_user
POSTGRES_PASSWORD=student_password

POSTGRES_REPORT_HOST=postgres-report
POSTGRES_REPORT_PORT=5432
POSTGRES_REPORT_DB=scores_report
POSTGRES_REPORT_USER=report_user
POSTGRES_REPORT_PASSWORD=report_password

# Service URLs
STUDENT_SERVICE_URL=http://student-service:3001
REPORT_SERVICE_URL=http://report-service:3002
CSV_SERVICE_URL=http://csv-service:3003

# API Gateway Configuration
API_GATEWAY_PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Redis Configuration
REDIS_HOST=redis-cache
REDIS_PORT=6379
REDIS_PASSWORD=

# CSV Configuration
AUTO_IMPORT_CSV=true
CSV_TEST_MODE=false
CSV_STREAM_PROCESSING=true
CSV_BATCH_SIZE=500
MAX_FILE_SIZE=100mb
ENABLE_CRON=false

# PgAdmin Configuration
PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=admin
PGADMIN_PORT=8080

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

### 3. Start All Services

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api-gateway
docker-compose logs -f report-service
docker-compose logs -f student-service
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3000
- **PgAdmin**: http://localhost:8080 (admin@admin.com / admin)
- **Health Check**: http://localhost:3000/health

## 🗂️ Updated Project Structure

```
Score_registration/
├── frontend/                          # React Frontend Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── pages/                 # Page components
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Report.jsx
│   │   │   │   ├── SearchScores.jsx
│   │   │   │   └── Setting.jsx
│   │   │   ├── ui/                    # UI components
│   │   │   │   ├── MobileStudentCard.jsx
│   │   │   │   └── DesktopStudentTable.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── TopStudents.jsx
│   │   ├── services/
│   │   │   ├── reportService.js       # API service layer
│   │   │   └── studentService.js      # Student API service
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── student-score-microservices/       # Backend Microservices
│   ├── api-gateway/                   # 🆕 API Gateway with Redis Caching
│   │   ├── src/
│   │   │   ├── middleware/
│   │   │   │   ├── cacheMiddleware.js # Smart caching middleware
│   │   │   │   └── healthMiddleware.js
│   │   │   ├── services/
│   │   │   │   └── cacheService.js    # Redis cache service
│   │   │   ├── config/
│   │   │   │   └── proxyConfig.js     # Proxy configurations
│   │   │   ├── utils/
│   │   │   │   ├── logger.js
│   │   │   │   └── healthCheck.js
│   │   │   └── app.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── student-service/               # Student Data Management
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── repositories/
│   │   │   ├── routes/
│   │   │   ├── database/
│   │   │   └── utils/
│   │   ├── migrations/
│   │   ├── seeds/
│   │   ├── csv-files/                 # CSV data files
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── report-service/                # Analytics & Reporting
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── config/
│   │   │   ├── routes/
│   │   │   ├── database/
│   │   │   └── utils/
│   │   ├── migrations/
│   │   ├── seeds/
│   │   ├── csv-files/                 # 🆕 CSV files for report service
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── csv-service/                   # 🆕 Dedicated CSV Processing Service
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── app.js
│   │   ├── csv-files/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── docker-compose.yml             # 🆕 Complete Docker orchestration
│   └── .env                          # Environment configuration
```

## 🆕 New Features & Enhancements

### API Gateway with Intelligent Caching
- **Centralized Entry Point**: Single gateway for all API requests
- **Smart Redis Caching**: Automatic caching with configurable TTL
- **Cache Invalidation**: Automatic cache clearing on data mutations
- **Health Monitoring**: Real-time service health checks
- **Request Routing**: Intelligent routing to appropriate microservices

### Enhanced Caching Strategy
```javascript
// Cache Configuration
CACHE_CONFIG = {
  'statistics/chart': { ttl: 300, vary: [] },           // 5 minutes
  'statistics/summary': { ttl: 300, vary: [] },         // 5 minutes  
  'statistics/subject': { ttl: 300, vary: ['subjectCode'] }, // 5 minutes
  'performance/overview': { ttl: 600, vary: [] },       // 10 minutes
  'groups': { ttl: 900, vary: ['groupCode', 'limit'] }, // 15 minutes
  'config': { ttl: 3600, vary: [] },                    // 1 hour
  'students': { ttl: 1800, vary: ['sbd'] },             // 30 minutes
  'students/search': { ttl: 600, vary: ['query', 'limit', 'offset'] } // 10 minutes
}
```

### Microservices Architecture
- **Service Isolation**: Each service runs independently
- **Horizontal Scaling**: Services can be scaled individually
- **Fault Tolerance**: Service failures don't affect other components
- **Load Balancing**: Built-in Docker load balancing

### Database Separation
- **Student Database**: Dedicated PostgreSQL for student data
- **Report Database**: Separate PostgreSQL for analytics data
- **Data Isolation**: Enhanced security and performance

## 🌐 Updated API Endpoints

All requests now go through the API Gateway at `http://localhost:3000`

### Student Endpoints (Cached)
```
GET    /api/students/:sbd                # Get student by ID (30min cache)
GET    /api/students/search              # Search students (10min cache)
GET    /api/students                     # Get all students (paginated)
POST   /api/students                     # Create student (invalidates cache)
PUT    /api/students/:sbd                # Update student (invalidates cache)
DELETE /api/students/:sbd                # Delete student (invalidates cache)
```

### Report Endpoints (Cached)
```
GET    /api/reports/statistics/chart     # Chart data (5min cache)
GET    /api/reports/statistics/summary   # Summary stats (5min cache)
GET    /api/reports/statistics/subject/:code # Subject stats (5min cache)
GET    /api/reports/performance/overview # Performance overview (10min cache)
GET    /api/reports/groups/:code/top-students # Top students (15min cache)
GET    /api/reports/groups               # Groups config (1hour cache)
GET    /api/reports/config               # System config (1hour cache)
```

### CSV Processing Endpoints
```
GET    /api/csv/files                    # List CSV files
POST   /api/csv/process/:filename        # Process CSV file
GET    /api/csv/preview/:filename        # Preview CSV content
```

### Cache Management Endpoints
```
GET    /cache/stats                      # Cache statistics
DELETE /cache/clear                      # Clear all cache
GET    /health                          # System health check
GET    /status                          # Detailed status
```

## 🔧 Docker Services Configuration

### Services Overview
```yaml
services:
  api-gateway:      # Port 3000 - Main entry point
  student-service:  # Port 3001 - Student management
  report-service:   # Port 3002 - Analytics & reporting
  csv-service:      # Port 3003 - CSV processing
  redis-cache:      # Port 6379 - Caching layer
  postgres:         # Port 5432 - Student database
  postgres-report:  # Port 5433 - Report database  
  pgadmin:         # Port 8080 - Database admin
```

### Volume Management
```bash
# List all volumes
docker volume ls

# Remove specific volumes for fresh start
docker volume rm student-score-microservices_redis_data           # Clear cache
docker volume rm student-score-microservices_postgres_report_data # Clear report DB
docker volume rm student-score-microservices_postgres_data        # Clear student DB

# Complete reset
docker-compose down -v  # Removes all volumes
```

## 📊 Enhanced Features

### Performance Optimizations
- **Redis Caching**: Sub-second response times for cached data
- **Connection Pooling**: Optimized database connections
- **Batch Processing**: Efficient CSV import with configurable batch sizes
- **Memory Management**: Optimized for large datasets

### Monitoring & Logging
- **Centralized Logging**: Structured logging across all services
- **Health Checks**: Real-time service monitoring
- **Cache Metrics**: Detailed cache hit/miss statistics
- **Performance Tracking**: Request timing and performance metrics

### Cache Headers
All cached responses include informative headers:
```
X-Cache: HIT|MISS
X-Cache-Key: api-gateway:reports:statistics/chart
Cache-Control: public, max-age=300
```

## 🛠️ Development Commands

### Docker Management
```bash
# Start all services
docker-compose up -d

# View logs (all services)
docker-compose logs -f

# View specific service logs
docker-compose logs -f api-gateway
docker-compose logs -f redis-cache

# Restart specific service
docker-compose restart api-gateway

# Scale services
docker-compose up -d --scale report-service=2

# Stop all services
docker-compose down

# Complete cleanup
docker-compose down -v
docker system prune -f
```

### Cache Management
```bash
# Clear Redis cache
docker-compose exec redis-cache redis-cli FLUSHALL

# View cache keys
docker-compose exec redis-cache redis-cli KEYS "*"

# Monitor cache activity
docker-compose exec redis-cache redis-cli MONITOR

# Cache statistics via API
curl http://localhost:3000/cache/stats
```

### Database Management
```bash
# Access student database
docker-compose exec postgres psql -U student_user -d scores_student

# Access report database  
docker-compose exec postgres-report psql -U report_user -d scores_report

# Run migrations
docker-compose exec student-service npm run migrate
docker-compose exec report-service npm run migrate
```

## 🧪 Testing Cache Performance

### Cache Hit Testing
```bash
# First request (should be MISS)
curl -I http://localhost:3000/api/reports/statistics/chart

# Second request (should be HIT)
curl -I http://localhost:3000/api/reports/statistics/chart

# Check response headers for cache status
curl -H "Accept: application/json" http://localhost:3000/api/reports/statistics/chart
```

### Load Testing
```bash
# Test concurrent requests
for i in {1..10}; do
  curl http://localhost:3000/api/reports/statistics/summary &
done
wait

# Monitor cache performance
curl http://localhost:3000/cache/stats
```

## 🔍 Troubleshooting

### Common Docker Issues

1. **Services Not Starting**
   ```bash
   # Check service status
   docker-compose ps
   
   # View detailed logs
   docker-compose logs api-gateway
   ```

2. **Cache Not Working**
   ```bash
   # Check Redis connection
   docker-compose exec redis-cache redis-cli ping
   
   # View cache middleware logs
   docker-compose logs -f api-gateway | grep -i cache
   ```

3. **Database Connection Issues**
   ```bash
   # Check database connectivity
   docker-compose exec postgres pg_isready
   docker-compose exec postgres-report pg_isready
   ```

4. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :3000
   
   # Modify ports in docker-compose.yml if needed
   ```

### Performance Troubleshooting

1. **Slow Response Times**
   - Check cache hit ratio: `curl http://localhost:3000/cache/stats`
   - Monitor Redis: `docker-compose exec redis-cache redis-cli INFO stats`
   - Check service logs for bottlenecks

2. **Memory Issues**
   - Monitor container memory: `docker stats`
   - Check Redis memory usage: `docker-compose exec redis-cache redis-cli INFO memory`

3. **Database Performance**
   - Monitor database connections
   - Check query performance in logs
   - Consider adding database indexes

## 🚀 Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
LOG_LEVEL=warn
REDIS_PASSWORD=your-secure-password
POSTGRES_PASSWORD=your-secure-password
API_GATEWAY_CORS_ORIGIN=https://yourdomain.com
```

### Security Considerations
- Change default passwords in production
- Enable Redis authentication
- Use environment-specific configurations
- Implement proper CORS policies
- Add rate limiting
- Enable HTTPS

### Scaling Recommendations
```yaml
# Scale services based on load
services:
  api-gateway:
    deploy:
      replicas: 2
  report-service:
    deploy:
      replicas: 3
  student-service:
    deploy:
      replicas: 2
```

## 📈 Performance Metrics

### Cache Performance
- **Cache Hit Ratio**: Target >80% for frequently accessed data
- **Response Time**: <100ms for cached responses
- **Memory Usage**: Monitor Redis memory consumption

### Database Performance
- **Connection Pool**: Optimized for concurrent requests
- **Query Performance**: Indexed queries for fast retrieval
- **Batch Processing**: Configurable batch sizes for imports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test with Docker: `docker-compose up --build`
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔄 Version History

- **v1.0.0**: Initial release with basic student management and reporting
- **v1.1.0**: Added group performance analysis and optimized queries
- **v1.2.0**: Enhanced frontend with responsive design and charts
- **v2.0.0**: 🆕 **Major Release** - Added API Gateway, Redis caching, microservices architecture
  - API Gateway with intelligent caching
  - Redis caching layer with automatic invalidation
  - Separate databases for student and report services
  - CSV processing microservice
  - Docker containerization
  - Enhanced monitoring and logging
  - Performance optimizations

## 👥 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review Docker logs: `docker-compose logs -f`
- Check service health: `curl http://localhost:3000/health`
- Monitor cache performance: `curl http://localhost:3000/cache/stats`