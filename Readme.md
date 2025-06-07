# Score Registration System

A comprehensive student score management and reporting system built with React frontend and Node.js microservices architecture.

## Youtube Demo Link
https://youtu.be/6qjdmxi5nkA

## 🏗️ System Architecture

This project consists of:
- **Frontend**: React application with Vite (Port 3000)
- **Student Service**: Node.js microservice for student data management (Port 3001)
- **Report Service**: Node.js microservice for analytics and reporting (Port 3002)
- **Database**: PostgreSQL database for data storage

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12 or higher)
- **Git**

## 🚀 Project Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Score_registration
```

### 2. Database Setup

#### Install and Configure PostgreSQL

1. Install PostgreSQL on your system
2. Create a new database:

```sql
CREATE DATABASE scores_student;
CREATE USER student_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE scores_student TO student_user;
```

### 3. Backend Services Setup

#### A. Student Service Setup

```bash
cd student-score-microservices/student-service
```

Create `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_NAME=scores_student
DB_USER=student_user
DB_PASSWORD=your_password

# Service Configuration
PORT=3001
NODE_ENV=development

# CSV Import Configuration
AUTO_IMPORT_CSV=true
CSV_FILENAME=students_data.csv
CSV_STREAM_PROCESSING=true
CSV_BATCH_SIZE=200
CSV_TEST_MODE=false
CSV_TEST_LINES=1000

# File Upload Limits
MAX_FILE_SIZE=50mb

# Logging
LOG_LEVEL=info
```

Install dependencies and setup:

```bash
npm install
# or
yarn install

# Run database migrations
npx knex migrate:latest

# Run database seeds (optional)
npx knex seed:run

# Create CSV files directory
mkdir -p csv-files

# Start the service
npm start
# or
yarn start
```

#### B. Report Service Setup

```bash
cd ../report-service
```

Create `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_NAME=scores_student
DB_USER=student_user
DB_PASSWORD=your_password

# Service Configuration
PORT=3002
NODE_ENV=development

# Report Configuration
AUTO_INITIALIZE=true

# Logging
LOG_LEVEL=info
```

Install dependencies and setup:

```bash
npm install
# or
yarn install

# Run database migrations
npx knex migrate:latest

# Run database seeds
npx knex seed:run

# Start the service
npm start
# or
yarn start
```

### 4. Frontend Setup

```bash
cd ../../frontend
```

Install dependencies:

```bash
npm install
# or
yarn install
```

Create `.env` file (optional):

```env
VITE_API_BASE_URL=http://localhost:3002
VITE_STUDENT_API_URL=http://localhost:3001
```

Start the development server:

```bash
npm run dev
# or
yarn dev
```

## 🗂️ Project Structure

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
│   │   │   └── ReportService.js       # API service layer
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── student-score-microservices/       # Backend Microservices
│   ├── student-service/               # Student Data Management
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   ├── StudentController.js
│   │   │   │   └── CsvController.js
│   │   │   ├── services/
│   │   │   │   ├── StudentService.js
│   │   │   │   └── CsvService.js
│   │   │   ├── models/
│   │   │   │   └── Student.js
│   │   │   ├── repositories/
│   │   │   │   ├── BaseRepository.js
│   │   │   │   └── StudentRepository.js
│   │   │   ├── routes/
│   │   │   │   ├── StudentRoute.js
│   │   │   │   └── CsvRoute.js
│   │   │   ├── database/
│   │   │   ├── utils/
│   │   │   └── app.js
│   │   ├── migrations/
│   │   ├── seeds/
│   │   ├── csv-files/                 # CSV data files
│   │   └── package.json
│   │
│   ├── report-service/                # Analytics & Reporting
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   ├── report.js
│   │   │   │   └── groupPerformanceController.js
│   │   │   ├── services/
│   │   │   │   ├── ReportService.js
│   │   │   │   ├── studentPerformanceCalculator.js
│   │   │   │   ├── groupPerformanceService.js
│   │   │   │   └── statisticCalculatorService.js
│   │   │   ├── models/
│   │   │   │   └── SubjectStatistic.js
│   │   │   ├── config/
│   │   │   │   ├── groupConfig.js
│   │   │   │   ├── subjectConfig.js
│   │   │   │   └── scoreConfig.js
│   │   │   ├── routes/
│   │   │   │   ├── reportRoutes.js
│   │   │   │   └── groupRoutes.js
│   │   │   ├── database/
│   │   │   ├── utils/
│   │   │   └── app.js
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── package.json
│   │
│   ├── api-gateway/                   # API Gateway (Optional)
│   └── docker-compose.yml             # Docker configuration
```

