const express = require('express');
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validate } = require('../validations/auth.validation');
const { authRateLimiter } = require('../config/secuirity');

const router = express.Router();

/**
 * @route POST /api/v1/auth/register
 * @desc User self-registration
 * @access Public
 */
router.post('/register', authRateLimiter, validate('registerCustomer'), authController.registerCustomer);

/**
 * @route POST /api/v1/auth/verify-email
 * @desc Verify email with OTP
 * @access Public
 */
router.post('/verify-email', authRateLimiter, validate('verifyEmail'), authController.verifyEmail);

/**
 * @route POST /api/v1/auth/login-email
 * @desc Login with email and password
 * @access Public
 */
router.post(
    '/login-email',
    authRateLimiter,
    validate('loginEmail'),
    passport.authenticate('email-local', { session: false }),
    authController.loginWithEmail
);

/**
 * @route POST /api/v1/auth/login-userid
 * @desc Login with custom UserID and password
 * @access Public
 */
router.post(
    '/login-userid',
    authRateLimiter,
    validate('loginUserID'),
    passport.authenticate('userid-local', { session: false }),
    authController.loginWithUserID
);

/**
 * @route POST /api/v1/auth/verify-2fa-pin
 * @desc Verify 2FA PIN during login
 * @access Private - requires token from email/userID login
 */
router.post(
    '/verify-2fa-pin',
    authMiddleware.protect,
    authController.verify2FAPIN
);

/**
 * @route POST /api/v1/auth/create-support
 * @desc Admin creates support user
 * @access Private - Admin only
 */
router.post(
    '/create-support',
    authMiddleware.protect,
    authMiddleware.restrictTo('admin'),
    validate('createSupportUser'),
    authController.createSupportUser
);

/**
 * @route PATCH /api/v1/auth/admin/approve-account/:userId
 * @desc Admin approves customer account
 * @access Private - Admin only
 */
router.patch(
    '/admin/approve-account/:userId',
    authMiddleware.protect,
    authMiddleware.restrictTo('admin'),
    validate('approveAccount'),
    authController.approveCustomerAccount
);

/**
 * @route POST /api/v1/auth/submit-kyc
 * @desc User submits KYC documents
 * @access Private - Customer only
 */
router.post(
    '/submit-kyc',
    authMiddleware.protect,
    authMiddleware.restrictTo('customer'),
    validate('submitKYC'),
    authController.submitKYC
);

/**
 * @route PATCH /api/v1/auth/admin/review-kyc/:userId
 * @desc Admin reviews and verifies KYC documents
 * @access Private - Admin only
 */
router.patch(
    '/admin/review-kyc/:userId',
    authMiddleware.protect,
    authMiddleware.restrictTo('admin'),
    validate('reviewKYC'),
    authController.reviewKYC
);

/**
 * @route GET /api/v1/auth/kyc-data/:userId
 * @desc Get decrypted KYC data (Admin or User for self)
 * @access Private - Admin or account owner
 */
router.get(
    '/kyc-data/:userId',
    authMiddleware.protect,
    authController.getKYCData
);

/**
 * @route POST /api/v1/auth/setup-2fa-pin
 * @desc User sets up 2FA PIN after KYC verification
 * @access Private - Customer only (after KYC verified)
 */
router.post(
    '/setup-2fa-pin',
    authMiddleware.protect,
    authMiddleware.restrictTo('customer'),
    validate('setup2FAPIN'),
    authController.setup2FAPIN
);

/**
 * @route PATCH /api/v1/auth/change-password
 * @desc Change password
 * @access Private
 */
router.patch(
    '/change-password',
    authMiddleware.protect,
    validate('changePassword'),
    authController.changePassword
);

/**
 * @route POST /api/v1/auth/forgot-password
 * @desc Request password reset OTP
 * @access Public
 */
router.post(
    '/forgot-password',
    authRateLimiter,
    validate('forgotPassword'),
    authController.forgotPassword
);

/**
 * @route PATCH /api/v1/auth/reset-password
 * @desc Reset password with OTP
 * @access Public
 */
router.patch(
    '/reset-password',
    authRateLimiter,
    validate('resetPassword'),
    authController.resetPassword
);

/**
 * @route PATCH /api/v1/auth/change-2fa-pin
 * @desc Change 2FA PIN
 * @access Private - users with 2FA enabled
 */
router.patch(
    '/change-2fa-pin',
    authMiddleware.protect,
    validate('change2FAPIN'),
    authController.change2FAPIN
);

/**
 * @route PATCH /api/v1/auth/disable-2fa
 * @desc Disable 2FA authentication
 * @access Private - logged in users
 */
router.patch(
    '/disable-2fa',
    authMiddleware.protect,
    authController.disable2FA
);

module.exports = router;
