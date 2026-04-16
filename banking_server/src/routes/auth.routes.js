const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validate } = require('../validations/auth.validation');

const router = express.Router();

/**
 * @route POST /api/v1/auth/register
 * @desc User self-registration
 * @access Public
 */
router.post('/register', validate('registerCustomer'), authController.registerCustomer);

/**
 * @route POST /api/v1/auth/verify-email
 * @desc Verify email with OTP
 * @access Public
 */
router.post('/verify-email', validate('verifyEmail'), authController.verifyEmail);

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

module.exports = router;
