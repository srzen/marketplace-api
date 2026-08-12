// vendors.js

const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

const NotFoundError = require("../errors/NotFoundError");
const ValidationError = require("../errors/ValidationError");

// GET /vendors
// Retrieve and return all vendors from the database.
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM vendors");
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /vendors/:id
// Retrieve a single vendor by its ID.
router.get("/:id", async (req, res, next) => {
  try {
    const [vendor] = await pool.query("SELECT * FROM vendors WHERE id = ?", [
      req.params.id,
    ]);

    // Return NotFoundError if no vendor exists with the provided ID.
    if (!vendor.length) {
      return next(new NotFoundError("Vendor not found."));
    }

    res.status(200).json(vendor[0]);
  } catch (err) {
    next(err);
  }
});

// POST /vendors
// Create a new vendor after validating the request body.
router.post("/", async (req, res, next) => {
  try {
    // Ensure all required fields are provided.
    if (!req.body || !req.body.name || !req.body.email || !req.body.phone) {
      return next(new ValidationError("Body missing a required field."));
    }

    // Only allow the expected vendor properties.
    const allowedKeys = ["name", "email", "phone"];

    // Validate every submitted field.
    for (const [key, value] of Object.entries(req.body)) {
      if (!validateInput(value) || !allowedKeys.includes(key)) {
        return next(new ValidationError("Invalid request body."));
      }
    }

    const [result] = await pool.query(
      "INSERT INTO vendors (name, email, phone) VALUES (?, ?, ?)",
      [req.body.name, req.body.email, req.body.phone],
    );

    res
      .status(201)
      .json({ message: "Vendor created successfully.", id: result.insertId });
  } catch (err) {
    next(err);
  }
});

// PATCH /vendors/:id
// Update one or more vendor fields without replacing the entire record.
router.patch("/:id", async (req, res, next) => {
  try {
    const cols = [];
    const values = [];

    // Fields that clients are allowed to update.
    const allowedKeys = ["name", "email", "phone"];

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
        `UPDATE vendors SET ${cols.join(", ")} WHERE id = ?`,
        [...values, req.params.id],
      );

      // If no rows were updated, the vendor ID doesn't exist.
      if (!result.affectedRows) {
        return next(new NotFoundError("Vendor not found."));
      }

      res.status(200).json({
        message: "Vendor updated successfully.",
        id: req.params.id,
      });
    } else {
      return next(new ValidationError("Body missing a required field."));
    }
  } catch (err) {
    next(err);
  }
});

// DELETE /vendors/:id
// Remove a vendor from the database.
router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM vendors WHERE id = ?", [
      req.params.id,
    ]);

    // Return NotFoundError if the vendor does not exist.
    if (!result.affectedRows) {
      return next(new NotFoundError("Vendor not found."));
    }

    res
      .status(200)
      .json({ message: "Vendor deleted successfully.", id: req.params.id });
  } catch (err) {
    next(err);
  }
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
