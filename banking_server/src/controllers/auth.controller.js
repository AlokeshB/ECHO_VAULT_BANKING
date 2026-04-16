const crypto = require('crypto');
const User = require('../models/User');
const { encrypt } = require('../utils/encryption');
const emailService = require('../service/email.service');

/**
 * @desc 1. User Self registration
 * @route POST api/v1/auth/register
 * @access Public
 */
exports.registerCustomer = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password } = req.body;
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
        
        emailService.sendOTPEmail(user.email, otp, user._id);
        
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
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP.'
            });
        }
        
        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save({ validateBeforeSave: false });
        
        res.status(200).json({
            success: true,
            message: 'Email verified successfully. Your account is now active.'
        });
    }
    catch (err) {
        next(err);
    }
};

/** 
 * @desc  3. Admin creates support users
 * @route POST api/v1/auth/create-support
 * @access Private (Admin only)
*/
exports.createSupportUser = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const supportUser = await User.create({
            firstName,
            lastName,
            email,
            password,
            role: 'support',
            isEmailVerified: true,
            accountApprovalStatus: 'approved'
        });
        
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
        next(err);
    }
};

/**
 * @desc 4. Admin approves customer accounts & requests KYC
 * @route PATCH api/v1/auth/admin/approve-account/:userId
 * @access Private (Admin only)
 */
exports.approveCustomerAccount = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }
        
        user.accountApprovalStatus = 'approved';
        await user.save({ validateBeforeSave: false });
        
        emailService.sendEmail({
            to: user.email,
            subject: 'Account Approved',
            text: 'Your account has been approved by the admin. Please proceed to submit your KYC documents.',
            userId: user._id,
            action: 'ACCOUNT_APPROVED',
            resource: 'account'
        });
        
        emailService.sendKYCRequestEmail(user.email, user._id);
        
        res.status(200).json({
            success: true,
            message: 'Customer account approved and KYC request sent.'
        });
    }
    catch (err) {
        next(err);
    }
};

/** 
 * @desc 5. User submits KYC documents
 * @route POST api/v1/auth/submit-kyc
 * @access Private (Logged in Customer only)
*/
exports.submitKYC = async (req, res, next) => {
    try {
        const { panNumber, aadhaarNumber } = req.body;
        const user = await User.findById(req.user._id);
        
        if (user.accountApprovalStatus !== 'approved') {
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
        
        emailService.sendEmail({
            to: user.email,
            subject: 'KYC Submitted',
            text: 'Your KYC documents have been submitted successfully. Our team will review them shortly.',
            userId: user._id,
            action: 'KYC_SUBMITTED',
            resource: 'kyc'
        });
        
        res.status(200).json({
            success: true,
            message: 'KYC documents submitted successfully.'
        });
    }
    catch (err) {
        next(err);
    }
};

/**
 * @desc 6. Admin reviews and verifies KYC documents
 * @route PATCH api/v1/auth/admin/review-kyc/:userId
 * @access Private (Admin only)
*/
exports.reviewKYC = async (req, res, next) => {
    try {
        const { action, rejectionReason } = req.body; // action can be 'verify' or 'reject'
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }
        
        if (action === 'verify' || action === 'verified') {
            user.kycStatus = 'verified';
            user.kycData.verifiedAt = Date.now();
            await user.save({ validateBeforeSave: false });
            
            emailService.sendKYCOutcomeEmail(user.email, 'approved', user._id);
            
            res.status(200).json({
                success: true,
                message: 'KYC verified successfully.'
            });
        }
        else if (action === 'reject' || action === 'rejected') {
            user.kycStatus = 'rejected';
            user.kycData.rejectedAt = Date.now();
            user.kycData.rejectionReason = rejectionReason || 'No reason provided';
            await user.save({ validateBeforeSave: false });
            
            emailService.sendKYCOutcomeEmail(user.email, 'rejected', user._id);
            
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
        next(err);
    }
};