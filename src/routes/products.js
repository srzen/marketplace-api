// products.js: CRUD operations and query filtering for products.

const express = require("express");
const router = express.Router();
const pool = require("../db/pool");
const validateInput = require("../utils/validateInput");

const NotFoundError = require("../errors/NotFoundError");
const ValidationError = require("../errors/ValidationError");

// GET /products
// Retrieve products, with optional filtering by vendor_id and/or max_price.
router.get("/", async (req, res, next) => {
  try {
    const conditions = [];
    const values = [];
    let whereClause = "";

    // Validate and apply vendor filter if provided.
    if (req.query.vendor_id) {
      const vendorId = Number(req.query.vendor_id);
      if (!Number.isInteger(vendorId)) {
        return next(new ValidationError("vendor_id must be an integer."));
      }
      conditions.push("vendor_id = ?");
      values.push(vendorId);
    }

    // Validate and apply maximum price filter if provided.
    if (req.query.max_price) {
      const maxPrice = Number(req.query.max_price);
      if (Number.isNaN(maxPrice)) {
        return next(new ValidationError("max_price must be a number."));
      }
      conditions.push("price <= ?");
      values.push(maxPrice);
    }

    // Build the WHERE clause only when filters exist.
    if (conditions.length) {
      whereClause = `WHERE ${conditions.join(" AND ")}`;
    }

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

    // Return NotFoundError if no product exists with the provided ID.
    if (!product.length) {
      return next(new NotFoundError("Product not found."));
    }

    res.status(200).json(product[0]);
  } catch (err) {
    next(err);
  }
});

// POST /products
// Create a new product after validating the request body.
router.post("/", async (req, res, next) => {
  try {
    // Ensure all required fields are provided.
    if (
      !req.body ||
      !req.body.name ||
      !req.body.description ||
      !req.body.price ||
      !req.body.stock ||
      !req.body.vendor_id
    ) {
      return next(new ValidationError("Body missing a required field."));
    }

    // Only allow expected product properties.
    const allowedKeys = ["name", "description", "price", "stock", "vendor_id"];

    // Validate every submitted field.
    for (const [key, value] of Object.entries(req.body)) {
      if (!validateInput(value) || !allowedKeys.includes(key)) {
        return next(new ValidationError("Invalid request body."));
      }
    }

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

    res.status(201).json({
      message: "Product created successfully.",
      id: result.insertId,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /products/:id
// Update one or more product fields without replacing the entire record.
router.patch("/:id", async (req, res, next) => {
  try {
    const cols = [];
    const values = [];

    // Fields that clients are allowed to update.
    const allowedKeys = ["name", "description", "price", "stock", "vendor_id"];

    const body = req.body ?? {};

    // Validate the request body while building the dynamic UPDATE query.
    for (const [key, value] of Object.entries(body)) {
      if (!validateInput(value) || !allowedKeys.includes(key)) {
        return next(new ValidationError("Invalid request body."));
      }

      cols.push(`${key} = ?`);
      values.push(value);
    }

    // At least one valid field must be supplied for PATCH.
    if (cols.length && values.length) {
      const [result] = await pool.query(
        `UPDATE products SET ${cols.join(", ")} WHERE id = ?`,
        [...values, req.params.id],
      );

      // If no rows were updated, the product ID doesn't exist.
      if (!result.affectedRows) {
        return next(new NotFoundError("Product not found."));
      }

      res
        .status(200)
        .json({ message: "Product updated successfully.", id: req.params.id });
    } else {
      return next(new ValidationError("Body missing a required field."));
    }
  } catch (err) {
    next(err);
  }
});

// DELETE /products/:id
// Remove a product from the database
router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM products WHERE id = ?", [
      req.params.id,
    ]);

    // Return NotFoundError if the product does not exist.
    if (!result.affectedRows) {
      return next(new NotFoundError("Product not found."));
    }

    res.status(200).json({
      message: "Product deleted successfully.",
      id: req.params.id,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
