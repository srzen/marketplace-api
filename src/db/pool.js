// pool.js: Create a MySQL connection pool for efficient database interactions.

require("dotenv").config();

const mysql = require("mysql2/promise");

// Create a connection pool for interacting with the MySQL database.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

module.exports = pool;
