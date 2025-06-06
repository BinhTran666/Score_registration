const StudentRepository = require('../repositories/StudentRepository');
const Student = require('../models/Student');
const logger = require('../utils/logger');

class StudentService {
  constructor() {
    this.studentRepository = new StudentRepository();
  }

  async getAllStudents(page = 1, limit = 100) {
    try {
      const offset = (page - 1) * limit;
      const students = await this.studentRepository.findAll(limit, offset);
      const total = await this.studentRepository.count();

      return {
        students: students.map(s => new Student(s).toJSON()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching students:', error);
      throw new Error('Failed to fetch students');
    }
  }

  async getStudentBySbd(sbd) {
    try {
      const studentData = await this.studentRepository.findBySbd(sbd);
      
      if (!studentData) {
        return null;
      }

      return new Student(studentData).toJSON();
    } catch (error) {
      logger.error(`Error fetching student ${sbd}:`, error);
      throw new Error('Failed to fetch student');
    }
  }

  async createStudent(studentData) {
    try {
      const student = new Student(studentData);
      const validation = student.validate();

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if student already exists
      const exists = await this.studentRepository.findBySbd(student.sbd);
      if (exists) {
        throw new Error(`Student with SBD ${student.sbd} already exists`);
      }

      const created = await this.studentRepository.create(student.toJSON());
      return new Student(created).toJSON();
    } catch (error) {
      logger.error('Error creating student:', error);
      throw error;
    }
  }

  async updateStudent(sbd, studentData) {
    try {
      const existingStudent = await this.studentRepository.findBySbd(sbd);
      if (!existingStudent) {
        throw new Error(`Student with SBD ${sbd} not found`);
      }

      const updatedData = { ...existingStudent, ...studentData };
      const student = new Student(updatedData);
      const validation = student.validate();

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const updated = await this.studentRepository.update(existingStudent.id, student.toJSON());
      return new Student(updated).toJSON();
    } catch (error) {
      logger.error(`Error updating student ${sbd}:`, error);
      throw error;
    }
  }

  async deleteStudent(sbd) {
    try {
      const student = await this.studentRepository.findBySbd(sbd);
      if (!student) {
        throw new Error(`Student with SBD ${sbd} not found`);
      }

      await this.studentRepository.delete(student.id);
      return true;
    } catch (error) {
      logger.error(`Error deleting student ${sbd}:`, error);
      throw error;
    }
  }

  async bulkImportStudents(students) {
    try {
      logger.info(`Starting bulk import of ${students.length} students`);
      
      const result = await this.studentRepository.bulkInsert(students);
      
      logger.info(`Bulk import completed successfully`);
      return {
        imported: students.length,
        message: 'Students imported successfully'
      };
    } catch (error) {
      logger.error('Error in bulk import:', error);
      throw new Error('Failed to import students');
    }
  }

  async getStudentsBySubjectScore(subject, minScore) {
    try {
      const validSubjects = ['toan', 'ngu_van', 'ngoai_ngu', 'vat_li', 'hoa_hoc', 'sinh_hoc', 'lich_su', 'dia_li', 'gdcd'];
      
      if (!validSubjects.includes(subject)) {
        throw new Error(`Invalid subject: ${subject}`);
      }

      const students = await this.studentRepository.findBySubjectScore(subject, minScore);
      return students.map(s => new Student(s).toJSON());
    } catch (error) {
      logger.error(`Error fetching students by ${subject} score:`, error);
      throw error;
    }
  }

  async getSubjectStatistics(subject) {
    try {
      const validSubjects = ['toan', 'ngu_van', 'ngoai_ngu', 'vat_li', 'hoa_hoc', 'sinh_hoc', 'lich_su', 'dia_li', 'gdcd'];
      
      if (!validSubjects.includes(subject)) {
        throw new Error(`Invalid subject: ${subject}`);
      }

      return await this.studentRepository.getStatsBySubject(subject);
    } catch (error) {
      logger.error(`Error fetching ${subject} statistics:`, error);
      throw error;
    }
  }
}

module.exports = StudentService;