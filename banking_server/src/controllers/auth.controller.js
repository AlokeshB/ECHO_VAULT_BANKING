const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { encrypt } = require('../utils/encryption');
const emailService = require('../service/email.service');
const notificationService = require('../service/notification.service');
const Logger = require('../utils/logger');

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
            return res.status(409).json({
                success: false,
                message: 'Email already registered. Please log in or use a different email.'
            });
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
        
        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email for the OTP to verify your account.',
            data: {
                userId: user._id,
                email: user.email
            }
        });
    }
    catch (err) {
        if (err.code === 11000) {
            Logger.warn(`Duplicate key error during registration: ${err.message}`);
            return res.status(409).json({
                success: false,
                message: 'Email already registered.'
            });
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
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP.'
            });
        }
        
        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save({ validateBeforeSave: false });
        
        Logger.info(`Email verified for: ${email}`);
        
        res.status(200).json({
            success: true,
            message: 'Email verified successfully. Your account is now active.'
        });
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
        
        res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                token,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    customUserID: user.customUserID || null
                }
            }
        });
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
        
        res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                token,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    customUserID: user.customUserID,
                    role: user.role
                }
            }
        });
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
            return res.status(409).json({
                success: false,
                message: 'Email already exists.'
            });
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
        
        res.status(201).json({
            success: true,
            message: 'Support user created successfully.',
            data: {
                userId: supportUser._id,
                email: supportUser.email
            }
        });
    }
    catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists.'
            });
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
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
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
        
        res.status(200).json({
            success: true,
            message: 'Customer account approved and KYC request sent.'
        });
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
            return res.status(403).json({
                success: false,
                message: 'Your account is not approved yet. Please wait for admin approval.'
            });
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
        
        res.status(200).json({
            success: true,
            message: 'KYC documents submitted successfully.'
        });
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
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
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
            
            res.status(200).json({
                success: true,
                message: 'KYC verified successfully.',
                data: {
                    customUserID: user.customUserID,
                    email: user.email
                }
            });
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
            
            res.status(200).json({
                success: true,
                message: 'KYC rejected. User must resubmit documents.',
                data: {
                    rejectionReason: user.kycData.rejectionReason
                }
            });
        }
    }
    catch (err) {
        Logger.error(`KYC review error: ${err.message}`);
        next(err);
    }
};