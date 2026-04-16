const Logger = require('../utils/logger');

/**
 * @desc Custom Application Error Class
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * @desc Handle MongoDB validation errors
 */
const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(error => error.message);
    const message = `Invalid input data. ${errors.join(', ')}`;
    return new AppError(message, 400);
};

/**
 * @desc Handle MongoDB duplicate key errors
 */
const handleDuplicateError = (err) => {
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];
    const message = `A document with this ${field} already exists: ${value}. Please use a different value.`;
    return new AppError(message, 409);
};

/**
 * @desc Handle MongoDB cast errors (invalid ID)
 */
const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}. Expected a valid MongoDB ObjectId.`;
    return new AppError(message, 400);
};

/**
 * @desc Handle JWT errors
 */
const handleJwtError = () => {
    return new AppError('Invalid token. Please log in again.', 401);
};

/**
 * @desc Handle JWT expired errors
 */
const handleJwtExpiredError = () => {
    return new AppError('Your token has expired. Please log in again.', 401);
};

/**
 * @desc Send error response in development mode
 */
const sendErrorDev = (err, req, res) => {
    Logger.error(`Development Error: ${err.message}\nStack: ${err.stack}`);

    return res.status(err.statusCode || 500).json({
        success: false,
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body
    });
};

/**
 * @desc Send error response in production mode
 */
const sendErrorProd = (err, req, res) => {
    // Trusted errors (operational): send message to client
    if (err.isOperational) {
        Logger.warn(`Operational Error: ${err.message}`);
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }

    // Programming errors: don't leak details to client
    Logger.error(`Programming Error: ${err.message}\nStack: ${err.stack}`);
    return res.status(500).json({
        success: false,
        message: 'Something went very wrong! Please try again later.'
    });
};

/**
 * @desc Global error handling middleware
 */
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Handle known errors
    if (err.name === 'ValidationError') {
        err = handleValidationError(err);
    }
    if (err.code === 11000) {
        err = handleDuplicateError(err);
    }
    if (err.name === 'CastError') {
        err = handleCastError(err);
    }
    if (err.name === 'JsonWebTokenError') {
        err = handleJwtError();
    }
    if (err.name === 'TokenExpiredError') {
        err = handleJwtExpiredError();
    }

    // Mark operational errors
    if (!err.isOperational) {
        err.isOperational = err.statusCode >= 400 && err.statusCode < 600;
    }

    // Send appropriate response based on environment
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else {
        sendErrorProd(err, req, res);
    }
};

/**
 * @desc Async error wrapper - catches errors in async route handlers
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

/**
 * @desc Not found error handler - must be after all routes
 */
const notFoundHandler = (req, res, next) => {
    const message = `Can't find ${req.originalUrl} on this server!`;
    Logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
    
    const err = new AppError(message, 404);
    next(err);
};

module.exports = {
    globalErrorHandler,
    AppError,
    catchAsync,
    notFoundHandler
};
