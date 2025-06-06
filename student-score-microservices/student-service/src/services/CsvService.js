const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { Transform, pipeline } = require("stream");
const { promisify } = require("util");
const logger = require("../utils/logger");
const Student = require("../models/Student");

const pipelineAsync = promisify(pipeline);

class CsvService {
  constructor() {
    this.csvDirectory = path.join(__dirname, "../../csv-files");
    this.batchSize = parseInt(process.env.CSV_BATCH_SIZE) || 500;
    // Fix the streaming check with proper default
    this.useStreaming =
      process.env.CSV_STREAM_PROCESSING === "true" ||
      process.env.CSV_STREAM_PROCESSING === true;

    this.testMode = process.env.CSV_TEST_MODE === "true";
    this.testLines = parseInt(process.env.CSV_TEST_LINES) || 1000;

    logger.info(
      `CsvService initialized - Streaming: ${this.useStreaming}, Batch size: ${this.batchSize}`
    );
    if (this.testMode) {
      logger.info(
        `🧪 TEST MODE ENABLED: Processing only first ${this.testLines} lines`
      );
    }
  }

  async processCSVFile(filename) {
    logger.info(`Processing CSV with streaming: ${this.useStreaming}`);

    if (this.useStreaming) {
      return this.processCSVFileWithStreaming(filename);
    } else {
      return this.processCSVFileOriginal(filename);
    }
  }

  async processCSVFile(filename) {
    logger.info(
      `Processing CSV with streaming: ${this.useStreaming}, Test mode: ${this.testMode}`
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

    logger.info(`Starting streaming CSV processing for: ${filename}`);
    if (this.testMode) {
      logger.info(
        `🧪 TEST MODE: Will process only first ${this.testLines} lines`
      );
    }

    let validRecords = 0;
    let invalidRecords = 0;
    let currentBatch = [];
    const allData = []; // This will store ALL valid records
    const errors = [];
    let totalProcessed = 0;
    let shouldStop = false;

    const self = this;

    const processStream = new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
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

            // When batch reaches batchSize, add to allData and clear batch
            if (currentBatch.length >= self.batchSize) {
              // Add current batch to allData for final return
              allData.push(...currentBatch);
              logger.info(
                `Processed batch: ${validRecords} valid records so far ${
                  self.testMode ? "(TEST MODE)" : ""
                }`
              );
              currentBatch = []; // Clear current batch

              if (global.gc) {
                global.gc();
              }
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
          const logInterval = self.testMode ? 100 : 10000;
          if ((validRecords + invalidRecords) % logInterval === 0) {
            const testModeInfo = self.testMode
              ? ` (TEST MODE - ${totalProcessed}/${self.testLines})`
              : "";
            logger.info(
              `Progress: ${
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

      flush(callback) {
        // Process remaining batch - IMPORTANT: Add remaining records to allData
        if (currentBatch.length > 0) {
          allData.push(...currentBatch);
          const testModeInfo = self.testMode ? " (TEST MODE)" : "";
          logger.info(
            `Final batch processed: ${currentBatch.length} records${testModeInfo}`
          );
          logger.info(
            `📊 Total records collected for import: ${allData.length}`
          );
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
        `CSV streaming completed for ${filename}. Valid: ${validRecords}, Invalid: ${invalidRecords}${testModeInfo}`
      );
      logger.info(
        `📦 Final data array length: ${allData.length} records ready for import`
      );

      return {
        filename,
        data: allData, // This should contain all valid records
        validRecords,
        invalidRecords,
        errors,
        testMode: this.testMode,
        totalProcessed: totalProcessed,
      };
    } catch (error) {
      logger.error(`Error in streaming CSV processing:`, error);
      throw error;
    }
  }

  // Keep original method for fallback
  async processCSVFileOriginal(filename) {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.csvDirectory, filename);

      if (!fs.existsSync(filePath)) {
        reject(new Error(`CSV file not found: ${filename}`));
        return;
      }

      const results = [];
      let validRecords = 0;
      let invalidRecords = 0;
      const errors = [];

      logger.info(`Starting original CSV processing for: ${filename}`);

      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => {
          try {
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
        .on("end", () => {
          logger.info(
            `CSV parsing completed for ${filename}. Valid: ${validRecords}, Invalid: ${invalidRecords}`
          );
          resolve({
            filename,
            data: results,
            validRecords,
            invalidRecords,
            errors,
          });
        })
        .on("error", (error) => {
          logger.error(`Error reading CSV file ${filename}:`, error);
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
      return 0;
    }

    const parsed = parseFloat(score);
    return isNaN(parsed) ? 0 : parsed;
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
}

module.exports = CsvService;
