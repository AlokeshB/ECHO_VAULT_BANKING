const mongoose = require('mongoose');
const AccountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    accountNumber: {
        type: String,
        required: true,
        unique: true
    },
    accountType: {
        type: String,
        enum: ['savings', 'checking', 'business'],
        required: true,
        default: 'savings'
    },
    balance: {
        type: Number,
        required: true,
        default: 0.00
    },
    currency: {
        type: String,
        required: true,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['active', 'frozen', 'closed'],
        default: 'active'
    }
},
    { timestamps: true });
module.exports = mongoose.model('Account', AccountSchema);