// NotFoundError.js

class NotFoundError extends Error {
  constructor(message = "The requested resource was not found.") {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}
