const express = require('express');
const CsvController = require('../controllers/CsvController');

const router = express.Router();
const csvController = new CsvController();

// GET /api/csv/files - Get list of available CSV files
router.get('/files', (req, res) => csvController.getAvailableFiles(req, res));

// POST /api/csv/process/:filename - Process specific CSV file
router.post('/process/:filename', (req, res) => csvController.processCSV(req, res));

// GET /api/csv/validate/:filename - Validate CSV file headers
router.get('/validate/:filename', (req, res) => csvController.validateCSV(req, res));

// GET /api/csv/preview/:filename - Preview CSV file content
router.get('/preview/:filename', (req, res) => csvController.previewCSV(req, res));

module.exports = router;