const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

// Centralized error handler. Must be registered last, after all routes.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Normalize Sequelize errors into ApiError so responses stay consistent
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map((e) => e.message);
    error = ApiError.badRequest('Validation failed', messages);
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = ApiError.badRequest('Invalid reference to a related resource');
  } else if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token');
  } else if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token expired');
  } else if (!(err instanceof ApiError)) {
    error = new ApiError(500, err.message || 'Internal server error');
  }

  if (!error.isOperational) {
    logger.error(err.stack);
  } else if (error.statusCode >= 500) {
    logger.error(err.message, { stack: err.stack });
  } else {
    logger.warn(err.message);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    statusCode: error.statusCode || 500,
    message: error.message || 'Internal server error',
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = { errorHandler, notFoundHandler };
