// seed.js

require("dotenv").config();

const mysql = require("mysql2/promise");
const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");

async function startSeeding() {
  // Create a connection pool for interacting with the MySQL database.
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
  });

  // Ask user before deleting existing database records.
  const rl = readline.createInterface({ input, output });

  const confirmation = await rl.question(
    "This action will erase all existing database data and replace it with sample data. Do you want to continue seeding? y or n ",
  );
  rl.close();

  try {
    if (confirmation === "y") {
      console.log("Start the process");
    }
  } finally {
    // Close the connection pool before exiting.
    await pool.end();
  }
}

startSeeding();
