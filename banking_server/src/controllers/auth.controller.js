const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { encrypt, decrypt } = require('../utils/encryption');
const notificationService = require('../service/notification.service');
const adminActionsService = require('../service/admin-actions.service');
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
        
        Logger.info(`Registration successful for email: ${email}`);
        
        return successResponse(
            res,
            {
                userId: user._id,
                email: user.email,
                otp: otp // Return OTP for frontend display (in real app, show via in-app notification/SMS)
            },
            'Registration successful. Use the OTP to verify your account.',
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
        
        // Check if 2FA (PIN) is enabled
        if (user.twoFactorEnabled && user.transactionPin) {
            const token = generateToken(user._id);
            
            Logger.info(`User attempting login via email with 2FA enabled: ${user.email}`);
            
            return successResponse(
                res,
                {
                    token,
                    user: {
                        id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        role: user.role
                    },
                    twoFactorRequired: true,
                    message: 'Please verify your PIN to complete login'
                },
                'PIN verification required.',
                200
            );
        }
        
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
                    customUserID: user.customUserID || null,
                    twoFactorEnabled: user.twoFactorEnabled
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
        
        // Check if 2FA (PIN) is enabled
        if (user.twoFactorEnabled && user.transactionPin) {
            const token = generateToken(user._id);
            
            Logger.info(`User attempting login via UserID with 2FA enabled: ${user.customUserID}`);
            
            return successResponse(
                res,
                {
                    token,
                    user: {
                        id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        customUserID: user.customUserID,
                        role: user.role
                    },
                    twoFactorRequired: true,
                    message: 'Please verify your PIN to complete login'
                },
                'PIN verification required.',
                200
            );
        }
        
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
                    role: user.role,
                    twoFactorEnabled: user.twoFactorEnabled
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
 * @desc 5. Verify 2FA PIN during login
 * @route POST api/v1/auth/verify-2fa-pin
 * @access Private (requires token after email/userID login)
 */
exports.verify2FAPIN = async (req, res, next) => {
    try {
        const { pin } = req.body;
        const user = await User.findById(req.user._id).select('+transactionPin');
        
        if (!user.twoFactorEnabled || !user.transactionPin) {
            Logger.warn(`2FA verification attempted but not enabled for user: ${user.email}`);
            return errorResponse(res, null, 403, '2FA is not enabled for this account.');
        }
        
        // Verify PIN
        const isPinCorrect = await user.correctPin(pin, user.transactionPin);
        if (!isPinCorrect) {
            Logger.warn(`Invalid PIN during 2FA verification: ${user.email}`);
            return errorResponse(res, null, 401, 'Invalid PIN.');
        }
        
        // Generate new complete token with 2FA verified
        const token = generateToken(user._id);
        user.lastLoginAt = Date.now();
        await user.save({ validateBeforeSave: false });
        
        Logger.info(`2FA PIN verified for user: ${user.email}`);
        
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
                    role: user.role,
                    twoFactorEnabled: user.twoFactorEnabled
                }
            },
            '2FA verification successful. Login complete.',
            200
        );
    } catch (err) {
        Logger.error(`2FA verification error: ${err.message}`);
        next(err);
    }
};

