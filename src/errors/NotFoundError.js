// NotFoundError.js

class NotFoundError extends Error {
  constructor(message = "The requested resource was not found.") {
    super(message);
    this.name = "NotFoundError";
    this.status = 404;
  }
}

module.exports = NotFoundError;
