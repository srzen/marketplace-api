// orders.js

const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// GET /orders
// Retrieve and return all orders from the database.
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM orders");
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /orders/:id
// Retrieve a single order by its ID.
router.get("/:id", async (req, res) => {
  try {
    const [order] = await pool.query(
      `SELECT 
      orders.id AS order_id,
      orders.customer_email,
      orders.shipping_address,
      orders.status,
      orders.created_at,
      order_items.product_id,
      products.name AS product_name,
      order_items.quantity,
      order_items.unit_price,
      vendors.id AS vendor_id,
      vendors.name AS vendor_name
      FROM orders 
      JOIN order_items ON orders.id = order_items.order_id 
      JOIN products ON order_items.product_id = products.id
      JOIN vendors ON products.vendor_id = vendors.id 
      WHERE orders.id = ?
      ORDER BY order_items.id ASC`,
      [req.params.id],
    );

    // Return 404 if no order exists with the provided ID.
    if (!order.length) {
      return res
        .status(404)
        .json({ error: "Order not found", id: req.params.id });
    }
    const items = order.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      vendor_id: item.vendor_id,
      vendor_name: item.vendor_name,
    }));

    res.status(200).json({
      id: order[0].order_id,
      customer_email: order[0].customer_email,
      shipping_address: order[0].shipping_address,
      status: order[0].status,
      created_at: order[0].created_at,
      items: items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /orders
// Create a new order after validating the request body.
router.post("/", async (req, res) => {
  // Ensure all required fields are provided.
  if (
    !req.body ||
    !req.body.customer_email ||
    !req.body.shipping_address ||
    !req.body.items.length
  ) {
    return res.status(400).json({ error: "Body missing a required field" });
  }

  // Only allow expected product properties.
  const allowedKeys = ["customer_email", "shipping_address", "items"];

  // Validate submitted fields.
  for (const [key, value] of Object.entries(req.body)) {
    if (!validateInput(value) || !allowedKeys.includes(key)) {
      return res.status(400).json({ error: "Invalid request body" });
    }
  }

  // Check all the products are exist and active.
  const productIds = req.body.items.map((item) => item.product_id);
  const [products] = await pool.query(
    "SELECT id, price FROM products WHERE id IN (?) AND is_active = TRUE",
    [productIds],
  );

  // Check for duplicate products before comparing with DB.
  if (new Set(productIds).size !== productIds.length) {
    return res.status(400).json({ error: "Items have duplicate products." });
  }

  if (products.length !== productIds.length) {
    return res
      .status(400)
      .json({ error: "One or more requested products are unavailable." });
  }

  const connection = await pool.getConnection();
  try {
    // Get a connection to database transaction.
    await connection.beginTransaction();

    // Insert the order first and get the ID.
    const [result] = await connection.query(
      "INSERT INTO orders (customer_email, shipping_address, status) VALUES (?, ?, ?)",
      [req.body.customer_email, req.body.shipping_address, "Pending"],
    );

    // Insert the order items with the order ID.
    for (const items of req.body.items) {
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
        [
          result.insertId,
          items.product_id,
          items.quantity,
          products.find((product) => product.id === items.product_id).price,
        ],
      );
    }

    // Save all changes permanently.
    await connection.commit();
    res
      .status(201)
      .json({ message: "Order created successfully", id: result.insertId });
  } catch (error) {
    // Revert all database changes if a step fails.
    await connection.rollback();
    console.error("Transaction failed. All changes rolled back: ", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    connection.release();
  }
});

// PATCH /orders/:id
// Update one or more order fields without replacing the entire record.
router.patch("/:id", async (req, res) => {
  const cols = [];
  const values = [];

  // Fields that clients are allowed to update.
  const allowedKeys = ["customer_email", "shipping_address", "status"];

  const body = req.body ?? {};

  // Validate the request body while building the dynamic UPDATE query.
  for (const [key, value] of Object.entries(body)) {
    if (!validateInput(value) || !allowedKeys.includes(key)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    cols.push(`${key} = ?`);
    values.push(value);
  }

  // Allow updating customer info only while the order is Pending or Processing.
  const [currentStatus] = await pool.query(
    "SELECT status FROM orders WHERE id = ?",
    [req.params.id],
  );

  // If no rows were returned, the order ID doesn't exist.
  if (!currentStatus.length) {
    return res
      .status(404)
      .json({ error: "Order not found", id: req.params.id });
  }

  if (
    currentStatus[0].status !== "Pending" &&
    currentStatus[0].status !== "Processing"
  ) {
    return res.status(409).json({
      error: "Orders can't be updated after being processed.",
      id: req.params.id,
    });
  }

  // At least one valid field must be supplied for PATCH.
  if (cols.length && values.length) {
    try {
      const [result] = await pool.query(
        `UPDATE orders SET ${cols.join(", ")} WHERE id = ?`,
        [...values, req.params.id],
      );

      // If no rows were updated, the order ID doesn't exist.
      if (!result.affectedRows) {
        return res
          .status(404)
          .json({ error: "Order not found", id: req.params.id });
      }

      res
        .status(200)
        .json({ message: "Order updated successfully", id: req.params.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(400).json({ error: "Body missing a required field" });
  }
});

// DELETE /orders/:id
// Remove an order from the databse.
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM orders WHERE id = ?", [
      req.params.id,
    ]);

    // Return 404 if the order does not exist.
    if (!result.affectedRows) {
      return res
        .status(404)
        .json({ error: "Order not found", id: req.params.id });
    }

    res
      .status(200)
      .json({ message: "Order deleted successfully", id: req.params.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Returns true if the input is a valid number, a non-empty string
// after trimming whitespace or a non-empty array.
function validateInput(input) {
  if (typeof input === "number") {
    return input > 0;
  }

  if (typeof input === "string") {
    return input.trim().length > 0;
  }

  if (typeof input === "object") {
    return input.length > 0;
  }

  return false;
}

module.exports = router;
