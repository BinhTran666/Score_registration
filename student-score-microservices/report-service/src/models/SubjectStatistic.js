const knex = require('../database/connection');

class SubjectStatistics {
  constructor(data = {}) {
    this.id = data.id;
    this.subjectCode = data.subject_code;
    this.subjectName = data.subject_name;
    this.scoreLevel = data.score_level;
    this.minScore = data.min_score;
    this.maxScore = data.max_score;
    this.studentCount = data.student_count || 0;
    this.percentage = data.percentage || 0;
    this.calculatedAt = data.calculated_at;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static get tableName() {
    return 'subject_statistics';
  }

  // Get all statistics
  static async getAll() {
    try {
      const rows = await knex(this.tableName).select('*').orderBy(['subject_code', 'min_score'], ['asc', 'desc']);
      return rows.map(row => new SubjectStatistics(row));
    } catch (error) {
      throw new Error(`Failed to get all statistics: ${error.message}`);
    }
  }

  // Get statistics by subject
  static async getBySubject(subjectCode) {
    try {
      const rows = await knex(this.tableName)
        .where('subject_code', subjectCode)
        .orderBy('min_score', 'desc');
      return rows.map(row => new SubjectStatistics(row));
    } catch (error) {
      throw new Error(`Failed to get statistics for subject ${subjectCode}: ${error.message}`);
    }
  }

  // Update or insert statistics
  static async upsert(data) {
    try {
      const existing = await knex(this.tableName)
        .where({
          subject_code: data.subject_code,
          score_level: data.score_level
        })
        .first();

      if (existing) {
        await knex(this.tableName)
          .where({ id: existing.id })
          .update({
            student_count: data.student_count,
            percentage: data.percentage,
            calculated_at: knex.fn.now(),
            updated_at: knex.fn.now()
          });
        return existing.id;
      } else {
        const [id] = await knex(this.tableName).insert({
          ...data,
          calculated_at: knex.fn.now(),
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }).returning('id');
        return id;
      }
    } catch (error) {
      throw new Error(`Failed to upsert statistics: ${error.message}`);
    }
  }

  // Initialize default statistics for all subjects and levels
  static async initializeDefaults() {
    const Subjects = require('../config/Subjects');
    const ScoreLevels = require('../config/ScoreLevels');
    
    const subjects = Subjects.getAllSubjects();
    const levels = ScoreLevels.getAllLevels();
    
    try {
      for (const subject of subjects) {
        for (const level of levels) {
          await this.upsert({
            subject_code: subject.code,
            subject_name: subject.name,
            score_level: level.code,
            min_score: level.minScore,
            max_score: level.maxScore,
            student_count: 0,
            percentage: 0
          });
        }
      }
      console.log('Default statistics initialized successfully');
    } catch (error) {
      throw new Error(`Failed to initialize defaults: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      subject_code: this.subjectCode,
      subject_name: this.subjectName, 
      score_level: this.scoreLevel,
      min_score: this.minScore,
      max_score: this.maxScore,
      student_count: this.studentCount,
      percentage: this.percentage,
      calculated_at: this.calculatedAt
    };
  }
}

module.exports = SubjectStatistics;