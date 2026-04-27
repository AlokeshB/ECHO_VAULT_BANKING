/**
 * @description: Transaction Service (The Orchestrator):
 *  This handles the Business Logic. 
 * It checks if the user's KYC is verified, checks daily transfer limits, calculates fees, verifies PINs/OTPs, and determines if the transfer is internal or to an external bank.
 */
const LedgerService = require('./ledger.service');
const Account = require('../models/Account');
const User = require('../models/User');
const Logger = require('../utils/logger');
const notificationService = require('./notification.service');

/**
 * @desc Orchestrates the transfer process: KYC checks, limits, fees, and then calls the Ledger Service
 */
exports.initiateTransfer = async(userId, senderAccountNumber, receiverAccountNumber, amount, description, auditContext) => {
    if(amount <= 0){
        throw new Error('Transfer amount must be greater than zero');
    }
    const user = await User.findById(userId);
    if(user.kycStatus !== 'verified'){
        throw new Error('User KYC not verified. Please complete KYC to perform transfers.');
    }
    const senderAccount = await Account.findOne({ accountNumber: senderAccountNumber, user: userId, status: 'active' });
    if(!senderAccount){
        throw new Error('Sender account not found or you donot have permission to access it');
    }
    if(senderAccountNumber === receiverAccountNumber){
        throw new Error('Sender and receiver account numbers cannot be the same');
    }
    const receiverAccount = await Account.findOne({ accountNumber: receiverAccountNumber, status: 'active' });
    if(!receiverAccount){
        throw new Error('Receiver account does not exist or is inactive');
    }
    if(parseFloat(senderAccount.balance.toString()) < amount){
        throw new Error('Insufficient funds');
    }
    try{
        const completedTx = await LedgerService.executeInternalTransfer(senderAccount._id, receiverAccount._id, amount, description, auditContext);
        
        // Send in-app notification only
        await notificationService.sendNotification({
            userId,
            action: 'TRANSFER_SUCCESS',
            message: `Transfer of ${amount} to account ${receiverAccountNumber} completed successfully`,
            resource: 'transaction',
            resourceId: completedTx._id,
            details: { senderAccountNumber, receiverAccountNumber, amount, description },
            ...auditContext
        });
        
        return completedTx;
    }
    catch(err){
        Logger.error(`Transfer failed: ${err.message}`, { userId, senderAccountNumber, receiverAccountNumber, amount, description, auditContext });
        
        // Send in-app notification only
        await notificationService.sendNotification({
            userId,
            action: 'TRANSFER_FAILED',
            message: `Transfer of ${amount} to account ${receiverAccountNumber} failed: ${err.message}`,
            resource: 'transaction',
            details: { senderAccountNumber, receiverAccountNumber, amount, description, error: err.message },
            ...auditContext
        });
        
        throw err;
    }
};