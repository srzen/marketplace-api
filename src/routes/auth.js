// auth.js: Manages auth routes.

const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/authController");

// POST /register
// Register a new user after validating the request body.
router.post("/register", register);

// POST /login
// Authenticate a user and return a token if successful.
router.post("/login", login);

module.exports = router;
