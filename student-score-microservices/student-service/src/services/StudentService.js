const StudentRepository = require("../repositories/StudentRepository");
const Student = require("../models/Student");
const logger = require("../utils/logger");

class StudentService {
  constructor() {
    this.studentRepository = new StudentRepository();
  }

  async getStudentCount() {
    try {
      // Use the repository instead of this.db
      const count = await this.studentRepository.count();
      return count || 0;
    } catch (error) {
      logger.error("Error getting student count:", error);
      return 0;
    }
  }

  async getAllStudents(page = 1, limit = 100) {
    try {
      const offset = (page - 1) * limit;
      const students = await this.studentRepository.findAll(limit, offset);
      const total = await this.studentRepository.count();

      return {
        students: students.map((s) => new Student(s).toJSON()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Error fetching students:", error);
      throw new Error("Failed to fetch students");
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
      throw new Error("Failed to fetch student");
    }
  }

  async createStudent(studentData) {
    try {
      const student = new Student(studentData);
      const validation = student.validate();

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      // Check if student already exists
      const exists = await this.studentRepository.findBySbd(student.sbd);
      if (exists) {
        throw new Error(`Student with SBD ${student.sbd} already exists`);
      }

      const created = await this.studentRepository.create(student.toJSON());
      return new Student(created).toJSON();
    } catch (error) {
      logger.error("Error creating student:", error);
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
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      const updated = await this.studentRepository.update(
        existingStudent.id,
        student.toJSON()
      );
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
    logger.info(`📥 Starting optimized bulk import of ${students.length} students`);

    // CRITICAL: Validate input first
    if (!students || !Array.isArray(students)) {
      throw new Error('Invalid students data: must be an array');
    }

    if (students.length === 0) {
      logger.warn('⚠️ No students provided for import');
      return {
        imported: 0,
        failed: 0,
        total: 0,
        successRate: 0,
        message: "No students to import",
      };
    }

    // CRITICAL: Debug the input
    logger.info(`🔍 BULK IMPORT DEBUG: Received ${students.length} students`);
    logger.info(`🔍 BULK IMPORT DEBUG: Batch size: ${this.batchSize}`);
    logger.info(`🔍 BULK IMPORT DEBUG: First student: ${JSON.stringify(students[0])}`);

    let totalImported = 0;
    let totalFailed = 0;

    // CRITICAL: Fix the batch processing loop
    const totalStudents = students.length;
    const batchSize = this.batchSize || 200; // Ensure batchSize is not undefined

    logger.info(`🔍 BULK IMPORT DEBUG: Processing ${totalStudents} students in batches of ${batchSize}`);

    // Process in smaller batches to manage memory
    for (let i = 0; i < totalStudents; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(totalStudents / batchSize);

      logger.info(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)`);
      logger.info(`🔍 BATCH DEBUG: i=${i}, batchSize=${batchSize}, batch.length=${batch.length}`);

      try {
        // Validate batch
        if (!batch || !Array.isArray(batch) || batch.length === 0) {
          logger.warn(`⚠️ Empty or invalid batch ${batchNumber}, skipping...`);
          continue;
        }

        // CRITICAL: Remove null/undefined values that cause DB issues
        const cleanBatch = batch.map(student => {
          const cleanStudent = { ...student };
          // Remove null id, created_at, updated_at - let DB handle these
          delete cleanStudent.id;
          delete cleanStudent.created_at;
          delete cleanStudent.updated_at;
          return cleanStudent;
        });

        logger.info(`🔍 BATCH DEBUG: Clean batch sample: ${JSON.stringify(cleanBatch[0])}`);

        // Insert batch into database
        await this.studentRepository.bulkInsert(cleanBatch);
        totalImported += batch.length;

        // Log progress
        const progress = ((totalImported / totalStudents) * 100).toFixed(1);
        logger.info(`✅ Batch ${batchNumber} completed. Progress: ${progress}% (${totalImported}/${totalStudents})`);

        // Memory management
        batch.length = 0; // Clear batch from memory
        
        if (global.gc && batchNumber % 10 === 0) {
          global.gc(); // Force garbage collection every 10 batches
        }

        // Small delay to prevent overwhelming the database
        if (batchNumber % 50 === 0) {
          logger.info(`🔄 Pausing briefly after ${batchNumber} batches...`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (batchError) {
        logger.error(`❌ Batch ${batchNumber} failed:`, {
          error: batchError.message,
          batchSize: batch.length,
          sampleRecord: batch[0]
        });
        totalFailed += batch.length;
        
        // Continue with next batch instead of failing completely
        continue;
      }
    }

    logger.info(`🎉 Bulk import completed!`);
    logger.info(`✅ Successfully imported: ${totalImported}`);
    logger.info(`❌ Failed to import: ${totalFailed}`);
    
    const successRate = totalStudents > 0 ? (totalImported / totalStudents) * 100 : 0;
    logger.info(`📊 Success rate: ${successRate.toFixed(1)}%`);
    
    return {
      imported: totalImported,
      failed: totalFailed,
      total: totalStudents,
      successRate: successRate,
      message: `Successfully imported ${totalImported} out of ${totalStudents} students`,
    };

  } catch (error) {
    logger.error("Critical error in bulk import:", {
      message: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to import students: ${error.message}`);
  }
}

  async getStudentsBySubjectScore(subject, minScore) {
    try {
      const validSubjects = [
        "toan",
        "ngu_van",
        "ngoai_ngu",
        "vat_li",
        "hoa_hoc",
        "sinh_hoc",
        "lich_su",
        "dia_li",
        "gdcd",
      ];

      if (!validSubjects.includes(subject)) {
        throw new Error(`Invalid subject: ${subject}`);
      }

      const students = await this.studentRepository.findBySubjectScore(
        subject,
        minScore
      );
      return students.map((s) => new Student(s).toJSON());
    } catch (error) {
      logger.error(`Error fetching students by ${subject} score:`, error);
      throw error;
    }
  }

  async getSubjectStatistics(subject) {
    try {
      const validSubjects = [
        "toan",
        "ngu_van",
        "ngoai_ngu",
        "vat_li",
        "hoa_hoc",
        "sinh_hoc",
        "lich_su",
        "dia_li",
        "gdcd",
      ];

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
