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

        // Sample product data associated with the seeded vendors.
        const products = [
          {
            name: "Mechanical Keyboard",
            description: "RGB backlit mechanical keyboard with Blue switches.",
            price: 89.99,
            stock: 45,
            vendor_id: vendorIds.v1,
          },
          {
            name: "Wireless Mouse",
            description: "Ergonomic wireless mouse with adjustable DPI.",
            price: 29.99,
            stock: 120,
            vendor_id: vendorIds.v1,
          },
          {
            name: '27" Monitor',
            description: "27-inch QHD IPS monitor with 75Hz refresh rate.",
            price: 249.99,
            stock: 30,
            vendor_id: vendorIds.v1,
          },
          {
            name: "USB-C Hub",
            description:
              "7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader.",
            price: 49.99,
            stock: 75,
            vendor_id: vendorIds.v1,
          },
          {
            name: "Bluetooth Speaker",
            description:
              "Portable Bluetooth speaker with 12-hour battery life.",
            price: 59.99,
            stock: 60,
            vendor_id: vendorIds.v2,
          },
          {
            name: "Smart Watch",
            description:
              "Fitness smartwatch with heart rate and sleep tracking.",
            price: 179.99,
            stock: 40,
            vendor_id: vendorIds.v2,
          },
          {
            name: "Noise Cancelling Headphones",
            description:
              "Over-ear wireless headphones with active noise cancellation.",
            price: 199.99,
            stock: 25,
            vendor_id: vendorIds.v2,
          },
          {
            name: "Portable SSD",
            description: "1TB USB-C portable solid-state drive.",
            price: 129.99,
            stock: 50,
            vendor_id: vendorIds.v2,
          },
          {
            name: "Coffee Maker",
            description: "12-cup programmable drip coffee maker.",
            price: 79.99,
            stock: 35,
            vendor_id: vendorIds.v3,
          },
          {
            name: "Air Fryer",
            description: "5.5L digital air fryer with 8 cooking presets.",
            price: 119.99,
            stock: 28,
            vendor_id: vendorIds.v3,
          },
          {
            name: "Desk Lamp",
            description:
              "LED desk lamp with adjustable brightness and USB charging port.",
            price: 34.99,
            stock: 90,
            vendor_id: vendorIds.v3,
          },
          {
            name: "Electric Kettle",
            description:
              "1.7L stainless steel electric kettle with auto shut-off.",
            price: 44.99,
            stock: 55,
            vendor_id: vendorIds.v3,
          },
        ];

        // Insert all products into the database.
        for (const product of products) {
          await connection.query(
            "INSERT INTO products (name, description, price, stock, vendor_id) VALUES (?, ?, ?, ?, ?)",
            [
              product.name,
              product.description,
              product.price,
              product.stock,
              product.vendor_id,
            ],
          );
        }

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
