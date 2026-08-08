// seed.js: This script seeds the MySQL database with sample data for vendors, products, orders, and order items.
// It first clears existing data in a dependency order to avoid foreign key violations, then inserts new records.
// The script prompts the user for confirmation before proceeding with the destructive operation.

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

  const userInput = await rl.question(
    "This script is destructive. Existing marketplace data will be deleted before seeding. Continue? (y/N) ",
  );
  rl.close();

  const confirmation = userInput.trim().toLowerCase();

  try {
    if (confirmation === "y" || confirmation === "yes") {
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
            key: "p1",
            name: "Mechanical Keyboard",
            description: "RGB backlit mechanical keyboard with Blue switches.",
            price: 89.99,
            stock: 45,
            vendor_id: vendorIds.v1,
          },
          {
            key: "p2",
            name: "Wireless Mouse",
            description: "Ergonomic wireless mouse with adjustable DPI.",
            price: 29.99,
            stock: 120,
            vendor_id: vendorIds.v1,
          },
          {
            key: "p3",
            name: '27" Monitor',
            description: "27-inch QHD IPS monitor with 75Hz refresh rate.",
            price: 249.99,
            stock: 30,
            vendor_id: vendorIds.v1,
          },
          {
            key: "p4",
            name: "USB-C Hub",
            description:
              "7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader.",
            price: 49.99,
            stock: 75,
            vendor_id: vendorIds.v1,
          },
          {
            key: "p5",
            name: "Bluetooth Speaker",
            description:
              "Portable Bluetooth speaker with 12-hour battery life.",
            price: 59.99,
            stock: 60,
            vendor_id: vendorIds.v2,
          },
          {
            key: "p6",
            name: "Smart Watch",
            description:
              "Fitness smartwatch with heart rate and sleep tracking.",
            price: 179.99,
            stock: 40,
            vendor_id: vendorIds.v2,
          },
          {
            key: "p7",
            name: "Noise Cancelling Headphones",
            description:
              "Over-ear wireless headphones with active noise cancellation.",
            price: 199.99,
            stock: 25,
            vendor_id: vendorIds.v2,
          },
          {
            key: "p8",
            name: "Portable SSD",
            description: "1TB USB-C portable solid-state drive.",
            price: 129.99,
            stock: 50,
            vendor_id: vendorIds.v2,
          },
          {
            key: "p9",
            name: "Coffee Maker",
            description: "12-cup programmable drip coffee maker.",
            price: 79.99,
            stock: 35,
            vendor_id: vendorIds.v3,
          },
          {
            key: "p10",
            name: "Air Fryer",
            description: "5.5L digital air fryer with 8 cooking presets.",
            price: 119.99,
            stock: 28,
            vendor_id: vendorIds.v3,
          },
          {
            key: "p11",
            name: "Desk Lamp",
            description:
              "LED desk lamp with adjustable brightness and USB charging port.",
            price: 34.99,
            stock: 90,
            vendor_id: vendorIds.v3,
          },
          {
            key: "p12",
            name: "Electric Kettle",
            description:
              "1.7L stainless steel electric kettle with auto shut-off.",
            price: 44.99,
            stock: 55,
            vendor_id: vendorIds.v3,
          },
        ];

        // Stores the generated database IDs for each product.
        // These IDs are later used as foreign keys for order_items.
        const productIds = {};

        // Insert all products into the database.
        for (const product of products) {
          const [result] = await connection.query(
            "INSERT INTO products (name, description, price, stock, vendor_id) VALUES (?, ?, ?, ?, ?)",
            [
              product.name,
              product.description,
              product.price,
              product.stock,
              product.vendor_id,
            ],
          );
          productIds[product.key] = result.insertId;
        }

        // Sample order data to seed the database.
        const orders = [
          {
            key: "o1",
            customerEmail: "john@example.com",
            shippingAddress: "4539 Clearview Drive, Crescent City, California",
            status: "Pending",
          },
          {
            key: "o2",
            customerEmail: "emma@example.com",
            shippingAddress: "2386 Carolina Avenue, Weslaco, Texas",
            status: "Processing",
          },
          {
            key: "o3",
            customerEmail: "alex@example.com",
            shippingAddress: "3709 Flinderation Road, Homewood, Illinois",
            status: "Delivered",
          },
        ];

        // Stores the generated database IDs for each order.
        // These IDs are later used as foreign keys for order_items.
        const orderIds = {};

        // Insert orders and map their generated IDs.
        for (const order of orders) {
          const [result] = await connection.query(
            "INSERT INTO orders (customer_email, shipping_address, status) VALUES (?, ?, ?)",
            [order.customerEmail, order.shippingAddress, order.status],
          );

          orderIds[order.key] = result.insertId;
        }

        // Sample order_items data associated with the seeded products and orders.
        const orderItems = [
          {
            order_id: orderIds.o1,
            product_id: productIds.p1,
            quantity: 2,
            unit_price: products.find((product) => product.key === "p1").price,
          },
          {
            order_id: orderIds.o1,
            product_id: productIds.p2,
            quantity: 1,
            unit_price: products.find((product) => product.key === "p2").price,
          },
          {
            order_id: orderIds.o2,
            product_id: productIds.p10,
            quantity: 2,
            unit_price: products.find((product) => product.key === "p10").price,
          },
          {
            order_id: orderIds.o2,
            product_id: productIds.p9,
            quantity: 1,
            unit_price: products.find((product) => product.key === "p9").price,
          },
          {
            order_id: orderIds.o3,
            product_id: productIds.p5,
            quantity: 1,
            unit_price: products.find((product) => product.key === "p5").price,
          },
          {
            order_id: orderIds.o3,
            product_id: productIds.p8,
            quantity: 3,
            unit_price: products.find((product) => product.key === "p8").price,
          },
          {
            order_id: orderIds.o3,
            product_id: productIds.p3,
            quantity: 2,
            unit_price: products.find((product) => product.key === "p3").price,
          },
        ];

        // Insert all order_items into the database.
        for (const orderItem of orderItems) {
          await connection.query(
            "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
            [
              orderItem.order_id,
              orderItem.product_id,
              orderItem.quantity,
              orderItem.unit_price,
            ],
          );
        }

        // Save all changes permanently.
        await connection.commit();
        console.log(
          `Database seeded successfully.

        Inserted:
        - 3 vendors
        - 12 products
        - 3 orders
        - 7 order items`,
        );
      } catch (error) {
        // Revert all database changes if any step fails.
        await connection.rollback();
        console.error("Transaction failed. All changes rolled back: ", error);
        throw error;
      } finally {
        // Return the connection to the pool.
        connection.release();
      }
    } else {
      console.log("Seeding cancelled.");
    }
  } finally {
    // Close the connection pool before exiting.
    await pool.end();
  }
}

startSeeding();
