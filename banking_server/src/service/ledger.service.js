/**
 * @description : Ledger Service (The Engine): 
 * This handles the Pure Mathematics and Database Integrity. 
 * It executes Double-Entry Bookkeeping (debit sender, credit receiver) inside an ACID Database Transaction. 
 * It does not care about KYC or PINs; it only cares that money is never created or destroyed out of thin air.
 */
const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');
const Logger = require('../utils/logger');

/**
 * @desc Core Financial Engine: Executes Double-Entry Bookkeeping atomically
 */
exports.executeInternalTransfer = async (senderId, receiverId, amount, description, auditContext) => {
    const session = await mongoose.startSession(); //Starting an ACID database session 
    session.startTransaction(); //Starting the transaction
    try {
        const transactionRef = `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`; //Unique transaction reference for idempotency and audit trails
        //Atomic debit from sender
        const senderAccount = await Account.findOneAndUpdate({
            _id: senderId,
            status: 'active',
            balance: { $gte: amount } //Ensuring sufficient funds   
        }, {
            $inc: { balance: -amount },
        },
            { new: true, session });
        if (!senderAccount)
            throw new Error('Sender account not found, inactive, or insufficient funds');

        //Atomic credit to receiver
        const receiverAccount = await Account.findOneAndUpdate({
            _id: receiverId,
            status: 'active'
        },
            { $inc: { balance: amount } },
            { new: true, session });
        if (!receiverAccount)
            throw new Error('Receiver account not found or inactive');

        //Recording the transaction for audit and reconciliation
        const transactionRecord = await Transaction.create(
            [
                {
                    transactionReference: transactionRef,
                    sender: senderId,
                    receiver: receiverId,
                    amount,
                    type: 'transfer',
                    status: 'completed',
                    description: description,
                    metadata: {
                        ipAddress: auditContext.ipAddress,
                        userAgent: auditContext.userAgent,
                        correlationId: auditContext.correlationId,
                        deviceId: auditContext.deviceId?.device
                    }
                }
            ], { session }
        );
        //Commit the transaction if all operations succeed
        await session.commitTransaction();
        Logger.info(`Ledger Service: Internal transfer successful for senderId ${senderId} to receiverId ${receiverId}`, { senderId, receiverId, amount, transactionReference: transactionRef, ...auditContext });
        return transactionRecord[0];
    }
    catch (error) {
        await session.abortTransaction(); //Rollback on error
        Logger.error(`Ledger Service: Internal transfer failed and rolled back - ${error.message}`, { senderId, receiverId, amount, error: error.message, ...auditContext });
        throw error;
    }
    finally {
        session.endSession();
    }
};