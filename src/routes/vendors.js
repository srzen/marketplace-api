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

// GET /vendors/:id
// Retrieve a single vendor by its ID.
router.get("/:id", async (req, res) => {
  try {
    const [vendor] = await pool.query("SELECT * FROM vendors WHERE id = ?", [
      req.params.id,
    ]);

    // Return 404 if no vendor exists with the provided ID.
    if (!vendor.length) {
      return res
        .status(404)
        .json({ error: "Vendor not found", id: req.params.id });
    }

    res.status(200).json(vendor[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /vendors
// Create a new vendor after validating the request body.
router.post("/", async (req, res) => {
  // Ensure all required fields are provided.
  if (!req.body || !req.body.name || !req.body.email || !req.body.phone) {
    return res.status(400).json({ error: "Body missing a required field" });
  }

  // Only allow the expected vendor properties.
  const allowedKeys = ["name", "email", "phone"];

  // Use an empty object if req.body is null or undefined.
  const body = req.body ?? {};

  // Validate every submitted field.
  for (const [key, value] of Object.entries(body)) {
    if (!validateInput(value) || !allowedKeys.includes(key)) {
      return res.status(400).json({ error: "Invalid request body" });
    }
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO vendors (name, email, phone) VALUES (?, ?, ?)",
      [req.body.name, req.body.email, req.body.phone],
    );

    res
      .status(201)
      .json({ message: "Vendor created successfully", id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", (req, res) => {
  res.status(200).json({ message: "Update a vendor", id: req.params.id });
});

router.delete("/:id", (req, res) => {
  res.status(200).json({ message: "Delete a vendor", id: req.params.id });
});

// Returns true if the input is a non-empty string after trimming whitespace.
function validateInput(input) {
  let inputIsValid = true;

  if (!input?.trim()) {
    inputIsValid = false;
  }

  return inputIsValid;
}

module.exports = router;
