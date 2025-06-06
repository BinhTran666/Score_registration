const database = require('../database/connection');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = database.getConnection();
  }

  async findAll(limit = 100, offset = 0) {
    return await this.db(this.tableName)
      .limit(limit)
      .offset(offset);
  }

  async findById(id) {
    return await this.db(this.tableName)
      .where('id', id)
      .first();
  }

  async create(data) {
    const [result] = await this.db(this.tableName)
      .insert(data)
      .returning('*');
    return result;
  }

  async update(id, data) {
    const [result] = await this.db(this.tableName)
      .where('id', id)
      .update({
        ...data,
        updated_at: new Date()
      })
      .returning('*');
    return result;
  }

  async delete(id) {
    return await this.db(this.tableName)
      .where('id', id)
      .del();
  }

  async exists(field, value) {
    const result = await this.db(this.tableName)
      .where(field, value)
      .first();
    return !!result;
  }

  async count() {
    const result = await this.db(this.tableName).count('* as count').first();
    return parseInt(result.count);
  }
}

module.exports = BaseRepository;