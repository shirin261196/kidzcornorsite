
export const errorMiddleware = (err, req, res, next) => {
    // Default error status and message
    let statusCode = err.statusCode || 500; // Internal Server Error if not specified
    let message = err.message || 'Internal Server Error';
  
    // Handle specific Mongoose errors
    if (err.name === 'ValidationError') {
      statusCode = 400; // Bad Request
      message = Object.values(err.errors)
        .map((error) => error.message)
        .join(', ');
    }
  
    if (err.name === 'CastError') {
      statusCode = 400; // Bad Request
      message = `Invalid ${err.path}: ${err.value}`;
    }
  
    if (err.code === 11000) { // Mongoose Duplicate Key Error
      statusCode = 409; // Conflict
      const duplicateKey = Object.keys(err.keyValue).join(', ');
      message = `Duplicate field value entered for: ${duplicateKey}`;
    }
  
    // Log the error (optional: for debugging purposes)
    console.error(`[ERROR] ${err.name}: ${message}`);
  
    // Send the error response
    res.status(statusCode).json({
      success: false,
      error: {
        name: err.name || 'Error',
        message: message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack, // Hide stack trace in production
      },
    });
  };
  
 
  