/** 
 * @desc 6. Admin creates support users
 * @route POST api/v1/auth/create-support
 * @access Private (Admin only)
*/
exports.createSupportUser = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        
        const result = await adminActionsService.createSupportUser(firstName, lastName, email, password);
        
        if (!result.success) {
            const statusCode = result.message === 'Email already exists' ? 409 : 400;
            return errorResponse(res, null, statusCode, result.message);
        }
        
        return successResponse(
            res,
            {
                userId: result.userId,
                email: result.email
            },
            result.message,
            201
        );
    }
    catch (err) {
        Logger.error(`Support user creation error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc 7. Admin approves customer accounts & requests KYC
 * @route PATCH api/v1/auth/admin/approve-account/:userId
 * @access Private (Admin only)
 */
exports.approveCustomerAccount = async (req, res, next) => {
    try {
        const { adminMessage } = req.body;
        const result = await adminActionsService.approveCustomerAccount(req.params.userId, adminMessage);
        
        if (!result.success) {
            return errorResponse(res, null, 404, result.message);
        }
        
        return successResponse(res, null, result.message, 200);
    }
    catch (err) {
        Logger.error(`Account approval error: ${err.message}`);
        next(err);
    }
};

/** 
 * @desc 8. User submits KYC documents
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
        
        // Notify admin about KYC submission
        await notificationService.notifyUserAction({
            userId: user._id,
            action: 'KYC_SUBMITTED',
            message: `${user.firstName} ${user.lastName} (${user.email}) submitted KYC documents for verification`
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
 * @desc 9. Admin reviews and verifies KYC documents
 * @route PATCH api/v1/auth/admin/review-kyc/:userId
 * @access Private (Admin only)
*/
exports.reviewKYC = async (req, res, next) => {
    try {
        const { action, rejectionReason } = req.body;
        
        const result = await adminActionsService.reviewKYC(req.params.userId, action, rejectionReason);
        
        if (!result.success) {
            return errorResponse(res, null, 404, result.message);
        }
        
        return successResponse(
            res,
            action === 'verify' || action === 'verified' 
                ? { customUserID: result.customUserID, email: result.email }
                : { rejectionReason: result.rejectionReason },
            result.message,
            200
        );
    }
    catch (err) {
        Logger.error(`KYC review error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc Get KYC data (with decryption) for admin verification or user view
 * @route GET /api/v1/auth/kyc-data/:userId
 * @access Private (Admin only for other users, or user for self)
 */
exports.getKYCData = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const requestingUser = req.user._id;
        const requestingUserRole = req.user.role;

        // Authorization: User can only view their own KYC, or admin can view any
        if (requestingUserRole !== 'admin' && requestingUser.toString() !== userId) {
            Logger.warn(`Unauthorized KYC view attempt - User ${requestingUser} accessing ${userId}`);
            return errorResponse(res, null, 403, 'You do not have permission to view this KYC data.');
        }

        const result = await adminActionsService.getUserKYCData(userId);
        
        if (!result.success) {
            return errorResponse(res, null, 404, result.message);
        }

        Logger.info(`KYC data retrieved - User: ${userId}, Requested by: ${requestingUser}`);

        return successResponse(
            res,
            {
                userId: result.userId,
                email: result.email,
                kycStatus: result.kycStatus,
                kycData: result.kycData
            },
            'KYC data retrieved successfully.',
            200
        );
    } catch (err) {
        Logger.error(`Error retrieving KYC data: ${err.message}`);
        next(err);
    }
};

/**
 * @desc 10. User sets up 2FA PIN (Two-Factor Authentication)
 * @route POST /api/v1/auth/setup-2fa-pin
 * @access Private (Logged in Customer only, after KYC is verified)
 */
