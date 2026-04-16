const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { promisify } = require('util');
const Logger = require('../utils/logger');

/**
 * @desc verify JWT and attach user to req.user
 */
exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        if (!token) {
            Logger.warn(`Unauthorized access attempt without token to: ${req.originalUrl}`);
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access. Please log in.'
            });
        }
        
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        const CurrentUser = await User.findById(decoded.id);
        
        if (!CurrentUser) {
            Logger.warn(`Token user not found for token decode: ${decoded.id}`);
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access. User belonging to this token was not found.'
            });
        }
        
        req.user = CurrentUser;
        next();
    }
    catch (err) {
        if (err.name === 'JsonWebTokenError') {
            Logger.warn(`Invalid token attempt: ${err.message}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please log in again.'
            });
        }
        if (err.name === 'TokenExpiredError') {
            Logger.warn(`Expired token attempt`);
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please log in again.'
            });
        }
        Logger.error(`Authentication error: ${err.message}`);
        return res.status(401).json({
            success: false,
            message: 'Unauthorized access. Please log in.'
        });
    }
};

/**
 * @desc RBAC implementation - restrict access based on user role
 * @param  {...any} roles - allowed roles for the route
 * @usage app.get('/admin-only', protect, restrictTo('admin'), adminController.someAdminFunction);
 */
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            Logger.warn(`Access denied for user ${req.user.email} with role ${req.user.role} to route ${req.originalUrl}`);
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You do not have permission to perform this action.'
            });
        }
        next();
    };
};

/**
 * @desc Passport error handler middleware
 */
exports.handlePassportError = (err, req, res, next) => {
    if (err) {
        Logger.warn(`Passport authentication error: ${err.message}`);
        return res.status(401).json({
            success: false,
            message: err.message || 'Authentication failed'
        });
    }
    next();
};