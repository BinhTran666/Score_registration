const StudentService = require('../services/StudentService');
const logger = require('../utils/logger');

class StudentController {
  constructor() {
    this.studentService = new StudentService();
  }

  async getAllStudents(req, res) {
    try {
      const { page = 1, limit = 100 } = req.query;
      const result = await this.studentService.getAllStudents(page, limit);

      res.json({
        success: true,
        message: 'Students retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error('Get all students error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve students',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async getStudentBySbd(req, res) {
    try {
      const { sbd } = req.params;
      if (sbd < 0 || isNaN(sbd)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid SBD format. SBD must be a positive number.'
        });
      }
      const student = await this.studentService.getStudentBySbd(sbd);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student with SBD ${sbd} not found`
        });
      }

      res.json({
        success: true,
        message: 'Student retrieved successfully',
        data: student
      });
    } catch (error) {
      logger.error(`Get student ${req.params.sbd} error:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve student',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async createStudent(req, res) {
    try {
      const student = await this.studentService.createStudent(req.body);

      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student
      });
    } catch (error) {
      logger.error('Create student error:', error);
      
      const statusCode = error.message.includes('already exists') ? 409 : 
                        error.message.includes('Validation failed') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        message: 'Failed to create student',
        error: error.message
      });
    }
  }

  async updateStudent(req, res) {
    try {
      const { sbd } = req.params;
      const student = await this.studentService.updateStudent(sbd, req.body);

      res.json({
        success: true,
        message: 'Student updated successfully',
        data: student
      });
    } catch (error) {
      logger.error(`Update student ${req.params.sbd} error:`, error);
      
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('Validation failed') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        message: 'Failed to update student',
        error: error.message
      });
    }
  }

  async deleteStudent(req, res) {
    try {
      const { sbd } = req.params;
      await this.studentService.deleteStudent(sbd);

      res.json({
        success: true,
        message: 'Student deleted successfully'
      });
    } catch (error) {
      logger.error(`Delete student ${req.params.sbd} error:`, error);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: 'Failed to delete student',
        error: error.message
      });
    }
  }

  async getStudentsBySubjectScore(req, res) {
    try {
      const { subject } = req.params;
      const { minScore = 0 } = req.query;

      const students = await this.studentService.getStudentsBySubjectScore(subject, parseFloat(minScore));

      res.json({
        success: true,
        message: `Students with ${subject} score >= ${minScore} retrieved successfully`,
        data: {
          subject,
          minScore: parseFloat(minScore),
          count: students.length,
          students
        }
      });
    } catch (error) {
      logger.error(`Get students by ${req.params.subject} score error:`, error);
      res.status(400).json({
        success: false,
        message: 'Failed to retrieve students by subject score',
        error: error.message
      });
    }
  }

  async getSubjectStatistics(req, res) {
    try {
      const { subject } = req.params;
      const stats = await this.studentService.getSubjectStatistics(subject);

      res.json({
        success: true,
        message: `${subject} statistics retrieved successfully`,
        data: {
          subject,
          statistics: stats
        }
      });
    } catch (error) {
      logger.error(`Get ${req.params.subject} statistics error:`, error);
      res.status(400).json({
        success: false,
        message: 'Failed to retrieve subject statistics',
        error: error.message
      });
    }
  }
}

module.exports = StudentController;