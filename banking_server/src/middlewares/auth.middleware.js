const jwt = require('jsonwebtoken');
const User = require('../models/User');
// const Account = require('../models/Account');
// const Transaction = require('../models/Transaction');
// const AuditLog = require('../models/AuditLog');
const {promisify} = require('util');
const Logger = require('../utils/logger');
/**
 * @desc verify JWT and attach user to req.user
 */
exports.protect = async (req, res, next) => {
    try{
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access. Please log in.'
            });
        }
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        const CurrentUser = await User.findById(decoded.id);
        if (!CurrentUser) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access. User belonging to this token was not found.'
            });
        }
        req.user = CurrentUser;
        next();
    }
    catch(err){
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
            logger.warn(`Access denied for user ${req.user.email} with role ${req.user.role} to route ${req.originalUrl}`);
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You do not have permission to perform this action.'
            });
        }
        next();
    };
};

