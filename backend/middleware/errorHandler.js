const errorHandler = (err, req, res, next) => {
  // Log the complete error stack in development for debugging
  console.error('Error Intercepted:', err.stack || err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = {};
    Object.keys(err.errors).forEach(key => {
      errors[key] = err.errors[key].message;
    });
  }

  // Handle invalid Mongoose ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found. Invalid ID format: ${err.value}`;
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }) // Only include errors if they exist
  });
};

module.exports = errorHandler;
