// errorHandler.js

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = status === 500 ? "Internal server error" : err.message;

  console.error(err);

  res.status(status).json({
    error: message,
  });
};

module.exports = errorHandler;
