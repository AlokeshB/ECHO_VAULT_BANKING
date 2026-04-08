const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xssClean = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');

const logger = require('./utils/logger');
const globalErrorHandler = require('./middlewares/globalErrorHandler');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();
// Middleware Setup
app.use(helmet());
app.use(cors());
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);
app.use(hpp());
app.use(xssClean());
app.use(mongoSanitize());
app.use(morgan('combined', { stream: logger.stream }));
app.use(express.json({ limit: '10kb' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/transactions', transactionRoutes);

app.all('*', (req, res, next) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`,
    });
});
app.use(globalErrorHandler);
module.exports = app;