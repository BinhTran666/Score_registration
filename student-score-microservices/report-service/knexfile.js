require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5433,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'scores_student'
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations_reports'
    },
    seeds: {
      directory: './seeds'
    }
  },
  
  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations_reports'
    },
    seeds: {
      directory: './seeds'
    }
  }
};