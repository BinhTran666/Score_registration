const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { Transform, pipeline } = require("stream");
const { promisify } = require("util");
const logger = require("../utils/logger");
const Student = require("../models/Student");
const StudentRepository = require("../repositories/StudentRepository");

const pipelineAsync = promisify(pipeline);

class CsvService {
  constructor() {
    this.csvDirectory = path.join(__dirname, "../../csv-files");
    this.batchSize = parseInt(process.env.CSV_BATCH_SIZE) || 500;
    this.useStreaming = process.env.CSV_STREAM_PROCESSING === "true";
    this.testMode = process.env.CSV_TEST_MODE === "true";
    this.testLines = parseInt(process.env.CSV_TEST_LINES) || 10000;
    this.studentRepository = new StudentRepository();

    logger.info(
      `🏭 Report Service CsvService initialized - Streaming: ${this.useStreaming}, Batch size: ${this.batchSize}`
    );
    if (this.testMode) {
      logger.info(
        `🧪 TEST MODE ENABLED: Processing only first ${this.testLines} lines`
      );
    }
  }

  async processCSVFile(filename) {
    logger.info(
      `📊 Processing CSV in report service with streaming: ${this.useStreaming}, Test mode: ${this.testMode}`
    );

    if (this.useStreaming) {
      return this.processCSVFileWithStreaming(filename);
    } else {
      return this.processCSVFileOriginal(filename);
    }
  }

  async processCSVFileWithStreaming(filename) {
    const filePath = path.join(this.csvDirectory, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`CSV file not found: ${filename}`);
    }

    logger.info(`🚀 Starting streaming CSV processing for report service: ${filename}`);
    if (this.testMode) {
      logger.info(
        `🧪 TEST MODE: Will process only first ${this.testLines} lines`
      );
    }

    let validRecords = 0;
    let invalidRecords = 0;
    let currentBatch = [];
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    const errors = [];
    let totalProcessed = 0;
    let shouldStop = false;

    const self = this;

    const processStream = new Transform({
      objectMode: true,
      async transform(chunk, encoding, callback) {
        try {
          // Test mode: check if we should stop
          if (self.testMode && totalProcessed >= self.testLines) {
            if (!shouldStop) {
              logger.info(
                `🧪 TEST MODE: Reached ${self.testLines} lines, stopping processing`
              );
              shouldStop = true;
            }
            callback(); // Stop processing more records
            return;
          }

          totalProcessed++;

          const studentData = self.transformCsvRowToStudent(chunk);
          const student = new Student(studentData);
          const validation = student.validate();

          if (validation.isValid) {
            const studentJson = student.toJSON();
            currentBatch.push(studentJson);
            validRecords++;

            // When batch reaches batchSize, process it using repository
            if (currentBatch.length >= self.batchSize) {
              // Pause stream while processing batch
              this.pause();
              
              try {
                const batchResult = await self.studentRepository.createBatch(currentBatch, 100);
                totalInserted += batchResult.inserted;
                totalUpdated += batchResult.updated;
                totalErrors += batchResult.errors;
                
                logger.info(
                  `📦 Report Service - Processed batch: ${validRecords} valid records so far ${
                    self.testMode ? "(TEST MODE)" : ""
                  } - DB: +${batchResult.inserted} inserted, ~${batchResult.updated} updated`
                );
                
                currentBatch = []; // Clear current batch

                if (global.gc) {
                  global.gc();
                }
              } catch (batchError) {
                logger.error('Error processing batch:', batchError);
                totalErrors += currentBatch.length;
                currentBatch = [];
              }
              
              // Resume stream
              this.resume();
            }
          } else {
            invalidRecords++;
            if (errors.length < 100) {
              errors.push({
                row: validRecords + invalidRecords,
                errors: validation.errors,
                data: chunk,
              });
            }
          }

          // Log progress - more frequent in test mode
          const logInterval = self.testMode ? 1000 : 10000;
          if ((validRecords + invalidRecords) % logInterval === 0) {
            const testModeInfo = self.testMode
              ? ` (TEST MODE - ${totalProcessed}/${self.testLines})`
              : "";
            logger.info(
              `📊 Report Service Progress: ${
                validRecords + invalidRecords
              } records processed. Valid: ${validRecords}, Invalid: ${invalidRecords}${testModeInfo}`
            );
          }

          callback();
        } catch (error) {
          invalidRecords++;
          totalProcessed++;
          if (errors.length < 100) {
            errors.push({
              row: validRecords + invalidRecords,
              error: error.message,
              data: chunk,
            });
          }
          callback();
        }
      },

      async flush(callback) {
        // Process remaining batch
        if (currentBatch.length > 0) {
          try {
            const batchResult = await self.studentRepository.createBatch(currentBatch, 100);
            totalInserted += batchResult.inserted;
            totalUpdated += batchResult.updated;
            totalErrors += batchResult.errors;
            
            const testModeInfo = self.testMode ? " (TEST MODE)" : "";
            logger.info(
              `📦 Report Service - Final batch processed: ${currentBatch.length} records${testModeInfo}`
            );
            logger.info(
              `📊 Final DB import: ${totalInserted} inserted, ${totalUpdated} updated, ${totalErrors} errors`
            );
          } catch (error) {
            logger.error('Error processing final batch:', error);
            totalErrors += currentBatch.length;
          }
        }
        callback();
      },
    });