## 📊 Features

### Student Management
- **CSV Import**: Bulk import student data from CSV files
- **CRUD Operations**: Create, Read, Update, Delete student records
- **Score Management**: Manage individual subject scores
- **Data Validation**: Comprehensive validation for student data

### Reporting & Analytics
- **Performance Statistics**: Subject-wise performance analysis
- **Score Distribution**: Visualize score distributions across subjects
- **Top Students**: Rank students by performance groups
- **Group Analysis**: Analyze performance by subject combinations
- **Interactive Charts**: Bar charts and pie charts for data visualization

### Subject Groups
- **Group A**: Mathematics, Physics, Chemistry (Science)
- **Group B**: Mathematics, Chemistry, Biology (Biology)
- **Group C**: Literature, History, Geography (Social Sciences)
- **Group D**: Mathematics, Literature, Foreign Language (Language)

## 🔧 Configuration

### Database Schema

The system uses the following main tables:

```sql
-- Students table
students (
  id SERIAL PRIMARY KEY,
  sbd VARCHAR(20) UNIQUE NOT NULL,
  toan DECIMAL(4,2),
  ngu_van DECIMAL(4,2),
  ngoai_ngu DECIMAL(4,2),
  vat_li DECIMAL(4,2),
  hoa_hoc DECIMAL(4,2),
  sinh_hoc DECIMAL(4,2),
  lich_su DECIMAL(4,2),
  dia_li DECIMAL(4,2),
  gdcd DECIMAL(4,2),
  ma_ngoai_ngu VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subject statistics table
subject_statistics (
  id SERIAL PRIMARY KEY,
  subject_code VARCHAR(20) NOT NULL,
  subject_name VARCHAR(100) NOT NULL,
  score_level VARCHAR(20) NOT NULL,
  min_score DECIMAL(4,2) NOT NULL,
  max_score DECIMAL(4,2),
  student_count INTEGER DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT NOW()
);
```

### CSV Data Format

The system expects CSV files with the following columns:

```csv
sbd,toan,ngu_van,ngoai_ngu,vat_li,hoa_hoc,sinh_hoc,lich_su,dia_li,gdcd,ma_ngoai_ngu
12345678,8.5,7.0,8.0,9.0,7.5,8.0,6.5,7.0,8.5,N1
```

## 🌐 API Endpoints

### Student Service (Port 3001)

```
GET    /health                           # Health check
GET    /api/students                     # Get all students (paginated)
GET    /api/students/:sbd                # Get student by ID
POST   /api/students                     # Create new student
PUT    /api/students/:sbd                # Update student
DELETE /api/students/:sbd                # Delete student
GET    /api/students/subject/:subject/scores  # Get students by subject score
GET    /api/students/subject/:subject/statistics  # Get subject statistics
GET    /api/csv/files                    # Get available CSV files
POST   /api/csv/process/:filename        # Process CSV file
GET    /api/csv/validate/:filename       # Validate CSV file
GET    /api/csv/preview/:filename        # Preview CSV file
```

### Report Service (Port 3002)

