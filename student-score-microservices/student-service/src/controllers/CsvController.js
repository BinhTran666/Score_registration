const CsvService = require('../services/CsvService');
const StudentService = require('../services/StudentService');
const logger = require('../utils/logger');

class CsvController {
  constructor() {
    this.csvService = new CsvService();
    this.studentService = new StudentService();
  }

  async getAvailableFiles(req, res) {
    try {
      const files = await this.csvService.getAvailableCSVFiles();

      res.json({
        success: true,
        message: 'Available CSV files retrieved successfully',
        data: {
          count: files.length,
          files
        }
      });
    } catch (error) {
      logger.error('Get available files error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available CSV files',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async processCSV(req, res) {
    try {
      const { filename } = req.params;

      if (!filename) {
        return res.status(400).json({
          success: false,
          message: 'Filename is required'
        });
      }

      logger.info(`Processing CSV file: ${filename}`);

      // Process the CSV file
      const processResult = await this.csvService.processCSVFile(filename);

      if (processResult.validRecords === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid records found in CSV',
          data: processResult
        });
      }

      // Import to database
      const importResult = await this.studentService.bulkImportStudents(processResult.data);

      res.json({
        success: true,
        message: 'CSV processed and imported successfully',
        data: {
          filename: processResult.filename,
          imported: importResult.imported,
          validRecords: processResult.validRecords,
          invalidRecords: processResult.invalidRecords,
          errors: processResult.errors.slice(0, 10) // Return first 10 errors
        }
      });

    } catch (error) {
      logger.error('CSV processing error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to process CSV file',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async validateCSV(req, res) {
    try {
      const { filename } = req.params;

      if (!filename) {
        return res.status(400).json({
          success: false,
          message: 'Filename is required'
        });
      }

      const validation = await this.csvService.validateCSVHeaders(filename);

      res.json({
        success: true,
        message: 'CSV validation completed',
        data: validation
      });

    } catch (error) {
      logger.error('CSV validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate CSV file',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async previewCSV(req, res) {
    try {
      const { filename } = req.params;
      const { rows = 10 } = req.query;

      if (!filename) {
        return res.status(400).json({
          success: false,
          message: 'Filename is required'
        });
      }

      const processResult = await this.csvService.processCSVFile(filename);
      
      res.json({
        success: true,
        message: 'CSV preview generated successfully',
        data: {
          filename: processResult.filename,
          totalValidRecords: processResult.validRecords,
          totalInvalidRecords: processResult.invalidRecords,
          preview: processResult.data.slice(0, parseInt(rows)),
          sampleErrors: processResult.errors.slice(0, 5)
        }
      });

    } catch (error) {
      logger.error('CSV preview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to preview CSV file',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = CsvController;