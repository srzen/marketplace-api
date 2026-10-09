// users.js: Manages user operations.

const express = require("express");
const router = express.Router();
const pool = require("../db/pool");
const validateInput = require("../utils/validateInput");
const bcrypt = require("bcrypt");

const NotFoundError = require("../errors/NotFoundError");
const ValidationError = require("../errors/ValidationError");
const ConflictError = require("../errors/ConflictError");

const BCRYPT_SALT_ROUNDS = 10;

// GET /users
// Retrieve and return all users from the database.
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, created_at FROM users",
    );
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /users/:id
// Retrieve a single user by its ID.
router.get("/:id", async (req, res, next) => {
  try {
    const [user] = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [req.params.id],
    );

    // Return NotFoundError if no user exists with the provided ID.
    if (!user.length) {
      return next(new NotFoundError("User not found."));
    }

    res.status(200).json(user[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /users/:id
// Update one or more user fields without replacing the entire record.
router.patch("/:id", async (req, res, next) => {
  try {
    const cols = [];
    const values = [];

    // Fields that clients are allowed to update.
    const fieldMap = {
      name: "name",
      email: "email",
      password: "password_hash",
    };

    const body = req.body ?? {};

    // Validate the request body while building the dynamic UPDATE query.
    for (const [key, value] of Object.entries(body)) {
      if (!validateInput(value) || !(key in fieldMap)) {
        return next(new ValidationError("Invalid request body."));
      }
      if (key === "password") {
        const password_hash = await bcrypt.hash(value, BCRYPT_SALT_ROUNDS);
        cols.push(`${fieldMap[key]} = ?`);
        values.push(password_hash);
        continue;
      }

      cols.push(`${fieldMap[key]} = ?`);
      values.push(value);
    }

    // At least one valid field must be supplied for PATCH.
    if (cols.length && values.length) {
      const [result] = await pool.query(
        `UPDATE users SET ${cols.join(", ")} WHERE id = ?`,
        [...values, req.params.id],
      );

      // If no rows were updated, the user ID doesn't exist.
      if (!result.affectedRows) {
        return next(new NotFoundError("User not found."));
      }

      res.status(200).json({
        message: "User updated successfully.",
        id: req.params.id,
      });
    } else {
      return next(new ValidationError("Body missing a required field."));
    }
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return next(
        new ConflictError(
          "Email already exists. Please use a different email.",
        ),
      );
    }
    next(err);
  }
});

// DELETE /users/:id
// Remove a user from the database.
router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [
      req.params.id,
    ]);

    // Return NotFoundError if the user does not exist.
    if (!result.affectedRows) {
      return next(new NotFoundError("User not found."));
    }

    res
      .status(200)
      .json({ message: "User deleted successfully.", id: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
