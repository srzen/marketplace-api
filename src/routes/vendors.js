// vendors.js

const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// GET /vendors
// Retrieve and return all vendors from the database.
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM vendors");
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/:id", (req, res) => {
  if (req.params.id === "999") {
    return res
      .status(404)
      .json({ error: "Vendor not found", id: req.params.id });
  }
  res.status(200).json({ message: "Get vendor by ID", id: req.params.id });
});

router.post("/", (req, res) => {
  if (!req.body || !req.body.name) {
    return res
      .status(400)
      .json({ error: 'Body missing required "name" field' });
  }
  res.status(201).json({ message: "Create a vendor" });
});

router.patch("/:id", (req, res) => {
  res.status(200).json({ message: "Update a vendor", id: req.params.id });
});

router.delete("/:id", (req, res) => {
  res.status(200).json({ message: "Delete a vendor", id: req.params.id });
});

module.exports = router;
