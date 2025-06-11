const knex = require('../database/connection');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.knex = knex;
  }

  async findAll(limit = null, offset = 0) {
    const query = this.knex(this.tableName);
    
    if (limit) {
      query.limit(limit).offset(offset);
    }
    
    return await query;
  }

  async findById(id) {
    return await this.knex(this.tableName).where('id', id).first();
  }

  async create(data) {
    const [result] = await this.knex(this.tableName).insert(data).returning('*');
    return result;
  }

  async update(id, data) {
    const [result] = await this.knex(this.tableName)
      .where('id', id)
      .update(data)
      .returning('*');
    return result;
  }

  async delete(id) {
    return await this.knex(this.tableName).where('id', id).del();
  }

  async count() {
    const result = await this.knex(this.tableName).count('id as count').first();
    return parseInt(result.count);
  }

  async exists(conditions) {
    const result = await this.knex(this.tableName).where(conditions).first();
    return !!result;
  }
}

module.exports = BaseRepository;