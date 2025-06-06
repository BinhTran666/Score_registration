const BaseRepository = require('./BaseRepository');

class StudentRepository extends BaseRepository {
  constructor() {
    super('students');
  }

  async findBySbd(sbd) {
    return await this.db(this.tableName)
      .where('sbd', sbd)
      .first();
  }

  async findBySubjectScore(subject, minScore) {
    return await this.db(this.tableName)
      .whereNotNull(subject)
      .where(subject, '>=', minScore);
  }

  async bulkInsert(students) {
    return await this.db(this.tableName)
      .insert(students)
      .onConflict('sbd')
      .merge();
  }

  async getScoresBySubject(subject) {
    return await this.db(this.tableName)
      .select('sbd', subject)
      .whereNotNull(subject);
  }

  async getTopScorers(subject, limit = 10) {
    return await this.db(this.tableName)
      .select('sbd', subject)
      .whereNotNull(subject)
      .orderBy(subject, 'desc')
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
      totalStudents: parseInt(result.total_students || 0)
    };
  }
}

module.exports = StudentRepository;