const User = require('../models/User');
const notificationService = require('./notification.service');
const Logger = require('../utils/logger');

/**
 * @desc Admin approves customer account
 */
exports.approveCustomerAccount = async (userId, adminMessage = null) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return { success: false, message: 'User not found' };
        }
        
        user.accountApprovalStatus = 'approved';
        await user.save({ validateBeforeSave: false });
        
        // Notify user about account approval
        await notificationService.notifyAdminAction({
            userId: user._id,
            action: 'ACCOUNT_APPROVED',
            message: adminMessage || 'Your account has been approved. Please proceed to submit your KYC documents.'
        });
        
        Logger.info(`Account approved for user: ${user.email}`);
        return { success: true, message: 'Customer account approved' };
    } catch (err) {
        Logger.error(`Account approval error: ${err.message}`);
        throw err;
    }
};

/**
 * @desc Admin reviews and verifies KYC documents
 */
exports.reviewKYC = async (userId, action, rejectionReason = null) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return { success: false, message: 'User not found' };
        }
        
        if (action === 'verify' || action === 'verified') {
            user.kycStatus = 'verified';
            user.kycData.verifiedAt = Date.now();
            
            // Generate custom UserID on successful KYC verification
            if (!user.customUserID) {
                let customUserID;
                let userExists = true;
                
                while (userExists) {
                    const randomNum = Math.floor(1000 + Math.random() * 9000);
                    customUserID = `VBANK${randomNum}`;
                    const existingUser = await User.findOne({ customUserID });
                    userExists = !!existingUser;
                }
                
                user.customUserID = customUserID;
            }
            
            await user.save({ validateBeforeSave: false });
            
            // Notify user about KYC verification
            await notificationService.notifyAdminAction({
                userId: user._id,
                action: 'KYC_VERIFIED',
                message: `Congratulations! Your KYC has been verified. Your unique Vault Banking User ID is: ${user.customUserID}. You can use this ID along with your password to log in.`
            });
            
            Logger.info(`KYC verified for user: ${user.email}, UserID: ${user.customUserID}`);
            
            return {
                success: true,
                message: 'KYC verified successfully',
                customUserID: user.customUserID,
                email: user.email
            };
        }
        else if (action === 'reject' || action === 'rejected') {
            user.kycStatus = 'rejected';
            user.kycData.rejectedAt = Date.now();
            user.kycData.rejectionReason = rejectionReason || 'No reason provided';
            await user.save({ validateBeforeSave: false });
            
            // Notify user about KYC rejection
            await notificationService.notifyAdminAction({
                userId: user._id,
                action: 'KYC_REJECTED',
                message: `Your KYC has been rejected. Reason: ${user.kycData.rejectionReason}. Please resubmit your documents.`
            });
            
            Logger.info(`KYC rejected for user: ${user.email}`);
            
            return {
                success: true,
                message: 'KYC rejected. User must resubmit documents.',
                rejectionReason: user.kycData.rejectionReason
            };
        }
        
        return { success: false, message: 'Invalid action' };
    } catch (err) {
        Logger.error(`KYC review error: ${err.message}`);
        throw err;
    }
};

/**
 * @desc Admin creates support user
 */
exports.createSupportUser = async (firstName, lastName, email, password) => {
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            Logger.warn(`Support user creation attempt with existing email: ${email}`);
            return { success: false, message: 'Email already exists' };
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
        
        return {
            success: true,
            message: 'Support user created successfully',
            userId: supportUser._id,
            email: supportUser.email
        };
    } catch (err) {
        if (err.code === 11000) {
            Logger.warn(`Duplicate email during support user creation: ${email}`);
            return { success: false, message: 'Email already exists' };
        }
        Logger.error(`Support user creation error: ${err.message}`);
        throw err;
    }
};

/**
 * @desc Get all users (for admin dashboard)
 */
exports.getAllUsers = async (filters = {}) => {
    try {
        const query = {};
        
        if (filters.role) {
            query.role = filters.role;
        }
        
        if (filters.kycStatus) {
            query.kycStatus = filters.kycStatus;
        }
        
        if (filters.accountApprovalStatus) {
            query.accountApprovalStatus = filters.accountApprovalStatus;
        }
        
        const users = await User.find(query).select('-password -otp -transactionPin');
        
        Logger.info(`Retrieved ${users.length} users with filters: ${JSON.stringify(filters)}`);
        
        return { success: true, users };
    } catch (err) {
        Logger.error(`Error fetching users: ${err.message}`);
        throw err;
    }
};

/**
 * @desc Get user KYC data for admin verification
 */
exports.getUserKYCData = async (userId) => {
    try {
        const { decrypt } = require('../utils/encryption');
        
        const user = await User.findById(userId).select('+kycData');
        if (!user) {
            return { success: false, message: 'User not found' };
        }
        
        if (!user.kycData || !user.kycData.panNumber) {
            return { success: false, message: 'No KYC data available for this user' };
        }
        
        // Decrypt sensitive data
        const decryptedKYCData = {
            panNumber: decrypt(user.kycData.panNumber),
            aadhaarNumber: decrypt(user.kycData.aadhaarNumber),
            submittedAt: user.kycData.submittedAt,
            verifiedAt: user.kycData.verifiedAt,
            rejectedAt: user.kycData.rejectedAt,
            rejectionReason: user.kycData.rejectionReason
        };
        
        Logger.info(`KYC data retrieved for user: ${userId}`);
        
        return {
            success: true,
            userId: user._id,
            email: user.email,
            kycStatus: user.kycStatus,
            kycData: decryptedKYCData
        };
    } catch (err) {
        Logger.error(`Error retrieving KYC data: ${err.message}`);
        throw err;
    }
};