```
GET    /health                           # Health check
GET    /api/reports/statistics/chart     # Get chart data for all subjects
GET    /api/reports/statistics/subject/:code  # Get subject statistics
GET    /api/reports/statistics/summary   # Get comprehensive summary
GET    /api/reports/performance/overview # Get performance overview
POST   /api/reports/statistics/calculate # Calculate/update statistics
POST   /api/reports/initialize          # Initialize report system
GET    /api/reports/groups              # Get available groups
GET    /api/reports/groups/:code/top-students  # Get top students by group
GET    /api/reports/groups/:code/statistics    # Get group statistics
GET    /api/reports/groups/:code/ranking       # Get group ranking
POST   /api/reports/groups/compare      # Compare groups
```

## 🐳 Docker Setup (Optional)

If you prefer to use Docker:

```bash
cd student-score-microservices

# Build and start all services
docker-compose up --build

# Or start in detached mode
docker-compose up -d --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

The `docker-compose.yml` includes:
- PostgreSQL database
- Student service
- Report service
- pgAdmin for database management

## 🧪 Testing

### Running Tests

```bash
# Student Service tests
cd student-score-microservices/student-service
npm test

# Report Service tests
cd ../report-service
npm test

# Frontend tests
cd ../../frontend
npm test
```

### Sample Data

To test the system with sample data:

1. Place a CSV file in `student-score-microservices/student-service/csv-files/`
2. Set `AUTO_IMPORT_CSV=true` in student service `.env`
3. Set `CSV_FILENAME=your_file.csv` in student service `.env`
4. Restart the student service

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:5433
   ```
   - Ensure PostgreSQL is running
   - Check database credentials in `.env` files
   - Verify database exists

2. **Port Already in Use**
   ```
   Error: listen EADDRINUSE :::3001
   ```
   - Change PORT in `.env` file
   - Or kill the process using the port

3. **CSV Import Fails**
   - Check CSV file format matches expected schema
   - Ensure file permissions allow reading
   - Check logs for detailed error messages

4. **Frontend Can't Connect to Backend**
   - Verify backend services are running
   - Check CORS configuration
   - Ensure API URLs are correct

### Logs

Service logs are available in:
- Student Service: `student-score-microservices/student-service/logs/`
- Report Service: `student-score-microservices/report-service/logs/`

### Database Management

Access pgAdmin (if using Docker):
- URL: `http://localhost:5050`
- Email: `admin@admin.com`
- Password: `admin`

## 📈 Performance Optimization

The system includes several optimizations:

1. **Database-Level Calculations**: SQL aggregations instead of JavaScript processing
2. **Memory-Efficient Queries**: Limited result sets for large datasets
3. **Batch Processing**: CSV import in configurable batch sizes
4. **Streaming**: Large file processing with streams
5. **Caching**: Automatic result caching for frequently accessed data

## 🛡️ Security Considerations

- Input validation on all endpoints
- SQL injection prevention with parameterized queries
- File upload restrictions
- Environment variable configuration for sensitive data
- CORS configuration for frontend access

## 🚀 Deployment

### Production Environment

1. **Environment Variables**: Update all `.env` files with production values
2. **Database**: Set up production PostgreSQL instance
3. **SSL**: Configure SSL certificates
4. **Process Manager**: Use PM2 or similar for process management
5. **Reverse Proxy**: Configure Nginx or Apache
6. **Monitoring**: Set up logging and monitoring

### Example Production Commands

```bash
# Install PM2
npm install -g pm2

# Start services with PM2
cd student-score-microservices/student-service
pm2 start app.js --name "student-service"

cd ../report-service
pm2 start app.js --name "report-service"

# Build frontend for production
cd ../../frontend
npm run build

# Serve frontend with a static server
npm install -g serve
serve -s dist -l 3000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
- Check service logs for error details

## 🔄 Version History

- **v1.0.0**: Initial release with basic student management and reporting
- **v1.1.0**: Added group performance analysis and optimized queries
- **v1.2.0**: Enhanced frontend with responsive design and charts
