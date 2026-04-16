const AuditLog = require('../models/AuditLog');
const Logger = require('../utils/logger');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

/**
 * @desc Extract client IP address from request
 */
const getClientIP = (req) => {
    return (
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket?.remoteAddress ||
        '127.0.0.1'
    );
};

/**
 * @desc Extract location from IP address
 */
const getLocationFromIP = (ip) => {
    try {
        const geo = geoip.lookup(ip);
        return geo ? { country: geo.country, city: geo.city, timezone: geo.timezone } : null;
    }
    catch (err) {
        Logger.error(`Error getting geolocation: ${err.message}`);
        return null;
    }
};

/**
 * @desc Extract device info from user agent
 */
const getDeviceInfo = (userAgent) => {
    try {
        const parser = new UAParser(userAgent);
        const result = parser.getResult();
        return {
            browser: result.browser.name || 'Unknown',
            os: result.os.name || 'Unknown',
            device: result.device.type || 'desktop'
        };
    }
    catch (err) {
        Logger.error(`Error parsing user agent: ${err.message}`);
        return { browser: 'Unknown', os: 'Unknown', device: 'unknown' };
    }
};

/**
 * @desc Main audit middleware - logs all API requests
 */
exports.auditMiddleware = async (req, res, next) => {
    try {
        const ipAddress = getClientIP(req);
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const location = getLocationFromIP(ipAddress);
        const deviceInfo = getDeviceInfo(userAgent);

        // Store audit info in req for controller access
        req.auditInfo = {
            ipAddress,
            userAgent,
            location,
            deviceInfo,
            timestamp: new Date(),
            method: req.method,
            url: req.originalUrl,
            userId: req.user?._id || null,
            userEmail: req.user?.email || null
        };

        // Intercept res.json to log responses
        const originalJson = res.json;
        res.json = function (data) {
            // Store response data for logging
            req.responseData = data;
            return originalJson.call(this, data);
        };

        next();
    }
    catch (err) {
        Logger.error(`Audit middleware error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc Log successful API requests to database
 */
exports.logSuccessAudit = async (req, res, next) => {
    try {
        if (!req.auditInfo) {
            return next();
        }

        const { ipAddress, userAgent, location, deviceInfo, method, url, userId, userEmail } = req.auditInfo;
        const statusCode = res.statusCode;
        const responseData = req.responseData || {};

        // Determine action based on route and method
        const routeParts = url.split('/');
        let action = `${method}_REQUEST`;
        let resource = 'general';
        let resourceId = null;

        if (url.includes('/auth/register')) {
            action = 'USER_REGISTRATION';
            resource = 'auth';
        }
        else if (url.includes('/auth/verify-email')) {
            action = 'EMAIL_VERIFICATION';
            resource = 'auth';
        }
        else if (url.includes('/auth/login')) {
            action = 'USER_LOGIN';
            resource = 'auth';
        }
        else if (url.includes('/auth/submit-kyc')) {
            action = 'KYC_SUBMISSION';
            resource = 'kyc';
        }
        else if (url.includes('/auth/admin/review-kyc')) {
            action = 'KYC_REVIEW';
            resource = 'kyc';
            resourceId = routeParts[routeParts.length - 1];
        }
        else if (url.includes('/auth/admin/approve-account')) {
            action = 'ACCOUNT_APPROVAL';
            resource = 'account';
            resourceId = routeParts[routeParts.length - 1];
        }

        // Only log successful status codes (2xx)
        if (statusCode >= 200 && statusCode < 300) {
            await AuditLog.create({
                user: userId,
                action,
                resource,
                resourceId: resourceId || null,
                message: `${method} ${url} - Status: ${statusCode}`,
                details: {
                    method,
                    url,
                    statusCode,
                    responseData: { success: responseData.success, message: responseData.message },
                    deviceInfo
                },
                ipAddress,
                userAgent,
                location: location ? JSON.stringify(location) : null,
                deviceId: `${deviceInfo.browser}-${deviceInfo.os}-${ipAddress}`
            });

            Logger.info(`Audit log created: ${action} by user ${userEmail || 'anonymous'} from ${ipAddress}`);
        }

        next();
    }
    catch (err) {
        Logger.error(`Error logging success audit: ${err.message}`);
        next();
    }
};

/**
 * @desc Log failed API requests to database
 */
exports.logFailureAudit = async (req, res, next) => {
    try {
        if (!req.auditInfo) {
            return next();
        }

        const { ipAddress, userAgent, location, deviceInfo, method, url, userId, userEmail } = req.auditInfo;
        const statusCode = res.statusCode;
        const responseData = req.responseData || {};

        // Determine action based on route and method
        let action = `${method}_FAILED`;
        let resource = 'general';
        let resourceId = null;

        if (url.includes('/auth/register')) {
            action = 'REGISTRATION_FAILED';
            resource = 'auth';
        }
        else if (url.includes('/auth/verify-email')) {
            action = 'EMAIL_VERIFICATION_FAILED';
            resource = 'auth';
        }
        else if (url.includes('/auth/login')) {
            action = 'LOGIN_FAILED';
            resource = 'auth';
        }

        // Only log error status codes (4xx, 5xx)
        if (statusCode >= 400) {
            await AuditLog.create({
                user: userId,
                action,
                resource,
                resourceId: resourceId || null,
                message: `${method} ${url} - Status: ${statusCode} - ${responseData.message || 'Unknown error'}`,
                details: {
                    method,
                    url,
                    statusCode,
                    errorMessage: responseData.message,
                    errors: responseData.errors,
                    deviceInfo
                },
                ipAddress,
                userAgent,
                location: location ? JSON.stringify(location) : null,
                deviceId: `${deviceInfo.browser}-${deviceInfo.os}-${ipAddress}`
            });

            Logger.warn(`Audit log created for failure: ${action} by user ${userEmail || 'anonymous'} from ${ipAddress}`);
        }

        next();
    }
    catch (err) {
        Logger.error(`Error logging failure audit: ${err.message}`);
        next();
    }
};

/**
 * @desc Enhanced audit logging with specific action details
 */
exports.logAuditAction = async ({
    userId,
    action,
    resource,
    resourceId,
    message,
    details = {},
    ipAddress,
    userAgent,
    location,
    deviceId
}) => {
    try {
        await AuditLog.create({
            user: userId,
            action,
            resource,
            resourceId: resourceId || null,
            message,
            details,
            ipAddress: ipAddress || '127.0.0.1',
            userAgent: userAgent || 'Unknown',
            location: location ? JSON.stringify(location) : null,
            deviceId: deviceId || 'unknown'
        });

        Logger.info(`Audit log created: ${action} on ${resource}${resourceId ? ` (${resourceId})` : ''}`);
        return true;
    }
    catch (err) {
        Logger.error(`Error creating audit log: ${err.message}`);
        return false;
    }
};