exports.setup2FAPIN = async (req, res, next) => {
    try {
        const { pin, otp } = req.body;
        const user = await User.findById(req.user._id).select('+otp +otpExpires +transactionPin');

        if (user.kycStatus !== 'verified') {
            Logger.warn(`2FA PIN setup attempted without verified KYC: ${user.email}`);
            return errorResponse(res, null, 403, 'Your KYC must be verified before setting up 2FA PIN.');
        }

        if (user.transactionPin) {
            Logger.warn(`2FA PIN setup attempted but PIN already exists: ${user.email}`);
            return errorResponse(res, null, 409, '2FA PIN already set. Please use change PIN option.');
        }

        // Verify OTP
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
        if (user.otp !== hashedOTP || user.otpExpires < Date.now()) {
            Logger.warn(`Invalid OTP attempt during 2FA PIN setup: ${user.email}`);
            return errorResponse(res, null, 400, 'Invalid or expired OTP.');
        }

        // Set 2FA PIN
        user.transactionPin = pin;
        user.twoFactorEnabled = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save({ validateBeforeSave: false });

        Logger.info(`2FA PIN setup completed for: ${user.email}`);

        return successResponse(
            res,
            null,
            '2FA PIN set successfully. You can now use two-factor authentication for login.',
            201
        );
    } catch (err) {
        Logger.error(`2FA PIN setup error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc 11. User changes their password
 * @route PATCH /api/v1/auth/change-password
 * @access Private (Logged in users only)
 */
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');

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

        // Update password
        user.password = newPassword;
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
 * @desc 12. User requests password reset (Forgot Password)
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

        Logger.info(`Password reset OTP generated for: ${user.email}`);

        return successResponse(
            res,
            { 
                email: user.email,
                otp: otp // Return OTP for frontend display
            },
            'Password reset OTP generated. Please verify with OTP.',
            200
        );
    } catch (err) {
        Logger.error(`Forgot password error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc 13. User resets password with OTP
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
 * @desc 14. User changes 2FA PIN
 * @route PATCH /api/v1/auth/change-2fa-pin
 * @access Private (Logged in users with 2FA enabled only)
 */
exports.change2FAPIN = async (req, res, next) => {
    try {
        const { currentPin, newPin } = req.body;
        const user = await User.findById(req.user._id).select('+transactionPin');

        if (!user || !user.transactionPin || !user.twoFactorEnabled) {
            Logger.warn(`2FA PIN change attempted without existing PIN: ${req.user._id}`);
            return errorResponse(res, null, 403, '2FA not enabled. Please set up 2FA PIN first.');
        }

        // Verify current PIN
        const isPinCorrect = await user.correctPin(currentPin, user.transactionPin);
        if (!isPinCorrect) {
            Logger.warn(`Invalid current PIN during 2FA change: ${user.email}`);
            return errorResponse(res, null, 401, 'Current PIN is incorrect.');
        }

        // Update PIN
        user.transactionPin = newPin;
        user.transactionPinAttempts = 0;
        await user.save({ validateBeforeSave: false });

        Logger.info(`2FA PIN changed successfully for: ${user.email}`);

        return successResponse(
            res,
            null,
            '2FA PIN changed successfully.',
            200
        );
    } catch (err) {
        Logger.error(`2FA PIN change error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc 15. User disables 2FA
 * @route PATCH /api/v1/auth/disable-2fa
 * @access Private (Logged in users only)
 */
exports.disable2FA = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('+transactionPin');

        if (!user.twoFactorEnabled) {
            Logger.warn(`2FA disable attempted but not enabled: ${user.email}`);
            return errorResponse(res, null, 403, '2FA is not enabled for this account.');
        }

        user.transactionPin = undefined;
        user.twoFactorEnabled = false;
        user.transactionPinAttempts = 0;
        await user.save({ validateBeforeSave: false });

        Logger.info(`2FA disabled for: ${user.email}`);

        return successResponse(
            res,
            null,
            '2FA disabled successfully.',
            200
        );
    } catch (err) {
        Logger.error(`2FA disable error: ${err.message}`);
        next(err);
    }
};

/**
 * @desc 11. Admin gets all users with optional filters (for admin dashboard)
 * @route GET /api/v1/auth/admin/users
 * @access Private (Admin only)
 * @query role, kycStatus, accountApprovalStatus
 */
exports.getAllUsers = async (req, res, next) => {
    try {
        // Extract filters from query parameters
        const filters = {};
        if (req.query.role) {
            filters.role = req.query.role;
        }
        if (req.query.kycStatus) {
            filters.kycStatus = req.query.kycStatus;
        }
        if (req.query.accountApprovalStatus) {
            filters.accountApprovalStatus = req.query.accountApprovalStatus;
        }

        const result = await adminActionsService.getAllUsers(filters);
        
        if (!result.success) {
            return errorResponse(res, null, 400, result.message);
        }

        Logger.info(`Retrieved ${result.users.length} users with filters: ${JSON.stringify(filters)}`);

        return successResponse(
            res,
            {
                totalUsers: result.users.length,
                users: result.users
            },
            'Users retrieved successfully',
            200
        );
    } catch (err) {
        Logger.error(`Error retrieving users: ${err.message}`);
        next(err);
    }
};