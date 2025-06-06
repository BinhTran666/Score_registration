const knex = require('knex');
const config = require('../../knexfile');

class Database {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.connection = null;
  }

  getConnection() {
    if (!this.connection) {
      this.connection = knex(config[this.environment]);
    }
    return this.connection;
  }

  async testConnection() {
    try {
      await this.getConnection().raw('SELECT 1');
      return true;
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  async closeConnection() {
    if (this.connection) {
      await this.connection.destroy();
      this.connection = null;
    }
  }
}

module.exports = new Database();