    try {
      await pipelineAsync(fs.createReadStream(filePath), csv(), processStream);

      const testModeInfo = this.testMode
        ? ` (TEST MODE - processed ${totalProcessed}/${this.testLines} lines)`
        : "";
      logger.info(
        `✅ Report Service CSV streaming completed for ${filename}. Valid: ${validRecords}, Invalid: ${invalidRecords}${testModeInfo}`
      );

      const importResult = {
        inserted: totalInserted,
        updated: totalUpdated,
        errors: totalErrors
      };

      return {
        filename,
        validRecords,
        invalidRecords,
        errors,
        testMode: this.testMode,
        totalProcessed: totalProcessed,
        importResult: importResult
      };
    } catch (error) {
      logger.error(`❌ Error in report service streaming CSV processing:`, error);
      throw error;
    }
  }

  // Keep original method for fallback
  async processCSVFileOriginal(filename) {
    return new Promise(async (resolve, reject) => {
      const filePath = path.join(this.csvDirectory, filename);

      if (!fs.existsSync(filePath)) {
        reject(new Error(`CSV file not found: ${filename}`));
        return;
      }

      const results = [];
      let validRecords = 0;
      let invalidRecords = 0;
      const errors = [];

      logger.info(`📊 Starting original CSV processing for report service: ${filename}`);

      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => {
          try {
            // Test mode check
            if (this.testMode && (validRecords + invalidRecords) >= this.testLines) {
              return;
            }

            const studentData = this.transformCsvRowToStudent(data);
            const student = new Student(studentData);
            const validation = student.validate();

            if (validation.isValid) {
              results.push(student.toJSON());
              validRecords++;
            } else {
              invalidRecords++;
              if (errors.length < 100) {
                errors.push({
                  row: validRecords + invalidRecords,
                  errors: validation.errors,
                  data: data,
                });
              }
            }
          } catch (error) {
            invalidRecords++;
            if (errors.length < 100) {
              errors.push({
                row: validRecords + invalidRecords,
                error: error.message,
                data: data,
              });
            }
          }
        })
        .on("end", async () => {
          const testModeInfo = this.testMode ? " (TEST MODE)" : "";
          logger.info(
            `📊 Report Service CSV parsing completed for ${filename}. Valid: ${validRecords}, Invalid: ${invalidRecords}${testModeInfo}`
          );
          
          // Import to database using repository
          let importResult = null;
          if (results.length > 0) {
            try {
              importResult = await this.studentRepository.createBatch(results);
              logger.info(`📊 Database import completed: ${importResult.inserted} inserted, ${importResult.updated} updated`);
            } catch (importError) {
              logger.error('Error importing to database:', importError);
              importResult = { inserted: 0, updated: 0, errors: results.length };
            }
          }
          
          resolve({
            filename,
            data: results,
            validRecords,
            invalidRecords,
            errors,
            testMode: this.testMode,
            importResult
          });
        })
        .on("error", (error) => {
          logger.error(`❌ Error reading CSV file ${filename}:`, error);
          reject(error);
        });
    });
  }

  transformCsvRowToStudent(row) {
    return {
      sbd: row.sbd?.toString().trim(),
      toan: this.parseScore(row.toan),
      ngu_van: this.parseScore(row.ngu_van),
      ngoai_ngu: this.parseScore(row.ngoai_ngu),
      vat_li: this.parseScore(row.vat_li),
      hoa_hoc: this.parseScore(row.hoa_hoc),
      sinh_hoc: this.parseScore(row.sinh_hoc),
      lich_su: this.parseScore(row.lich_su),
      dia_li: this.parseScore(row.dia_li),
      gdcd: this.parseScore(row.gdcd),
      ma_ngoai_ngu: row.ma_ngoai_ngu?.toString().trim() || null,
    };
  }

  parseScore(score) {
    if (!score || score === "" || score === "null" || score === "undefined") {
      return null; // Changed from 0 to null for better database handling
    }

    const parsed = parseFloat(score);
    return isNaN(parsed) ? null : parsed;
  }

  async validateCSVFile(filename) {
    const filePath = path.join(this.csvDirectory, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`CSV file not found: ${filename}`);
    }

    return new Promise((resolve, reject) => {
      const requiredHeaders = ["sbd", "toan", "ngu_van", "ngoai_ngu"];
      let headers = [];
      let isFirstRow = true;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on("headers", (headerList) => {
          headers = headerList;
        })
        .on("data", (data) => {
          if (isFirstRow) {
            isFirstRow = false;
            const missingHeaders = requiredHeaders.filter(
              (header) => !headers.includes(header)
            );

            if (missingHeaders.length > 0) {
              reject(
                new Error(
                  `Missing required headers: ${missingHeaders.join(", ")}`
                )
              );
              return;
            }
          }
        })
        .on("end", () => {
          resolve({
            valid: true,
            headers,
            message: "CSV file is valid",
          });
        })
        .on("error", reject);
    });
  }

  async previewCSVFile(filename, rows = 5) {
    const filePath = path.join(this.csvDirectory, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`CSV file not found: ${filename}`);
    }

    return new Promise((resolve, reject) => {
      const preview = [];
      let count = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => {
          if (count < rows) {
            preview.push(data);
            count++;
          }
        })
        .on("end", () => {
          resolve({
            filename,
            preview,
            rowsShown: preview.length,
          });
        })
        .on("error", reject);
    });
  }

  getAvailableFiles() {
    if (!fs.existsSync(this.csvDirectory)) {
      fs.mkdirSync(this.csvDirectory, { recursive: true });
      return [];
    }

    return fs
      .readdirSync(this.csvDirectory)
      .filter((file) => file.endsWith(".csv"))
      .map((file) => {
        const filePath = path.join(this.csvDirectory, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          modified: stats.mtime,
          sizeFormatted: this.formatBytes(stats.size),
        };
      });
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Helper method to clear all data (useful for testing)
  async clearAllData() {
    if (this.testMode) {
      logger.info('🧪 TEST MODE: Clearing all student data...');
      return await this.studentRepository.deleteAll();
    } else {
      logger.warn('⚠️ clearAllData() only works in TEST MODE');
      return 0;
    }
  }
}

module.exports = CsvService;