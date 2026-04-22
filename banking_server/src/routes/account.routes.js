const express = require('express');
const passport = require('passport');
const accountController = require('../controllers/account.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validate, validateQuery } = require('../validations/account.validation');
const { globalRateLimiter } = require('../config/secuirity');

const router = express.Router();

// Protect all account routes with JWT authentication
router.use(passport.authenticate('jwt', { session: false }));

/**
 * @route GET /api/v1/accounts
 * @desc Fetch all accounts for authenticated user
 * @access Private (Authenticated User)
 */
router.get('/', authMiddleware.protect, globalRateLimiter, accountController.getUserAccounts);

/**
 * @route GET /api/v1/accounts/:accountId/balance
 * @desc Fetch current account balance, account number, and routing number
 * @access Private (Authenticated User - Account Owner)
 */
router.get('/:accountId/balance', authMiddleware.protect, globalRateLimiter, accountController.getAccountBalance);

/**
 * @route GET /api/v1/accounts/:accountId/details
 * @desc Fetch full account details
 * @access Private (Authenticated User - Account Owner)
 */
router.get('/:accountId/details', authMiddleware.protect, globalRateLimiter, accountController.getAccountDetails);

/**
 * @route GET /api/v1/accounts/:accountId/transactions
 * @desc Fetch transaction history/Account Statement with pagination and filters
 * @access Private (Authenticated User - Account Owner)
 * @query page, limit, startDate, endDate, type, status
 */
router.get(
    '/:accountId/transactions',
    authMiddleware.protect,
    globalRateLimiter,
    validateQuery('getTransactionHistory'),
    accountController.getTransactionHistory
);

/**
 * @route GET /api/v1/accounts/:accountId/statement
 * @desc Generate Account Statement (PDF-ready data)
 * @access Private (Authenticated User - Account Owner)
 * @query month (YYYY-MM), year (YYYY)
 */
router.get(
    '/:accountId/statement',
    authMiddleware.protect,
    globalRateLimiter,
    validateQuery('getStatement'),
    accountController.getAccountStatement
);

/**
 * @route POST /api/v1/accounts/open-account
 * @desc Open a new account for verified user
 * @access Private (Authenticated User - KYC Verified)
 * @body { accountType: 'savings'|'checking'|'business', initialBalance }
 */
router.post(
    '/open-account',
    authMiddleware.protect,
    globalRateLimiter,
    validate('openNewAccount'),
    accountController.openNewAccount
);

/**
 * @route POST /api/v1/accounts/:accountId/freeze
 * @desc Freeze an account (temporarily disable transactions)
 * @access Private (Authenticated User or Admin)
 * @body { reason: String }
 */
router.post(
    '/:accountId/freeze',
    authMiddleware.protect,
    globalRateLimiter,
    validate('freezeAccount'),
    accountController.freezeAccount
);

/**
 * @route POST /api/v1/accounts/:accountId/unfreeze
 * @desc Unfreeze a frozen account
 * @access Private (Admin only or Account Owner with verification)
 * @body { reason: String, verificationCode: String (optional) }
 */
router.post(
    '/:accountId/unfreeze',
    authMiddleware.protect,
    globalRateLimiter,
    validate('unfreezeAccount'),
    accountController.unfreezeAccount
);

/**
 * @route POST /api/v1/accounts/:accountId/close
 * @desc Close an account permanently
 * @access Private (Authenticated User - Account Owner)
 * @body { reason: String, password: String }
 */
router.post(
    '/:accountId/close',
    authMiddleware.protect,
    globalRateLimiter,
    validate('closeAccount'),
    accountController.closeAccount
);

module.exports = router;
