// orders.js

const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

router.get("/", (req, res) => {
  res.status(200).json({ message: "List all orders" });
});

router.get("/:id", (req, res) => {
  if (req.params.id === "999") {
    return res
      .status(404)
      .json({ error: "Order not found", id: req.params.id });
  }
  res.status(200).json({ message: "Get order by ID", id: req.params.id });
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
      [req.body.customer_email, req.body.shipping_address, "Processing"],
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

router.patch("/:id", (req, res) => {
  res.status(200).json({ message: "Update a order", id: req.params.id });
});

router.delete("/:id", (req, res) => {
  res.status(200).json({ message: "Delete a order", id: req.params.id });
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
