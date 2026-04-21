const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { encrypt } = require('../utils/encryption');
const emailService = require('../service/email.service');
const notificationService = require('../service/notification.service');
const Logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @desc Generate JWT token
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

/**
 * @desc Generate unique custom UserID in format VBANK XXXX
 */
const generateCustomUserID = async () => {
    let customUserID;
    let userExists = true;
    
    while (userExists) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        customUserID = `VBANK${randomNum}`;
        const user = await User.findOne({ customUserID });
        userExists = !!user;
    }
    
    return customUserID;
};

/**
 * @desc 1. User Self registration
 * @route POST api/v1/auth/register
 * @access Public
 */
exports.registerCustomer = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            Logger.warn(`Registration attempt with existing email: ${email}`);
            return errorResponse(res, null, 409, 'Email already registered. Please log in or use a different email.');
        }
        
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            role: 'customer'
        });
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = crypto.createHash('sha256').update(otp).digest('hex');
        user.otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
        await user.save({ validateBeforeSave: false });
        
        await emailService.sendOTPEmail(user.email, otp, user._id);
        Logger.info(`Registration successful for email: ${email}`);
        
        return successResponse(
            res,
            {
                userId: user._id,
                email: user.email
            },
            'Registration successful. Please check your email for the OTP to verify your account.',
            201
        );
    }
    catch (err) {
        if (err.code === 11000) {
            Logger.warn(`Duplicate key error during registration: ${err.message}`);
            return errorResponse(res, null, 409, 'Email already registered.');
        }
        Logger.error(`Registration error: ${err.message}`);
        next(err);
    }
};

/** 
 * @desc 2. Email verification via OTP
 * @route POST api/v1/auth/verify-email
 * @access Public
 */
