// ConflictError.js: Custom error class for handling 409 Conflict errors in the application.

class ConflictError extends Error {
  constructor(message = "Conflict detected.") {
    super(message);
    this.name = "ConflictError";
    this.status = 409;
  }
}

module.exports = ConflictError;
