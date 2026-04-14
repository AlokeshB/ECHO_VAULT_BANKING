const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
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
    }
},
    { timestamps: true });
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});
UserSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
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
module.exports = mongoose.model('User', UserSchema);