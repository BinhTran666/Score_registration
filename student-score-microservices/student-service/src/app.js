const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const logger = require("./utils/logger");
const database = require("./database/connection");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || "10mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.MAX_FILE_SIZE || "10mb",
  })
);

// Static files for CSV files
app.use("/csv-files", express.static(path.join(__dirname, "../csv-files")));

// Health check
app.get("/health", async (req, res) => {
  try {
    await database.testConnection();
    res.json({
      status: "OK",
      service: "student-service",
      timestamp: new Date().toISOString(),
      database: "connected",
      autoImport: process.env.AUTO_IMPORT_CSV === "true",
      csvFile: process.env.CSV_FILENAME || "none",
    });
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      service: "student-service",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message,
    });
  }
});

// Routes
const studentRoutes = require("./routes/StudentRoute");
const csvRoutes = require("./routes/CsvRoute");

app.use("/api/students", studentRoutes);
app.use("/api/csv", csvRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Auto-import CSV on startup
async function autoImportCSV() {
  const shouldAutoImport =
    process.env.AUTO_IMPORT_CSV === "true" ||
    process.env.AUTO_IMPORT_CSV === true;
  const csvFilename = process.env.CSV_FILENAME;
  const testMode = process.env.CSV_TEST_MODE === "true";
  const testLines = process.env.CSV_TEST_LINES || "1000";

  logger.info(
    `🔍 Auto-import check: shouldAutoImport=${shouldAutoImport}, csvFilename=${csvFilename}`
  );
  logger.info(`🔧 Streaming enabled: ${process.env.CSV_STREAM_PROCESSING}`);
  logger.info(`📦 Batch size: ${process.env.CSV_BATCH_SIZE || 200}`);

  if (testMode) {
    logger.info(
      `🧪 TEST MODE ENABLED: Will process only first ${testLines} lines`
    );
  }

  if (!shouldAutoImport || !csvFilename) {
    logger.info("🔄 Auto-import disabled or no CSV filename specified");
    return;
  }

  try {
    logger.info("⏳ Waiting before auto-import...");
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Reduced wait time for test

    const fs = require("fs");
    const csvPath = path.join(__dirname, "../csv-files", csvFilename);

    logger.info(`📂 Checking CSV file at: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
      logger.warn(`⚠️ CSV file not found: ${csvFilename} at ${csvPath}`);
      return;
    }

    const stats = fs.statSync(csvPath);
    logger.info(
      `✅ CSV file found: ${csvFilename} (${(stats.size / 1024 / 1024).toFixed(
        2
      )} MB)`
    );

    const memBefore = process.memoryUsage();
    logger.info(
      `💾 Memory before import: ${(memBefore.heapUsed / 1024 / 1024).toFixed(
        2
      )} MB`
    );

    const CsvService = require("./services/CsvService");
    const StudentService = require("./services/StudentService");

    logger.info("📦 Creating service instances...");

    const csvService = new CsvService();
    const studentService = new StudentService();

    logger.info("🔍 Checking if data already exists...");

    const existingCount = await studentService.getStudentCount();
    logger.info(`📊 Existing student count: ${existingCount}`);

    if (existingCount > 0 && !testMode) {
      logger.info(
        `📊 Data already exists (${existingCount} students). Skipping auto-import.`
      );
      return;
    }

    if (testMode) {
      logger.info(
        `🧪 TEST MODE: Proceeding with import (existing records: ${existingCount})`
      );
    }

    logger.info(`📂 Starting auto-import of CSV file: ${csvFilename}`);

    const startTime = Date.now();
    const processResult = await csvService.processCSVFile(csvFilename);
    const processingTime = Date.now() - startTime;

    logger.info(
      `📊 CSV processing completed in ${(processingTime / 1000).toFixed(
        2
      )} seconds`
    );
    logger.info(
      `📊 Valid records: ${processResult.validRecords}, Invalid: ${processResult.invalidRecords}`
    );

    if (testMode) {
      logger.info(
        `🧪 TEST MODE: Processed ${processResult.totalProcessed} out of ${testLines} requested lines`
      );
    }

    const memAfterCsv = process.memoryUsage();
    logger.info(
      `💾 Memory after CSV processing: ${(
        memAfterCsv.heapUsed /
        1024 /
        1024
      ).toFixed(2)} MB`
    );

    if (processResult.validRecords > 0) {
      logger.info(
        `📥 Starting bulk import of ${processResult.validRecords} records...`
      );

      logger.info(
        `🔍 DEBUG: processResult keys: ${Object.keys(processResult)}`
      );
      logger.info(
        `🔍 DEBUG: processResult.data exists: ${!!processResult.data}`
      );
      logger.info(
        `🔍 DEBUG: processResult.data type: ${typeof processResult.data}`
      );
      logger.info(
        `🔍 DEBUG: processResult.data length: ${
          processResult.data ? processResult.data.length : "NO DATA"
        }`
      );

      if (
        processResult.data &&
        Array.isArray(processResult.data) &&
        processResult.data.length > 0
      ) {
        logger.info(
          `🔍 DEBUG: First record: ${JSON.stringify(
            processResult.data[0],
            null,
            2
          )}`
        );
        logger.info(
          `🔍 DEBUG: Last record: ${JSON.stringify(
            processResult.data[processResult.data.length - 1],
            null,
            2
          )}`
        );
      } else {
        logger.error(`❌ DEBUG: processResult.data is invalid or empty!`);
        logger.error(
          `❌ DEBUG: Full processResult: ${JSON.stringify(
            processResult,
            null,
            2
          )}`
        );
      }

      const importStartTime = Date.now();
      const importResult = await studentService.bulkImportStudents(
        processResult.data
      );
      const importTime = Date.now() - importStartTime;

      logger.info(
        `✅ Auto-import completed in ${(importTime / 1000).toFixed(2)} seconds`
      );
      logger.info(
        `📊 Import summary: ${importResult.imported} imported, ${importResult.failed} failed`
      );
      logger.info(`📈 Success rate: ${importResult.successRate.toFixed(1)}%`);

      if (testMode) {
        logger.info(
          `🧪 TEST MODE COMPLETED: Successfully tested with ${processResult.validRecords} records`
        );
        logger.info(`🧪 To run full import, restart without CSV_TEST_MODE`);
      }

      const memFinal = process.memoryUsage();
      logger.info(
        `💾 Final memory usage: ${(memFinal.heapUsed / 1024 / 1024).toFixed(
          2
        )} MB`
      );
    } else {
      logger.warn("⚠️ No valid records found in CSV file");
    }

    if (global.gc) {
      global.gc();
      logger.info("🧹 Garbage collection triggered");
    }
  } catch (error) {
    logger.error("❌ Auto-import failed:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  }
}

// Graceful shutdown
const shutdown = async () => {
  logger.info("Shutting down gracefully");
  await database.closeConnection();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start server
app.listen(PORT, () => {
  logger.info(`Student service is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(
    `Auto-import: ${
      process.env.AUTO_IMPORT_CSV === "true" ? "Enabled" : "Disabled"
    }`
  );
  logger.info(`CSV file: ${process.env.CSV_FILENAME || "Not specified"}`);
  logger.info("Available endpoints:");
  logger.info("- GET /health");
  logger.info("- GET /api/students");
  logger.info("- GET /api/students/:sbd");
  logger.info("- POST /api/students");
  logger.info("- PUT /api/students/:sbd");
  logger.info("- DELETE /api/students/:sbd");
  logger.info("- GET /api/students/subject/:subject/scores?minScore=8");
  logger.info("- GET /api/students/subject/:subject/statistics");
  logger.info("- GET /api/csv/files");
  logger.info("- GET /api/csv/validate/:filename");
  logger.info("- GET /api/csv/preview/:filename");
  logger.info("- POST /api/csv/process/:filename");

  // Run auto-import after server starts
  autoImportCSV();
});

module.exports = app;
