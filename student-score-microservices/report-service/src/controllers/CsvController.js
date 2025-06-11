const CsvService = require('../services/CsvService');
const logger = require('../utils/logger');

class CsvController {
  constructor() {
    this.csvService = new CsvService();
  }

  async getAvailableFiles(req, res) {
    try {
      const files = this.csvService.getAvailableFiles();

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

      logger.info(`🚀 Processing CSV file in report service: ${filename}`);

      // Process the CSV file using the new service
      const processResult = await this.csvService.processCSVFile(filename);

      if (processResult.validRecords === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid records found in CSV',
          data: processResult
        });
      }

      res.json({
        success: true,
        message: 'CSV processed and imported successfully',
        data: {
          filename: processResult.filename,
          validRecords: processResult.validRecords,
          invalidRecords: processResult.invalidRecords,
          testMode: processResult.testMode,
          totalProcessed: processResult.totalProcessed,
          importResult: processResult.importResult,
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

      const validation = await this.csvService.validateCSVFile(filename);

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
      const { rows = 5 } = req.query;

      if (!filename) {
        return res.status(400).json({
          success: false,
          message: 'Filename is required'
        });
      }

      const preview = await this.csvService.previewCSVFile(filename, parseInt(rows));
      
      res.json({
        success: true,
        message: 'CSV preview generated successfully',
        data: preview
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

  async getProcessingStatus(req, res) {
    try {
      // Simple status for now - can be enhanced later
      const status = {
        isProcessing: false,
        message: 'No active processing',
        service: 'report-service'
      };
      
      res.json({
        success: true,
        data: status,
        message: 'Processing status retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting processing status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get processing status',
        error: error.message
      });
    }
  }
}

module.exports = CsvController;