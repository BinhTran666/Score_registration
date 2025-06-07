const knex = require('knex');
const config = require('../../knexfile');
require('dotenv').config();

const environment = process.env.NODE_ENV || 'development';
const knexConfig = config[environment];

const db = knex(knexConfig);

// Test connection on startup
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ Report Service: Database connected successfully');
  })
  .catch(err => {
    console.error('❌ Report Service: Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = db;