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

router.post("/", (req, res) => {
  if (!req.body || !req.body.name) {
    return res
      .status(400)
      .json({ error: 'Body missing required "name" field' });
  }
  res.status(201).json({ message: "Create a product" });
});

router.patch("/:id", (req, res) => {
  res.status(200).json({ message: "Update a product", id: req.params.id });
});

router.delete("/:id", (req, res) => {
  res.status(200).json({ message: "Delete a product", id: req.params.id });
});

module.exports = router;
