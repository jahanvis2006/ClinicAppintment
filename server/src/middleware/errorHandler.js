// Centralized error handler so route handlers can just `next(err)`.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Internal server error." });
}

module.exports = { errorHandler };
