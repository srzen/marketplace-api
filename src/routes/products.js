// products.js

const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// GET /products
// Retrieve and return all products from the database.
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products");
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

// GET /product/:id
// Retrieve a single product by its ID.
router.get("/:id", async (req, res) => {
  try {
    const [product] = await pool.query("SELECT * FROM products WHERE id = ?", [
      req.params.id,
    ]);

    // Return 404 if no product exists with the provided ID.
    if (!product.length) {
      return res
        .status(404)
        .json({ error: "Product not found", id: req.params.id });
    }

    res.status(200).json(product[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /products
// Create a new product after validating the request body.
router.post("/", async (req, res) => {
  // Ensure all required fields are provided.
  if (
    !req.body ||
    !req.body.name ||
    !req.body.description ||
    !req.body.price ||
    !req.body.stock ||
    !req.body.vendor_id
  ) {
    return res.status(400).json({ error: "Body missing a required field" });
  }

  // Only allow expected product properties.
  const allowedKeys = ["name", "description", "price", "stock", "vendor_id"];

  // Validate every submitted field.
  for (const [key, value] of Object.entries(req.body)) {
    if (!validateInput(value) || !allowedKeys.includes(key)) {
      return res.status(400).json({ error: "Invalid request body" });
    }
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO products (name, description, price, stock, vendor_id) VALUES (?, ?, ?, ?, ?)",
      [
        req.body.name,
        req.body.description,
        req.body.price,
        req.body.stock,
        req.body.vendor_id,
      ],
    );

    res
      .status(201)
      .json({ message: "Product created successfully", id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", (req, res) => {
  res.status(200).json({ message: "Update a product", id: req.params.id });
});

router.delete("/:id", (req, res) => {
  res.status(200).json({ message: "Delete a product", id: req.params.id });
});

// Returns true if the input is a valid number or a non-empty string after trimming whitespace.
function validateInput(input) {
  if (typeof input === "number") {
    return input > 0;
  }

  if (typeof input === "string") {
    return input.trim().length > 0;
  }

  return false;
}

module.exports = router;
