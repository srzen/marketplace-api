// products.js

const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({ message: "List all products" });
});

router.get("/:id", (req, res) => {
  if (req.params.id === "999") {
    return res
      .status(404)
      .json({ error: "Product not found", id: req.params.id });
  }
  res.status(200).json({ message: "Get product by ID", id: req.params.id });
});

router.post("/", (req, res) => {
  res.status(200).json({ message: "Create a product" });
});

router.patch("/:id", (req, res) => {
  res.status(200).json({ message: "Update a product", id: req.params.id });
});

router.delete("/:id", (req, res) => {
  res.status(200).json({ message: "Delete a product", id: req.params.id });
});

module.exports = router;
