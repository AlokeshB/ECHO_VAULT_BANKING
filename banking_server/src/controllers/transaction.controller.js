const TransactionService = require('../service/transaction.service');
const { extractRequestMetaData } = require('../utils/request-parser');
const { successResponse, errorResponse } = require('../utils/response');
const User = require('../models/User');
const Logger = require('../utils/logger');

/**
 * @desc Initiating a fund transfer between accounts.
 * @route POST /api/v1/transactions/transfer
 * @access Private (through JWT Authentication)
 */
exports.transferFunds = async (req, res, next) => {
    try {
        const { senderAccountNumber, receiverAccountNumber, amount, description, transactionPin } = req.body;
        const userId = req.user.id; // Assuming user ID is available in the request object after authentication
        
        // Fetch user with transaction PIN field
        const user = await User.findById(userId).select('+transactionPin');
        
        if (!user) {
            Logger.warn(`Transfer attempt for non-existent user: ${userId}`);
            return errorResponse(res, null, 401, 'User not found. Please log in again.');
        }
        
        // Check if PIN is locked due to failed attempts
        if (user.transactionPinLockedUntil && user.transactionPinLockedUntil > Date.now()) {
            const remainingTime = Math.ceil((user.transactionPinLockedUntil - Date.now()) / 1000 / 60);
            Logger.warn(`Transfer attempt blocked - PIN locked for user: ${userId}, ${remainingTime} minutes remaining`);
            return errorResponse(res, null, 429, `Transaction PIN is temporarily locked. Please try again in ${remainingTime} minutes.`);
        }
        
        // Reset attempts if lockout period has expired
        if (user.transactionPinLockedUntil && user.transactionPinLockedUntil <= Date.now()) {
            user.transactionPinAttempts = 0;
            user.transactionPinLockedUntil = undefined;
        }
        
        // Validate transaction PIN
        const isPinValid = await user.correctPin(transactionPin, user.transactionPin);
        
        if (!isPinValid) {
            // Track failed PIN attempts
            user.transactionPinAttempts = (user.transactionPinAttempts || 0) + 1;
            
            // Lock account after 3 failed attempts
            if (user.transactionPinAttempts >= 3) {
                user.transactionPinLockedUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lockout
                await user.save({ validateBeforeSave: false });
                Logger.warn(`Transaction PIN locked for user: ${userId} after 3 failed attempts`);
                return errorResponse(res, null, 429, 'Too many failed PIN attempts. Transaction temporarily locked for 15 minutes.');
            }
            
            await user.save({ validateBeforeSave: false });
            Logger.warn(`Invalid transaction PIN attempt for user: ${userId} (Attempt ${user.transactionPinAttempts}/3)`);
            return errorResponse(res, null, 401, `Invalid transaction PIN (Attempt ${user.transactionPinAttempts}/3)`);
        }
        
        // Extract metadata for auditing purposes
        const auditContext = extractRequestMetaData(req);
        auditContext.resource = 'transaction';
        auditContext.userId = userId;
        
        // Initiate the transfer
        const transactionResult = await TransactionService.initiateTransfer(
            userId,
            senderAccountNumber,
            receiverAccountNumber,
            amount,
            description,
            auditContext
        );
        
        // Reset PIN attempts on successful transfer
        user.transactionPinAttempts = 0;
        user.transactionPinLockedUntil = undefined;
        await user.save({ validateBeforeSave: false });
        
        Logger.info(`Transfer completed successfully for user: ${userId}`);
        
        return successResponse(
            res,
            {
                transactionId: transactionResult._id,
                reference: transactionResult.transactionReference,
                amount: transactionResult.amount,
                timestamp: transactionResult.createdAt
            },
            'Transfer completed successfully',
            200
        );
    }
    catch (error) {
        Logger.error(`Transfer error: ${error.message}`);
        
        // Handle specific business errors
        if (error.message.includes('Insufficient funds') ||
            error.message.includes('KYC not verified') ||
            error.message.includes('account not found') ||
            error.message.includes('Sender and receiver account numbers cannot be the same') ||
            error.message.includes('Transfer amount must be greater than zero') ||
            error.message.includes('Invalid transaction PIN') ||
            error.message.includes('Receiver account does not exist or is inactive') ||
            error.message.includes('Restricted')) {
            return errorResponse(res, null, 400, error.message);
        }
        
        // Pass unexpected errors to global error handler
        next(error);
    }
}; 