exports.verifyEmail = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
        const user = await User.findOne({
            email,
            otp: hashedOTP,
            otpExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            Logger.warn(`Invalid OTP attempt for email: ${email}`);
            return errorResponse(res, null, 400, 'Invalid or expired OTP.');
        }
        
        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save({ validateBeforeSave: false });
        
        Logger.info(`Email verified for: ${email}`);
        
        return successResponse(
            res,
            null,
            'Email verified successfully. Your account is now active.',
            200
        );
    }
    catch (err) {
        Logger.error(`Email verification error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc 3. Login with Email and Password
 * @route POST api/v1/auth/login-email
 * @access Public
 */
exports.loginWithEmail = async (req, res, next) => {
    try {
        const user = req.user;
        const token = generateToken(user._id);
        
        user.lastLoginAt = Date.now();
        await user.save({ validateBeforeSave: false });
        
        Logger.info(`User logged in via email: ${user.email}`);
        
        return successResponse(
            res,
            {
                token,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    customUserID: user.customUserID || null
                }
            },
            'Login successful.',
            200
        );
    }
    catch (err) {
        Logger.error(`Email login error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc 4. Login with UserID and Password
 * @route POST api/v1/auth/login-userid
 * @access Public
 */
exports.loginWithUserID = async (req, res, next) => {
    try {
        const user = req.user;
        const token = generateToken(user._id);
        
        user.lastLoginAt = Date.now();
        await user.save({ validateBeforeSave: false });
        
        Logger.info(`User logged in via UserID: ${user.customUserID}`);
        
        return successResponse(
            res,
            {
                token,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    customUserID: user.customUserID,
                    role: user.role
                }
            },
            'Login successful.',
            200
        );
    }
    catch (err) {
        Logger.error(`UserID login error: ${err.message}`);
        next(err);
    }
};

/** 
 * @desc 5. Admin creates support users
 * @route POST api/v1/auth/create-support
 * @access Private (Admin only)
*/
exports.createSupportUser = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            Logger.warn(`Support user creation attempt with existing email: ${email}`);
            return errorResponse(res, null, 409, 'Email already exists.');
        }
        
        const supportUser = await User.create({
            firstName,
            lastName,
            email,
            password,
            role: 'support',
            isEmailVerified: true,
            accountApprovalStatus: 'approved'
        });
        
        Logger.info(`Support user created: ${email}`);
        
        return successResponse(
            res,
            {
                userId: supportUser._id,
                email: supportUser.email
            },
            'Support user created successfully.',
            201
        );
    }
    catch (err) {
        if (err.code === 11000) {
            return errorResponse(res, null, 409, 'Email already exists.');
        }
        Logger.error(`Support user creation error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc 6. Admin approves customer accounts & requests KYC
 * @route PATCH api/v1/auth/admin/approve-account/:userId
 * @access Private (Admin only)
 */
exports.approveCustomerAccount = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            Logger.warn(`Account approval attempt for non-existent user: ${req.params.userId}`);
            return errorResponse(res, null, 404, 'User not found.');
        }
        
        user.accountApprovalStatus = 'approved';
        await user.save({ validateBeforeSave: false });
        
        await emailService.sendEmail({
            to: user.email,
            subject: 'Account Approved',
            text: 'Your account has been approved by the admin. Please proceed to submit your KYC documents.',
            userId: user._id,
            action: 'ACCOUNT_APPROVED',
            resource: 'account'
        });
        
        await emailService.sendKYCRequestEmail(user.email, user._id);
        await notificationService.notifyAdminAction({
            userId: user._id,
            action: 'ACCOUNT_APPROVED',
            message: `Admin approved account for ${user.email}`
        });
        
        Logger.info(`Account approved for user: ${user.email}`);
        
        return successResponse(
            res,
            null,
            'Customer account approved and KYC request sent.',
            200
        );
    }
    catch (err) {
        Logger.error(`Account approval error: ${err.message}`);
        next(err);
    }
};

/** 
 * @desc 7. User submits KYC documents
 * @route POST api/v1/auth/submit-kyc
 * @access Private (Logged in Customer only)
*/
exports.submitKYC = async (req, res, next) => {
    try {
        const { panNumber, aadhaarNumber } = req.body;
        const user = await User.findById(req.user._id);
        
        if (user.accountApprovalStatus !== 'approved') {
            Logger.warn(`KYC submission attempted with unapproved account: ${user.email}`);
            return errorResponse(res, null, 403, 'Your account is not approved yet. Please wait for admin approval.');
        }
        
        user.kycData = {
            panNumber: encrypt(panNumber),
            aadhaarNumber: encrypt(aadhaarNumber),
            submittedAt: Date.now()
        };
        user.kycStatus = 'pending';
        await user.save({ validateBeforeSave: false });
        
        await emailService.sendEmail({
            to: user.email,
            subject: 'KYC Submitted',
            text: 'Your KYC documents have been submitted successfully. Our team will review them shortly.',
            userId: user._id,
            action: 'KYC_SUBMITTED',
            resource: 'kyc'
        });
        
        await notificationService.notifyUserAction({
            userId: user._id,
            action: 'KYC_SUBMITTED',
            message: `${user.email} submitted KYC documents`
        });
        
        Logger.info(`KYC submitted for user: ${user.email}`);
        
        return successResponse(
            res,
            null,
            'KYC documents submitted successfully.',
            200
        );
    }
    catch (err) {
        Logger.error(`KYC submission error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc 8. Admin reviews and verifies KYC documents
 * @route PATCH api/v1/auth/admin/review-kyc/:userId
 * @access Private (Admin only)
*/
exports.reviewKYC = async (req, res, next) => {
    try {
        const { action, rejectionReason } = req.body;
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            Logger.warn(`KYC review attempted for non-existent user: ${req.params.userId}`);
            return errorResponse(res, null, 404, 'User not found.');
        }
        
        if (action === 'verify' || action === 'verified') {
            user.kycStatus = 'verified';
            user.kycData.verifiedAt = Date.now();
            
            // Generate custom UserID on successful KYC verification
            if (!user.customUserID) {
                user.customUserID = await generateCustomUserID();
            }
            
            await user.save({ validateBeforeSave: false });
            
            await emailService.sendKYCOutcomeEmail(user.email, 'approved', user._id);
            await emailService.sendEmail({
                to: user.email,
                subject: 'Your Vault Banking User ID',
                text: `Congratulations! Your KYC has been verified. Your unique Vault Banking User ID is: ${user.customUserID}. You can use this ID along with your password to log in.`,
                userId: user._id,
                action: 'USERID_GENERATED',
                resource: 'userid'
            });
            
            await notificationService.notifyAdminAction({
                userId: user._id,
                action: 'KYC_VERIFIED',
                message: `KYC verified for ${user.email}. UserID generated: ${user.customUserID}`
            });
            
            Logger.info(`KYC verified for user: ${user.email}, UserID: ${user.customUserID}`);
            
            return successResponse(
                res,
                {
                    customUserID: user.customUserID,
                    email: user.email
                },
                'KYC verified successfully.',
                200
            );
        }
        else if (action === 'reject' || action === 'rejected') {
            user.kycStatus = 'rejected';
            user.kycData.rejectedAt = Date.now();
            user.kycData.rejectionReason = rejectionReason || 'No reason provided';
            await user.save({ validateBeforeSave: false });
            
            await emailService.sendKYCOutcomeEmail(user.email, 'rejected', user._id);
            await notificationService.notifyAdminAction({
                userId: user._id,
                action: 'KYC_REJECTED',
                message: `KYC rejected for ${user.email}. Reason: ${rejectionReason}`
            });
            
            Logger.info(`KYC rejected for user: ${user.email}`);
            
            return successResponse(
                res,
                {
                    rejectionReason: user.kycData.rejectionReason
                },
                'KYC rejected. User must resubmit documents.',
                200
            );
        }
    }
    catch (err) {
        Logger.error(`KYC review error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc 9. User sets up Transaction PIN after KYC verification
 * @route POST /api/v1/auth/setup-transaction-pin
 * @access Private (Logged in Customer only, after KYC is verified)
 */
exports.setupTransactionPin = async (req, res, next) => {
    try {
        const { transactionPin, otp } = req.body;
        const user = await User.findById(req.user._id).select('+otp +otpExpires');

        if (user.kycStatus !== 'verified') {
            Logger.warn(`PIN setup attempted without verified KYC: ${user.email}`);
            return errorResponse(res, null, 403, 'Your KYC must be verified before setting up Transaction PIN.');
        }

        if (user.transactionPin) {
            Logger.warn(`PIN setup attempted but PIN already exists: ${user.email}`);
            return errorResponse(res, null, 409, 'Transaction PIN already set. Please use change PIN option.');
        }

        // Verify OTP
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
        if (user.otp !== hashedOTP || user.otpExpires < Date.now()) {
            Logger.warn(`Invalid OTP attempt during PIN setup: ${user.email}`);
            return errorResponse(res, null, 400, 'Invalid or expired OTP.');
        }

        // Set Transaction PIN
        user.transactionPin = transactionPin;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save({ validateBeforeSave: false });

        Logger.info(`Transaction PIN setup completed for: ${user.email}`);

        return successResponse(
            res,
            null,
            'Transaction PIN set successfully. You can now perform transfers.',
            201
        );
    } catch (err) {
        Logger.error(`PIN setup error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc 10. User changes their password
 * @route PATCH /api/v1/auth/change-password
 * @access Private (Logged in users only)
 */
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword, otp } = req.body;
        const user = await User.findById(req.user._id).select('+password +otp +otpExpires');

        if (!user) {
            Logger.warn(`Password change attempted for non-existent user: ${req.user._id}`);
            return errorResponse(res, null, 404, 'User not found.');
        }

        // Verify current password
        const isPasswordCorrect = await user.correctPassword(currentPassword, user.password);
        if (!isPasswordCorrect) {
            Logger.warn(`Invalid current password during password change: ${user.email}`);
            return errorResponse(res, null, 401, 'Current password is incorrect.');
        }

        // Verify OTP
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
        if (user.otp !== hashedOTP || user.otpExpires < Date.now()) {
            Logger.warn(`Invalid OTP attempt during password change: ${user.email}`);
            return errorResponse(res, null, 400, 'Invalid or expired OTP.');
        }

        // Update password
        user.password = newPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save({ validateBeforeSave: false });

        Logger.info(`Password changed successfully for: ${user.email}`);

        return successResponse(
            res,
            null,
            'Password changed successfully.',
            200
        );
    } catch (err) {
        Logger.error(`Password change error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc 11. User requests password reset (Forgot Password - Step 1)
 * @route POST /api/v1/auth/forgot-password
 * @access Public
 */
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            Logger.warn(`Forgot password attempt for non-existent email: ${email}`);
            return errorResponse(res, null, 404, 'User not found with this email address.');
        }

        // Generate OTP for password reset
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = crypto.createHash('sha256').update(otp).digest('hex');
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes validity
        await user.save({ validateBeforeSave: false });

        // Send OTP via email
        await emailService.sendOTPEmail(user.email, otp, user._id, 'password reset');
        Logger.info(`Password reset OTP sent to: ${user.email}`);

        return successResponse(
            res,
            { email: user.email },
            'Password reset OTP sent to your email. Please verify with OTP.',
            200
        );
    } catch (err) {
        Logger.error(`Forgot password error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc 12. User resets password with OTP (Forgot Password - Step 2)
 * @route PATCH /api/v1/auth/reset-password
 * @access Public
 */
exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email }).select('+otp +otpExpires');

        if (!user) {
            Logger.warn(`Password reset attempted for non-existent email: ${email}`);
            return errorResponse(res, null, 404, 'User not found.');
        }

        // Verify OTP
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
        if (user.otp !== hashedOTP || user.otpExpires < Date.now()) {
            Logger.warn(`Invalid OTP during password reset: ${user.email}`);
            return errorResponse(res, null, 400, 'Invalid or expired OTP.');
        }

        // Update password
        user.password = newPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save({ validateBeforeSave: false });

        Logger.info(`Password reset successfully for: ${user.email}`);

        return successResponse(
            res,
            null,
            'Password reset successfully. You can now log in with your new password.',
            200
        );
    } catch (err) {
        Logger.error(`Reset password error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc 13. User changes Transaction PIN
 * @route PATCH /api/v1/auth/change-transaction-pin
 * @access Private (Logged in users with existing PIN only)
 */
exports.changeTransactionPin = async (req, res, next) => {
    try {
        const { currentPin, newPin, otp } = req.body;
        const user = await User.findById(req.user._id).select('+transactionPin +otp +otpExpires');

        if (!user || !user.transactionPin) {
            Logger.warn(`PIN change attempted without existing PIN: ${req.user._id}`);
            return errorResponse(res, null, 403, 'Transaction PIN not set. Please set up PIN first.');
        }

        // Verify current PIN
        const isPinCorrect = await user.correctPin(currentPin, user.transactionPin);
        if (!isPinCorrect) {
            Logger.warn(`Invalid current PIN during PIN change: ${user.email}`);
            return errorResponse(res, null, 401, 'Current PIN is incorrect.');
        }

        // Verify OTP
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
        if (user.otp !== hashedOTP || user.otpExpires < Date.now()) {
            Logger.warn(`Invalid OTP during PIN change: ${user.email}`);
            return errorResponse(res, null, 400, 'Invalid or expired OTP.');
        }

        // Update PIN
        user.transactionPin = newPin;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.transactionPinAttempts = 0;
        await user.save({ validateBeforeSave: false });

        Logger.info(`Transaction PIN changed successfully for: ${user.email}`);

        return successResponse(
            res,
            null,
            'Transaction PIN changed successfully.',
            200
        );
    } catch (err) {
        Logger.error(`PIN change error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc 14. User requests Transaction PIN reset (Forgot PIN - Step 1)
 * @route POST /api/v1/auth/forgot-transaction-pin
 * @access Public
 */
exports.forgotTransactionPin = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            Logger.warn(`Forgot PIN attempt for non-existent email: ${email}`);
            return errorResponse(res, null, 404, 'User not found with this email address.');
        }

        if (!user.transactionPin) {
            Logger.warn(`Forgot PIN attempted but no PIN exists: ${user.email}`);
            return errorResponse(res, null, 403, 'No Transaction PIN set. Please set up PIN first.');
        }

        // Generate OTP for PIN reset
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = crypto.createHash('sha256').update(otp).digest('hex');
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes validity
        await user.save({ validateBeforeSave: false });

        // Send OTP via email
        await emailService.sendOTPEmail(user.email, otp, user._id, 'PIN reset');
        Logger.info(`PIN reset OTP sent to: ${user.email}`);

        return successResponse(
            res,
            { email: user.email },
            'PIN reset OTP sent to your email. Please verify with OTP.',
            200
        );
    } catch (err) {
        Logger.error(`Forgot PIN error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc 15. User resets Transaction PIN with OTP (Forgot PIN - Step 2)
 * @route PATCH /api/v1/auth/reset-transaction-pin
 * @access Public
 */
exports.resetTransactionPin = async (req, res, next) => {
    try {
        const { email, otp, newPin } = req.body;
        const user = await User.findOne({ email }).select('+otp +otpExpires');

        if (!user) {
            Logger.warn(`PIN reset attempted for non-existent email: ${email}`);
            return errorResponse(res, null, 404, 'User not found.');
        }

        // Verify OTP
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
        if (user.otp !== hashedOTP || user.otpExpires < Date.now()) {
            Logger.warn(`Invalid OTP during PIN reset: ${user.email}`);
            return errorResponse(res, null, 400, 'Invalid or expired OTP.');
        }

        // Update PIN
        user.transactionPin = newPin;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.transactionPinAttempts = 0;
        await user.save({ validateBeforeSave: false });

        Logger.info(`Transaction PIN reset successfully for: ${user.email}`);

        return successResponse(
            res,
            null,
            'Transaction PIN reset successfully. You can now use your new PIN for transfers.',
            200
        );
    } catch (err) {
        Logger.error(`Reset PIN error: ${err.message}`);
        next(err);
    }
};