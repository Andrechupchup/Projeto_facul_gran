const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://doaciclo:doaciclo@localhost:5432/doaciclo',
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
