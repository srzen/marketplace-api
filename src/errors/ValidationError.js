// ValidationError.js: Custom error class for handling 400 Validation errors in the application.

class ValidationError extends Error {
  constructor(message = "Invalid input provided.") {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
  }
}

module.exports = ValidationError;
