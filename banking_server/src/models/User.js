const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { encrypt, decrypt } = require('../utils/encryption');
const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ['customer', 'admin', 'support'],
        default: 'customer',
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    accountApprovalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    kycStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    kycData: {
        panNumber: { type: String, unique: true, sparse: true, select: false },
        aadhaarNumber: { type: String, unique: true, sparse: true, select: false },
        submittedAt: Date,
        verifiedAt: Date,
        rejectedAt: Date,
        rejectionReason: String
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
        select: false
    },
    otpExpires: { type: Date, select: false },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    lastFailedLoginAt: {
        type: Date
    },
    loginAttemptWindow: {
        type: Date,
        default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minute window
    },
    // Transaction PIN Fields (6-digit PIN for 2FA)
    transactionPin: {
        type: String,
        select: false,
        required: false
    },
    transactionPinCreatedAt: Date,
    transactionPinAttempts: {
        type: Number,
        default: 0
    },
    transactionPinLockedUntil: Date,
    // Password Reset Fields
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: Date,
    // Transaction PIN Reset Fields
    transactionPinResetToken: {
        type: String,
        select: false
    },
    transactionPinResetExpires: Date,
    lastPasswordChangeAt: Date
},
    { timestamps: true });
UserSchema.pre('save', async function () {
    if (!this.isModified('password') && !this.isModified('transactionPin')) return;
    
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
        this.lastPasswordChangeAt = Date.now();
    }
    
    if (this.isModified('transactionPin')) {
        this.transactionPin = await bcrypt.hash(this.transactionPin, 12);
        this.transactionPinCreatedAt = Date.now();
    }
});
UserSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

/**
 * @desc Compare provided PIN with stored hashed PIN
 */
UserSchema.methods.correctPin = async function (candidatePin, userPin) {
    return await bcrypt.compare(candidatePin, userPin);
};
UserSchema.methods.incLoginAttempts = function () {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    return this.updateOne({ $inc: { loginAttempts: 1 } }, { new: true });
};

/**
 * @desc Record failed login attempt and apply tiered locks
 * Stage 1 (5 attempts): Soft warning
 * Stage 2 (8 attempts): OTP challenge required
 * Stage 3 (12+ attempts): 5-15 minute lockout
 */
UserSchema.methods.recordFailedLogin = async function () {
    const now = Date.now();
    
    // Reset attempts if window has expired
    if (this.loginAttemptWindow && this.loginAttemptWindow < now) {
        this.loginAttempts = 0;
        this.loginAttemptWindow = new Date(now + 15 * 60 * 1000); // New 15-min window
    }
    
    this.loginAttempts += 1;
    this.lastFailedLoginAt = new Date(now);
    
    // Stage 3: Apply temporary lock after 12 attempts
    if (this.loginAttempts >= 12) {
        this.lockUntil = new Date(now + (10 * 60 * 1000)); // Lock for 10 minutes
    }
    
    return await this.save({ validateBeforeSave: false });
};

/**
 * @desc Reset login attempts on successful login
 */
UserSchema.methods.resetLoginAttempts = async function () {
    this.loginAttempts = 0;
    this.lastFailedLoginAt = undefined;
    this.lockUntil = undefined;
    return await this.save({ validateBeforeSave: false });
};

/**
 * @desc Check if account is locked
 * Stage 1 (5 attempts): warning only
 * Stage 2 (8 attempts): OTP challenge required
 * Stage 3 (12+ attempts): temporarily locked
 */
UserSchema.methods.checkLoginStatus = function () {
    const now = Date.now();
    
    // Check hard lock (Stage 3)
    if (this.lockUntil && this.lockUntil > now) {
        return {
            isLocked: true,
            requiresOTP: false,
            remainingMinutes: Math.ceil((this.lockUntil - now) / 60000),
            attemptCount: this.loginAttempts
        };
    }
    
    // Check OTP requirement (Stage 2)
    if (this.loginAttempts >= 8) {
        return {
            isLocked: false,
            requiresOTP: true,
            attemptCount: this.loginAttempts
        };
    }
    
    // Warning stage (Stage 1)
    if (this.loginAttempts >= 5) {
        return {
            isLocked: false,
            requiresOTP: false,
            warning: true,
            attemptCount: this.loginAttempts
        };
    }
    
    return {
        isLocked: false,
        requiresOTP: false,
        warning: false,
        attemptCount: this.loginAttempts
    };
};

UserSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

/**
 * @desc Get decrypted KYC data (PAN and Aadhaar numbers)
 */
UserSchema.methods.getDecryptedKYC = function () {
    if (!this.kycData || !this.kycData.panNumber) {
        return null;
    }
    
    return {
        panNumber: decrypt(this.kycData.panNumber),
        aadhaarNumber: decrypt(this.kycData.aadhaarNumber),
        submittedAt: this.kycData.submittedAt,
        verifiedAt: this.kycData.verifiedAt,
        rejectedAt: this.kycData.rejectedAt,
        rejectionReason: this.kycData.rejectionReason
    };
};

/**
 * @desc Set encrypted KYC data (PAN and Aadhaar numbers)
 */
UserSchema.methods.setEncryptedKYC = function (panNumber, aadhaarNumber) {
    this.kycData = {
        panNumber: encrypt(panNumber),
        aadhaarNumber: encrypt(aadhaarNumber),
        submittedAt: Date.now()
    };
    return this;
};

module.exports = mongoose.model('User', UserSchema);