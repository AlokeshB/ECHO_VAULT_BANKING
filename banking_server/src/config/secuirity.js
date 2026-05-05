const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// ============================================
// LAYERED APPROACH FOR LOGIN PROTECTION
// ============================================

// Stage 1: Soft Limit - 10 attempts per minute (no blocking, just logging)
exports.loginSoftLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10,
    skip: (req, res) => res.statusCode === 200, // only count failures
    handler: (req, res, next) => {
        // Log but don't block - just call next
        console.warn(`[LOGIN SOFT LIMIT] Multiple attempts from ${req.ip}`);
        next();
    },
    standardHeaders: false,
    legacyHeaders: false
});

// Stage 2: Medium Limiter - 8 attempts per 15 minutes (with slight delay)
exports.loginMediumLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 8,
    delayAfter: 3, // After 3 attempts, delay responses
    delayMs: 500, // 500ms delay on each request
    message: { success: false, message: 'Too many login attempts. Please try again in a few minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Stage 3: Strict Limiter - 5 attempts per 15 minutes (blocks after threshold)
exports.loginStrictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    skipSuccessfulRequests: true, // don't count successful logins
    message: { success: false, message: 'Too many failed login attempts. Account temporarily locked. Please try again after 15 minutes or reset your password.' },
    standardHeaders: true,
    legacyHeaders: false
});

// General API rate limiter - 100 requests per 15 minutes
exports.globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false
});

// Register limiter - 3 registrations per 15 minutes
exports.registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3,
    message: { success: false, message: 'Too many registration attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false
});

// Transfer Limiter - 10 transfers per 15 minutes
exports.transferLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { success: false, message: 'Too many transfer attempts, for your security, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false
});

// Helmet configurations
exports.configureHelmet = () => {
    return helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:']
            }
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    });
};

// CORS configuration
exports.configureCors = () => {
    return cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    });
};
