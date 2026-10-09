// authController.js: Manages auth operations.

const pool = require("../db/pool");
const validateInput = require("../utils/validateInput");
const bcrypt = require("bcrypt");

const ValidationError = require("../errors/ValidationError");
const ConflictError = require("../errors/ConflictError");
const AuthError = require("../errors/AuthError");

const BCRYPT_SALT_ROUNDS = 10;

const register = async (req, res, next) => {
  try {
    // Ensure all required fields are provided.
    if (!req.body || !req.body.name || !req.body.email || !req.body.password) {
      return next(new ValidationError("Body missing a required field."));
    }

    // Only allow the expected user properties.
    const allowedKeys = ["name", "email", "password"];

    // Validate every submitted field.
    for (const [key, value] of Object.entries(req.body)) {
      if (!validateInput(value) || !allowedKeys.includes(key)) {
        return next(new ValidationError("Invalid request body."));
      }
    }

    const password_hash = await bcrypt.hash(
      req.body.password,
      BCRYPT_SALT_ROUNDS,
    );

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [req.body.name, req.body.email, password_hash],
    );

    res
      .status(201)
      .json({ message: "User created successfully.", id: result.insertId });
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
};

const login = async (req, res, next) => {
  try {
    // Ensure all required fields are provided.
    if (!req.body || !req.body.email || !req.body.password) {
      return next(new ValidationError("Body missing a required field."));
    }

    // Only allow the expected user properties.
    const allowedKeys = ["email", "password"];

    // Validate every submitted field.
    for (const [key, value] of Object.entries(req.body)) {
      if (!validateInput(value) || !allowedKeys.includes(key)) {
        return next(new ValidationError("Invalid request body."));
      }
    }

    // Fetch user data including password hash
    const [user] = await pool.query("SELECT * FROM users WHERE email = ?", [
      req.body.email,
    ]);

    // Return AuthError if no user exists with the provided Email.
    if (!user.length) {
      return next(new AuthError("Invalid credentials."));
    }

    // Need to compare with the proper way.
    const isMatch = await bcrypt.compare(
      req.body.password,
      user[0].password_hash,
    );

    if (isMatch) {
      res.status(200).json({ message: "Login Successful" });
    } else {
      return next(new AuthError("Invalid credentials."));
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
