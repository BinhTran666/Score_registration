const logger = require("../utils/logger");
const BaseRepository = require("./BaseRepository");

class StudentRepository extends BaseRepository {
  constructor() {
    super("students");
  }

  async count() {
    try {
      const result = await this.db("students").count("id as count").first();
      return parseInt(result.count) || 0;
    } catch (error) {
      logger.error("Error counting students:", error);
      throw error;
    }
  }
  async findBySbd(sbd) {
    return await this.db(this.tableName).where("sbd", sbd).first();
  }

  async findBySubjectScore(subject, minScore) {
    return await this.db(this.tableName)
      .whereNotNull(subject)
      .where(subject, ">=", minScore);
  }

  async bulkInsert(students) {
    try {
      if (!students || !Array.isArray(students) || students.length === 0) {
        throw new Error("No students data provided for bulk insert");
      }

      // Use Knex batch insert
      const result = await this.db("students").insert(students);
      logger.info(`✅ Bulk insert completed: ${students.length} records`);
      return result;
    } catch (error) {
      logger.error("Error in bulk insert:", error);
      throw error;
    }
  }

  async getScoresBySubject(subject) {
    return await this.db(this.tableName)
      .select("sbd", subject)
      .whereNotNull(subject);
  }

  async getTopScorers(subject, limit = 10) {
    return await this.db(this.tableName)
      .select("sbd", subject)
      .whereNotNull(subject)
      .orderBy(subject, "desc")
      .limit(limit);
  }

  async getStatsBySubject(subject) {
    const result = await this.db(this.tableName)
      .whereNotNull(subject)
      .select(
        this.db.raw(`AVG(${subject}) as average`),
        this.db.raw(`MAX(${subject}) as maximum`),
        this.db.raw(`MIN(${subject}) as minimum`),
        this.db.raw(`COUNT(*) as total_students`)
      )
      .first();

    return {
      average: parseFloat(result.average || 0).toFixed(2),
      maximum: parseFloat(result.maximum || 0),
      minimum: parseFloat(result.minimum || 0),
      totalStudents: parseInt(result.total_students || 0),
    };
  }
}

module.exports = StudentRepository;
