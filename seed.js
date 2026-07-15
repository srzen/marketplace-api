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
      // Get a connection to database transaction.
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        // Clear existing data in dependency order to avoid
        // foreign key violations.
        await connection.query("DELETE FROM order_items");
        await connection.query("DELETE FROM orders");
        await connection.query("DELETE FROM products");
        await connection.query("DELETE FROM vendors");

        // Sample vendor data to seed the database.
        const vendors = [
          {
            key: "v1",
            name: "Tech Haven",
            email: "tech@haven.com",
            phone: "+1 704 902 7418",
          },
          {
            key: "v2",
            name: "Gadget World",
            email: "sales@gadgetworld.com",
            phone: "+1 713 515 3068",
          },
          {
            key: "v3",
            name: "Home Essentials",
            email: "hello@homeessentials.com",
            phone: "+1 323 317 1094",
          },
        ];

        // Stores the generated database IDs for each vendor.
        // These IDs are later used as foreign keys for products.
        const vendorIds = {};

        // Insert vendors and map their generated IDs.
        for (const vendor of vendors) {
          const [result] = await connection.query(
            "INSERT INTO vendors (name, email, phone) VALUES (?, ?, ?)",
            [vendor.name, vendor.email, vendor.phone],
          );

          vendorIds[vendor.key] = result.insertId;
        }

        console.log(vendorIds);

        // Save all changes permanently.
        await connection.commit();
        console.log("Transaction completed successfully.");
      } catch (error) {
        // Revert all database changes if any step fails.
        await connection.rollback();
        console.error("Transaction failed. All changes rolled back: ", error);
        throw error;
      } finally {
        // Return the connection to the pool.
        connection.release();
      }
    }
  } finally {
    // Close the connection pool before exiting.
    await pool.end();
  }
}

startSeeding();
