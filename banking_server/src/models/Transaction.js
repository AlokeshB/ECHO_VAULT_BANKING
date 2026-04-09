const mongoose = require('mongoose');
const TransactionSchema = new mongoose.Schema({
    transactionReference: {
        type: String,
        required: true,
        unique: true
    },
    senderAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
        index: true
    },
    recieverAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
        index: true
    },
    amount: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },
    type: {
        type: String,
        enum: ['transfer', 'deposit', 'withdrawal', 'reversal'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed','reversed'],
        default: 'pending',
        index: true
    },
    description: {
        type: String,
        trim: true
    },
    metadata: {
        ipAddress: String,
        userAgent: String,
        location: String,
        deviceId: String
    }
},
    { timestamps: true });
TransactionSchema.index({ transactionReference: 1 });
module.exports = mongoose.model('Transaction', TransactionSchema);
