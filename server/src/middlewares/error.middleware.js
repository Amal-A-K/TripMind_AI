/**
 * Centralized Error Handling Middleware
 *
 * Catches errors forwarded via next(err) from any route or middleware.
 * Returns a consistent JSON error shape across the entire API.
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Default to 500 if no status code has been set on the error
  const statusCode = err.statusCode || res.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Only expose stack traces in development — never in production
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
