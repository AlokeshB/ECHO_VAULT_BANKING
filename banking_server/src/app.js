const express = require('express');
const morgan = require('morgan');
const hpp = require('hpp');
const xssClean = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const passport = require('passport');

const logger = require('./utils/logger');
const { configureHelmet, configureCors, globalRateLimiter } = require('./config/secuirity');
const passportConfig = require('./config/passport');
const globalErrorHandler = require('./middlewares/globalErrorHandler');
const authRoutes = require('./routes/auth.routes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();

// Security Middleware Setup
app.use(configureHelmet());
app.use(configureCors());
app.use(globalRateLimiter);
app.use(hpp());
app.use(xssClean());
app.use(mongoSanitize());

// Logging Middleware
app.use(morgan('combined', { stream: logger.stream }));

// Body Parser Middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Passport Initialization
app.use(passport.initialize());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/transactions', transactionRoutes);

// 404 Handler
app.all('*', (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Can't find ${req.originalUrl} on this server!`
    });
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;