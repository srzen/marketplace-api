// products.js

const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// GET /products
// Retrieve products, with optional filtering by vendor_id and/or max_price.
router.get("/", async (req, res, next) => {
  const conditions = [];
  const values = [];
  let whereClause = "";

  // Validate and apply vendor filter if provided.
  if (req.query.vendor_id) {
    const vendorId = Number(req.query.vendor_id);
    if (!Number.isInteger(vendorId)) {
      return res.status(400).json({ error: "vendor_id must be an integer" });
    }
    conditions.push("vendor_id = ?");
    values.push(vendorId);
  }

  // Validate and apply maximum price filter if provided.
  if (req.query.max_price) {
    const maxPrice = Number(req.query.max_price);
    if (Number.isNaN(maxPrice)) {
      return res.status(400).json({ error: "max_price must be a number" });
    }
    conditions.push("price <= ?");
    values.push(maxPrice);
  }

  // Build the WHERE clause only when filters exist.
  if (conditions.length) {
    whereClause = `WHERE ${conditions.join(" AND ")}`;
  }

  try {
    // Execute the query with parameterized values.
    const [rows] = await pool.query(
      `SELECT * FROM products ${whereClause}`,
      values,
    );

    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /products/:id
// Retrieve a single product by its ID.
router.get("/:id", async (req, res, next) => {
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
  } catch (err) {
    next(err);
  }
});

// POST /products
// Create a new product after validating the request body.
router.post("/", async (req, res, next) => {
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
  } catch (err) {
    next(err);
  }
});

// PATCH /products/:id
// Update one or more product fields without replacing the entire record.
router.patch("/:id", async (req, res, next) => {
  const cols = [];
  const values = [];

  // Fields that clients are allowed to update.
  const allowedKeys = ["name", "description", "price", "stock", "vendor_id"];

  const body = req.body ?? {};

  // Validate the request body while building the dynamic UPDATE query.
  for (const [key, value] of Object.entries(body)) {
    if (!validateInput(value) || !allowedKeys.includes(key)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    cols.push(`${key} = ?`);
    values.push(value);
  }

  // At least one valid field must be supplied for PATCH.
  if (cols.length && values.length) {
    try {
      const [result] = await pool.query(
        `UPDATE products SET ${cols.join(", ")} WHERE id = ?`,
        [...values, req.params.id],
      );

      // If no rows were updated, the product ID doesn't exist.
      if (!result.affectedRows) {
        return res
          .status(404)
          .json({ error: "Product not found", id: req.params.id });
      }

      res
        .status(200)
        .json({ message: "Product updated successfully", id: req.params.id });
    } catch (err) {
      next(err);
    }
  } else {
    return res.status(400).json({ error: "Body missing a required field" });
  }
});

// DELETE /products/:id
// Remove a product from the database
router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM products WHERE id = ?", [
      req.params.id,
    ]);

    // Return 404 if the product does not exist.
    if (!result.affectedRows) {
      return res
        .status(404)
        .json({ error: "Product not found", id: req.params.id });
    }

    res.status(200).json({
      message: "Product deleted succesfully",
      id: req.params.id,
    });
  } catch (err) {
    next(err);
  }
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
