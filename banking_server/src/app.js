const express = require('express');
const morgan = require('morgan');
const hpp = require('hpp');
const xssClean = require('xss-clean');
const passport = require('passport');

const logger = require('./utils/logger');
const { configureHelmet, configureCors, globalRateLimiter } = require('./config/secuirity');
const passportConfig = require('./config/passport');
const { globalErrorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const { auditMiddleware, logSuccessAudit, logFailureAudit } = require('./middlewares/audit.middleware');
const { 
    validateContentType, 
    preventParameterPollution, 
    detectSuspiciousActivity, 
    sanitizeRequestData,
    verifyRequestOrigin 
} = require('./middlewares/secuirity.middleware');
const apiRoutes = require('./routes/index');

const app = express();

// Security Headers & Rate Limiting
app.use(configureHelmet());
app.use(configureCors());
app.use(globalRateLimiter);

// Security Middleware
app.use(detectSuspiciousActivity);
app.use(validateContentType);
app.use(verifyRequestOrigin);

// Body Parser Middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Data Sanitization
app.use(xssClean());
app.use(preventParameterPollution);
app.use(sanitizeRequestData);

// Additional Security
app.use(hpp());

// Logging Middleware
app.use(morgan('combined', { stream: logger.stream }));

// Audit Middleware
app.use(auditMiddleware);

// Passport Initialization
app.use(passport.initialize());

// Routes - Using aggregated API routes
app.use('/api/v1', apiRoutes);

// Response Audit Logging (after routes)
app.use(logSuccessAudit);
app.use(logFailureAudit);

// 404 Handler (must be after routes)
app.use(notFoundHandler);

// Global Error Handler (must be last)
app.use(globalErrorHandler);

module.exports = app;