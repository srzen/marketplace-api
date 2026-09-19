// AuthError.js: Custom error class for handling 401 Authentication errors in the application.

class AuthError extends Error {
  constructor(message = "Authentication failed.") {
    super(message);
    this.name = "AuthError";
    this.status = 401;
  }
}

module.exports = AuthError;
