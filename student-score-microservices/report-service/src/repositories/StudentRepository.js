const BaseRepository = require('./BaseRepository');
const Student = require('../models/Student');
const logger = require('../utils/logger');

class StudentRepository extends BaseRepository {
  constructor() {
    super('students');
  }

  async createBatch(studentsData, batchSize = 100) {
    const results = {
      inserted: 0,
      updated: 0,
      errors: 0,
      errorDetails: []
    };

    logger.info(`📥 Starting batch import of ${studentsData.length} students (batch size: ${batchSize})`);

    for (let i = 0; i < studentsData.length; i += batchSize) {
      const batch = studentsData.slice(i, i + batchSize);
      
      try {
        // Use transaction for batch processing
        await this.knex.transaction(async (trx) => {
          for (const studentData of batch) {
            try {
              // Clean the student data - remove any id field
              const cleanStudentData = {
                sbd: studentData.sbd,
                toan: studentData.toan,
                ngu_van: studentData.ngu_van,
                ngoai_ngu: studentData.ngoai_ngu,
                vat_li: studentData.vat_li,
                hoa_hoc: studentData.hoa_hoc,
                sinh_hoc: studentData.sinh_hoc,
                lich_su: studentData.lich_su,
                dia_li: studentData.dia_li,
                gdcd: studentData.gdcd,
                ma_ngoai_ngu: studentData.ma_ngoai_ngu
              };

              // Check if student exists
              const existing = await trx('students').where('sbd', cleanStudentData.sbd).first();
              
              if (existing) {
                // Update existing student
                await trx('students').where('sbd', cleanStudentData.sbd).update({
                  ...cleanStudentData,
                  updated_at: trx.fn.now()
                });
                results.updated++;
              } else {
                // Insert new student - DO NOT include id field
                await trx('students').insert({
                  ...cleanStudentData,
                  created_at: trx.fn.now(),
                  updated_at: trx.fn.now()
                });
                results.inserted++;
              }
            } catch (error) {
              logger.error(`Error processing student ${studentData.sbd}:`, error.message);
              results.errors++;
              results.errorDetails.push({
                sbd: studentData.sbd,
                error: error.message
              });
            }
          }
        });

        // Log progress
        const currentBatch = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(studentsData.length / batchSize);
        logger.info(`📊 Batch ${currentBatch}/${totalBatches}: ${results.inserted} inserted, ${results.updated} updated, ${results.errors} errors`);

      } catch (error) {
        logger.error(`Error processing batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        results.errors += batch.length;
        
        // Add detailed error info
        batch.forEach(student => {
          results.errorDetails.push({
            sbd: student.sbd,
            error: error.message
          });
        });
      }
    }

    logger.info(`✅ Batch import completed: ${results.inserted} inserted, ${results.updated} updated, ${results.errors} errors`);
    
    // Log first few errors for debugging
    if (results.errorDetails.length > 0) {
      logger.error('🚨 First few database errors:', results.errorDetails.slice(0, 3));
    }
    
    return results;
  }

  async findBySbd(sbd) {
    try {
      return await this.knex(this.tableName)
        .where('sbd', sbd)
        .first();
    } catch (error) {
      logger.error(`Error finding student by SBD ${sbd}:`, error.message);
      throw error;
    }
  }

  async countValidStudents() {
    try {
      const result = await this.knex(this.tableName)
        .count('id as count')
        .whereNotNull('sbd')
        .where('sbd', '!=', '')
        .first();
      
      return parseInt(result.count) || 0;
    } catch (error) {
      logger.error('Error counting valid students:', error.message);
      throw error;
    }
  }

  async deleteAll() {
    try {
      const result = await this.knex(this.tableName).del();
      logger.info(`🗑️ Deleted ${result} students from report database`);
      return result;
    } catch (error) {
      logger.error('Error deleting all students:', error.message);
      throw error;
    }
  }

  // Add this method to check what data is being passed
  async debugInsert(studentData) {
    logger.info('🔍 Debug - Student data being inserted:', {
      keys: Object.keys(studentData),
      hasId: 'id' in studentData,
      idValue: studentData.id,
      sbd: studentData.sbd
    });
  }
}

module.exports = StudentRepository;