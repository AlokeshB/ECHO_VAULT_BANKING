/**
 * @description: API Route Index
 * Central aggregation point for all API routes
 * All routes are prefixed with /api/v1
 */

const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth.routes');
const accountRoutes = require('./account.routes');
const transactionRoutes = require('./transaction.routes');

/**
 * API Version Check
 * @route GET /api/v1/health
 * @desc Health check endpoint for API availability
 * @access Public
 */
router.get('/health', (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'API is running',
        version: 'v1',
        timestamp: new Date().toISOString()
    });
});

/**
 * ============================================
 * ROUTE AGGREGATION
 * ============================================
 */

/**
 * Authentication Routes
 * @route /api/v1/auth/*
 * Public endpoints: register, verify-email, login, forgot-password
 * Protected endpoints: logout, change-password, setup-transaction-pin
 */
router.use('/auth', authRoutes);

/**
 * Account Management Routes
 * @route /api/v1/accounts/*
 * Protected endpoints: get balance, view statements, open accounts, freeze/unfreeze
 */
router.use('/accounts', accountRoutes);

/**
 * Transaction Routes
 * @route /api/v1/transactions/*
 * Protected endpoints: transfer funds, view transaction history
 */
router.use('/transactions', transactionRoutes);

/**
 * ============================================
 * 404 - Not Found Handler
 * ============================================
 */
router.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
