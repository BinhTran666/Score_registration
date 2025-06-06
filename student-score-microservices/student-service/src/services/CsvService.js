const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const logger = require('../utils/logger');
const Student = require('../models/Student');

class CsvService {
  constructor() {
    this.validHeaders = [
      'sbd', 'toan', 'ngu_van', 'ngoai_ngu', 'vat_li', 
      'hoa_hoc', 'sinh_hoc', 'lich_su', 'dia_li', 'gdcd', 'ma_ngoai_ngu'
    ];
    this.csvDirectory = path.join(__dirname, '../../csv-files');
    
    // Ensure CSV directory exists
    if (!fs.existsSync(this.csvDirectory)) {
      fs.mkdirSync(this.csvDirectory, { recursive: true });
      logger.info(`Created CSV directory: ${this.csvDirectory}`);
    }
  }

  async getAvailableCSVFiles() {
    try {
      const files = fs.readdirSync(this.csvDirectory);
      const csvFiles = files.filter(file => path.extname(file).toLowerCase() === '.csv');
      
      return csvFiles.map(file => ({
        filename: file,
        fullPath: path.join(this.csvDirectory, file),
        size: fs.statSync(path.join(this.csvDirectory, file)).size,
        modified: fs.statSync(path.join(this.csvDirectory, file)).mtime
      }));
    } catch (error) {
      logger.error('Error reading CSV directory:', error);
      throw new Error('Failed to read CSV files');
    }
  }

  async parseCSV(filename) {
    const filePath = path.join(this.csvDirectory, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`CSV file ${filename} not found`);
    }

    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];
      let rowNumber = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          rowNumber++;
          try {
            const student = new Student(data);
            const validation = student.validate();
            
            if (validation.isValid) {
              results.push(student.toJSON());
            } else {
              errors.push({
                row: rowNumber,
                sbd: data.sbd,
                errors: validation.errors
              });
            }
          } catch (error) {
            errors.push({
              row: rowNumber,
              sbd: data.sbd || 'unknown',
              errors: [error.message]
            });
          }
        })
        .on('end', () => {
          logger.info(`CSV parsing completed for ${filename}. Valid records: ${results.length}, Invalid records: ${errors.length}`);
          resolve({ results, errors, filename });
        })
        .on('error', (error) => {
          logger.error(`CSV parsing error for ${filename}:`, error);
          reject(error);
        });
    });
  }

  async validateCSVHeaders(filename) {
    const filePath = path.join(this.csvDirectory, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`CSV file ${filename} not found`);
    }

    return new Promise((resolve, reject) => {
      let headerChecked = false;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headers) => {
          headerChecked = true;
          const missingHeaders = this.validHeaders.filter(h => !headers.includes(h));
          const extraHeaders = headers.filter(h => !this.validHeaders.includes(h));

          resolve({
            isValid: missingHeaders.length === 0,
            missingHeaders,
            extraHeaders,
            headers,
            filename
          });
        })
        .on('error', (error) => {
          if (!headerChecked) {
            reject(error);
          }
        });
    });
  }

  async processCSVFile(filename) {
    try {
      logger.info(`Starting to process CSV file: ${filename}`);

      // Validate headers first
      const headerValidation = await this.validateCSVHeaders(filename);
      if (!headerValidation.isValid) {
        throw new Error(`Invalid CSV headers in ${filename}. Missing: ${headerValidation.missingHeaders.join(', ')}`);
      }

      // Parse the CSV
      const parseResult = await this.parseCSV(filename);
      
      return {
        success: true,
        filename: parseResult.filename,
        validRecords: parseResult.results.length,
        invalidRecords: parseResult.errors.length,
        data: parseResult.results,
        errors: parseResult.errors
      };

    } catch (error) {
      logger.error(`Error processing CSV file ${filename}:`, error);
      throw error;
    }
  }
}

module.exports = CsvService;