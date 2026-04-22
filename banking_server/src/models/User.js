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
        panNumber: { type: String, unique: true, sparse: true, required: true, select: false },
        aadhaarNumber: { type: String, unique: true, sparse: true, required: true, select: false },
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
    // Transaction PIN Fields
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
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password') && !this.isModified('transactionPin')) return next();
    
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
        this.lastPasswordChangeAt = Date.now();
    }
    
    if (this.isModified('transactionPin')) {
        this.transactionPin = await bcrypt.hash(this.transactionPin, 12);
        this.transactionPinCreatedAt = Date.now();
    }
    
    next();
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