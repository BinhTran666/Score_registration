const express = require('express');
const StudentController = require('../controllers/StudentController');

const router = express.Router();
const studentController = new StudentController();

// GET /api/students - Get all students with pagination
router.get('/', (req, res) => studentController.getAllStudents(req, res));

// GET /api/students/:sbd - Get student by SBD
router.get('/:sbd', (req, res) => studentController.getStudentBySbd(req, res));

// POST /api/students - Create new student
router.post('/', (req, res) => studentController.createStudent(req, res));

// PUT /api/students/:sbd - Update student
router.put('/:sbd', (req, res) => studentController.updateStudent(req, res));

// DELETE /api/students/:sbd - Delete student
router.delete('/:sbd', (req, res) => studentController.deleteStudent(req, res));

// GET /api/students/subject/:subject/scores - Get students by subject score
router.get('/subject/:subject/scores', (req, res) => studentController.getStudentsBySubjectScore(req, res));

// GET /api/students/subject/:subject/statistics - Get subject statistics
router.get('/subject/:subject/statistics', (req, res) => studentController.getSubjectStatistics(req, res));

module.exports = router;