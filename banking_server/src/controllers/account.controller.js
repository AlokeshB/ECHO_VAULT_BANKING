/**
 * @description: Account Controller - The Bank Teller
 * Handles account state and details: balances, statements, account opening, status management
 * Does NOT handle money movement (that's handled by transaction controller)
 */

const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/response');
const { encrypt, decrypt } = require('../utils/encryption');
const notificationService = require('../service/notification.service');
const crypto = require('crypto');

/**
 * @desc Fetch current account balance, account number, and routing number
 * @route GET /api/v1/accounts/:accountId/balance
 * @access Private (Authenticated User)
 */
exports.getAccountBalance = async (req, res, next) => {
    try {
        const { accountId } = req.params;
        const userId = req.user._id;

        // Verify account ownership
        const account = await Account.findOne({
            _id: accountId,
            user: userId
        });

        if (!account) {
            Logger.warn(`Unauthorized balance fetch attempt - Account ${accountId} by User ${userId}`);
            return errorResponse(res, null, 404, 'Account not found or access denied');
        }

        // Generate routing number (bank identifier - typically fixed per institution)
        // Format: 9-digit routing number (BANKCODE + BRANCHCODE)
        const routingNumber = '123456789'; // In production, derive from bank configuration

        Logger.info(`Account balance fetched for Account ${accountId} by User ${userId}`);

        return successResponse(
            res,
            {
                accountId: account._id,
                accountNumber: account.accountNumber,
                accountType: account.accountType,
                balance: account.balance,
                currency: account.currency,
                routingNumber: routingNumber,
                status: account.status,
                lastUpdated: account.updatedAt
            },
            'Balance fetched successfully',
            200
        );
    } catch (error) {
        Logger.error(`Error fetching account balance: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Fetch full account details (balance, number, type, status, creation date)
 * @route GET /api/v1/accounts/:accountId/details
 * @access Private (Authenticated User)
 */
exports.getAccountDetails = async (req, res, next) => {
    try {
        const { accountId } = req.params;
        const userId = req.user._id;

        const account = await Account.findOne({
            _id: accountId,
            user: userId
        });

        if (!account) {
            Logger.warn(`Unauthorized account details fetch - Account ${accountId} by User ${userId}`);
            return errorResponse(res, null, 404, 'Account not found or access denied');
        }

        const user = await User.findById(userId).select('firstName lastName email');

        Logger.info(`Account details fetched for Account ${accountId} by User ${userId}`);

        return successResponse(
            res,
            {
                accountId: account._id,
                accountNumber: account.accountNumber,
                accountType: account.accountType,
                accountHolder: {
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email
                },
                balance: account.balance,
                currency: account.currency,
                status: account.status,
                createdAt: account.createdAt,
                updatedAt: account.updatedAt,
                isActive: account.status === 'active',
                isFrozen: account.status === 'frozen',
                isClosed: account.status === 'closed'
            },
            'Account details fetched successfully',
            200
        );
    } catch (error) {
        Logger.error(`Error fetching account details: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Get all accounts for authenticated user (multi-account support)
 * @route GET /api/v1/accounts/
 * @access Private (Authenticated User)
 */
exports.getUserAccounts = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { status } = req.query; // Optional filter by status

        let query = { user: userId };
        if (status) {
            query.status = status; // Filter by account status if provided
        }

        const accounts = await Account.find(query).sort({ createdAt: -1 });

        if (accounts.length === 0) {
            Logger.info(`No accounts found for User ${userId}`);
            return successResponse(res, [], 'No accounts found', 200);
        }

        const formattedAccounts = accounts.map(acc => ({
            accountId: acc._id,
            accountNumber: acc.accountNumber,
            accountType: acc.accountType,
            balance: acc.balance,
            currency: acc.currency,
            status: acc.status,
            createdAt: acc.createdAt
        }));

        Logger.info(`Retrieved ${accounts.length} accounts for User ${userId}`);

        return successResponse(
            res,
            formattedAccounts,
            `Retrieved ${accounts.length} account(s) successfully`,
            200
        );
    } catch (error) {
        Logger.error(`Error fetching user accounts: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Get transaction history/Account Statement for a specific account
 * @route GET /api/v1/accounts/:accountId/transactions
 * @access Private (Authenticated User)
 * @query startDate, endDate, type, status, limit, page
 */
exports.getTransactionHistory = async (req, res, next) => {
    try {
        const { accountId } = req.params;
        const userId = req.user._id;
        
        // Pagination and filters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { startDate, endDate, type, status } = req.query;

        // Verify account ownership
        const account = await Account.findOne({
            _id: accountId,
            user: userId
        });

        if (!account) {
            Logger.warn(`Unauthorized transaction history access - Account ${accountId} by User ${userId}`);
            return errorResponse(res, null, 404, 'Account not found or access denied');
        }

        // Build query for transactions
        let query = {
            $or: [
                { senderAccount: accountId },
                { recieverAccount: accountId }
            ]
        };

        // Apply date range filter if provided
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Apply transaction type filter
        if (type) {
            query.type = type;
        }

        // Apply status filter
        if (status) {
            query.status = status;
        }

        // Fetch total count for pagination metadata
        const total = await Transaction.countDocuments(query);

        // Fetch transactions with pagination
        const transactions = await Transaction.find(query)
            .populate('senderAccount', 'accountNumber accountType -user')
            .populate('recieverAccount', 'accountNumber accountType -user')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Format transaction data, marking which side the account is on
        const formattedTransactions = transactions.map(txn => ({
            transactionId: txn._id,
            reference: txn.transactionReference,
            type: txn.type,
            status: txn.status,
            amount: txn.amount,
            currency: 'INR',
            accountDirection: txn.senderAccount._id.toString() === accountId.toString() ? 'debit' : 'credit',
            senderAccount: {
                accountNumber: txn.senderAccount.accountNumber,
                accountType: txn.senderAccount.accountType
            },
            receiverAccount: {
                accountNumber: txn.recieverAccount.accountNumber,
                accountType: txn.recieverAccount.accountType
            },
            description: txn.description || 'No description',
            createdAt: txn.createdAt,
            completedAt: txn.updatedAt
        }));

        Logger.info(`Transaction history fetched for Account ${accountId} - ${formattedTransactions.length} transactions`);

        return successResponse(
            res,
            {
                transactions: formattedTransactions,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalTransactions: total,
                    perPage: limit
                },
                accountNumber: account.accountNumber,
                accountType: account.accountType
            },
            'Transaction history retrieved successfully',
            200
        );
    } catch (error) {
        Logger.error(`Error fetching transaction history: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Generate Account Statement (PDF-ready data with encrypted sensitive info)
 * @route GET /api/v1/accounts/:accountId/statement
 * @access Private (Authenticated User)
 * @query month (YYYY-MM format), year (YYYY format) - if not provided, current month
 */
exports.getAccountStatement = async (req, res, next) => {
    try {
        const { accountId } = req.params;
        const userId = req.user._id;
        const { month, year } = req.query;

        // Verify account ownership
        const account = await Account.findOne({
            _id: accountId,
            user: userId
        }).populate('user', 'firstName lastName email');

        if (!account) {
            Logger.warn(`Unauthorized statement access - Account ${accountId} by User ${userId}`);
            return errorResponse(res, null, 404, 'Account not found or access denied');
        }

        // Determine date range for statement
        let startDate, endDate;
        if (month && year) {
            const [statYear, statMonth] = month.split('-');
            startDate = new Date(statYear, statMonth - 1, 1);
            endDate = new Date(statYear, statMonth, 0, 23, 59, 59);
        } else if (year) {
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31, 23, 59, 59);
        } else {
            // Default to current month
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }

        // Fetch all transactions for the period
        const transactions = await Transaction.find({
            $or: [
                { senderAccount: accountId },
                { recieverAccount: accountId }
            ],
            createdAt: { $gte: startDate, $lte: endDate }
        })
            .populate('senderAccount', 'accountNumber accountType')
            .populate('recieverAccount', 'accountNumber accountType')
            .sort({ createdAt: 1 });

        // Calculate opening and closing balance
        const openingBalance = account.balance; // Simplified; ideally fetch from beginning of period
        let closingBalance = openingBalance;
        let totalDebits = 0;
        let totalCredits = 0;

        transactions.forEach(txn => {
            const isDebit = txn.senderAccount._id.toString() === accountId.toString();
            const amount = parseFloat(txn.amount);

            if (txn.status === 'completed') {
                if (isDebit) {
                    closingBalance -= amount;
                    totalDebits += amount;
                } else {
                    closingBalance += amount;
                    totalCredits += amount;
                }
            }
        });

        const user = account.user;
        const statementData = {
            statement: {
                period: {
                    startDate: startDate.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0]
                },
                accountHolder: {
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email // Encrypted in production
                },
                account: {
                    number: account.accountNumber,
                    type: account.accountType,
                    currency: account.currency,
                    status: account.status
                },
                balances: {
                    opening: openingBalance,
                    closing: closingBalance,
                    totalDebits,
                    totalCredits,
                    netChange: closingBalance - openingBalance
                },
                transactions: transactions.map(txn => ({
                    date: txn.createdAt.toISOString().split('T')[0],
                    reference: txn.transactionReference,
                    type: txn.type,
                    status: txn.status,
                    direction: txn.senderAccount._id.toString() === accountId.toString() ? 'debit' : 'credit',
                    amount: parseFloat(txn.amount),
                    description: txn.description || 'N/A',
                    counterparty: txn.senderAccount._id.toString() === accountId.toString() 
                        ? txn.recieverAccount.accountNumber
                        : txn.senderAccount.accountNumber
                })),
                generatedAt: new Date().toISOString(),
                generatedBy: userId
            }
        };

        // Encrypt sensitive data in statement if needed for secure transmission
        const statementReference = `STMT-${accountId}-${Date.now()}`;
        
        // Log statement generation for audit
        await AuditLog.create({
            user: userId,
            action: 'STATEMENT_GENERATED',
            resource: 'account_statement',
            resourceId: accountId,
            message: `Statement generated for account ${account.accountNumber} for period ${startDate.toDateString()} to ${endDate.toDateString()}`,
            details: {
                period: { startDate, endDate },
                transactionCount: transactions.length,
                statementReference
            },
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent') || 'Unknown',
            deviceId: req.headers['x-device-id'] || null
        });

        Logger.info(`Account statement generated - Account: ${accountId}, Reference: ${statementReference}`);

        return successResponse(
            res,
            statementData,
            'Account statement generated successfully',
            200
        );
    } catch (error) {
        Logger.error(`Error generating account statement: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Open a new account for verified user (Checking, Savings, Business)
 * @route POST /api/v1/accounts/open-account
 * @access Private (Authenticated, KYC Verified)
 * @body { accountType: 'savings'|'checking'|'business', initialBalance }
 */
exports.openNewAccount = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { accountType, initialBalance } = req.body;

        // Verify user is authenticated and exists
        const user = await User.findById(userId);
        if (!user) {
            Logger.warn(`User not found for account opening: ${userId}`);
            return errorResponse(res, null, 404, 'User not found');
        }

        // Verify KYC is completed
        if (user.kycStatus !== 'verified') {
            Logger.warn(`KYC not verified for account opening - User ${userId}, Status: ${user.kycStatus}`);
            return errorResponse(
                res,
                null,
                403,
                'KYC verification required before opening an account. Please complete your KYC first.'
            );
        }

        // Check if account type is valid
        const validAccountTypes = ['savings', 'checking', 'business'];
        if (!validAccountTypes.includes(accountType)) {
            Logger.warn(`Invalid account type requested: ${accountType}`);
            return errorResponse(res, null, 400, 'Invalid account type. Allowed: savings, checking, business');
        }

        // Generate unique account number
        // Format: BANKCODE(3) + BRANCHCODE(3) + SEQUENTIAL(10) = 16 digits
        const accountNumber = await generateUniqueAccountNumber();

        // Create the new account
        const newAccount = await Account.create({
            user: userId,
            accountNumber,
            accountType,
            balance: initialBalance || 0.00,
            currency: 'INR',
            status: 'active'
        });

        // Log the account opening activity
        await AuditLog.create({
            user: userId,
            action: 'ACCOUNT_OPENED',
            resource: 'account',
            resourceId: newAccount._id,
            message: `New ${accountType} account opened for user ${user.email}`,
            details: {
                accountNumber: newAccount.accountNumber,
                accountType: newAccount.accountType,
                initialBalance: initialBalance || 0
            },
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent') || 'Unknown',
            deviceId: req.headers['x-device-id'] || null
        });

        // Send notification to user
        await notificationService.sendNotification({
            userId: userId,
            action: 'ACCOUNT_OPENED',
            message: `Your new ${accountType} account has been created successfully`,
            resource: 'account',
            resourceId: newAccount._id,
            details: {
                accountNumber: newAccount.accountNumber,
                accountType: newAccount.accountType
            }
        });

        Logger.info(`New ${accountType} account opened - User: ${userId}, Account: ${newAccount._id}`);

        return successResponse(
            res,
            {
                accountId: newAccount._id,
                accountNumber: newAccount.accountNumber,
                accountType: newAccount.accountType,
                balance: newAccount.balance,
                currency: newAccount.currency,
                status: newAccount.status,
                createdAt: newAccount.createdAt
            },
            `${accountType.charAt(0).toUpperCase() + accountType.slice(1)} account opened successfully`,
            201
        );
    } catch (error) {
        Logger.error(`Error opening new account: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Freeze an account (temporarily disable transactions)
 * @route POST /api/v1/accounts/:accountId/freeze
 * @access Private (Authenticated User or Admin)
 * @body { reason: String }
 */
exports.freezeAccount = async (req, res, next) => {
    try {
        const { accountId } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;
        const { reason } = req.body;

        // Fetch the account
        const account = await Account.findById(accountId);
        if (!account) {
            Logger.warn(`Account not found for freeze operation: ${accountId}`);
            return errorResponse(res, null, 404, 'Account not found');
        }

        // Check authorization - user can freeze their own account, admin can freeze any
        if (userRole !== 'admin' && account.user.toString() !== userId.toString()) {
            Logger.warn(`Unauthorized freeze attempt - Account ${accountId} by User ${userId}`);
            return errorResponse(res, null, 403, 'You do not have permission to freeze this account');
        }

        // Check if already frozen
        if (account.status === 'frozen') {
            Logger.info(`Account already frozen: ${accountId}`);
            return errorResponse(res, null, 400, 'Account is already frozen');
        }

        // Freeze the account
        account.status = 'frozen';
        await account.save();

        // Log the freeze action
        await AuditLog.create({
            user: userId,
            action: 'ACCOUNT_FROZEN',
            resource: 'account',
            resourceId: accountId,
            message: `Account ${account.accountNumber} frozen. Reason: ${reason || 'Not specified'}`,
            details: {
                accountNumber: account.accountNumber,
                freezeReason: reason,
                frozenBy: userRole,
                timestamp: new Date()
            },
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent') || 'Unknown',
            deviceId: req.headers['x-device-id'] || null
        });

        // Send notification
        await notificationService.sendNotification({
            userId: account.user,
            action: 'ACCOUNT_FROZEN',
            message: `Your account ${account.accountNumber} has been frozen. Reason: ${reason || 'For security purposes'}`,
            resource: 'account',
            resourceId: accountId
        });

        Logger.info(`Account frozen - Account: ${accountId}, Reason: ${reason}`);

        return successResponse(
            res,
            {
                accountId: account._id,
                accountNumber: account.accountNumber,
                status: account.status,
                frozenAt: new Date(),
                reason: reason || 'Not specified'
            },
            'Account frozen successfully',
            200
        );
    } catch (error) {
        Logger.error(`Error freezing account: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Unfreeze a frozen account (restore transaction capability)
 * @route POST /api/v1/accounts/:accountId/unfreeze
 * @access Private (Admin only) / (User with verification)
 * @body { verificationCode: String (optional), reason: String }
 */
exports.unfreezeAccount = async (req, res, next) => {
    try {
        const { accountId } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;
        const { reason } = req.body;

        // Fetch the account
        const account = await Account.findById(accountId);
        if (!account) {
            Logger.warn(`Account not found for unfreeze operation: ${accountId}`);
            return errorResponse(res, null, 404, 'Account not found');
        }

        // Authorization - admin can unfreeze any account, user must be owner
        if (userRole !== 'admin' && account.user.toString() !== userId.toString()) {
            Logger.warn(`Unauthorized unfreeze attempt - Account ${accountId} by User ${userId}`);
            return errorResponse(res, null, 403, 'You do not have permission to unfreeze this account');
        }

        // Check if not frozen
        if (account.status !== 'frozen') {
            Logger.info(`Account is not frozen: ${accountId}`);
            return errorResponse(res, null, 400, 'Account is not frozen');
        }

        // Unfreeze the account
        account.status = 'active';
        await account.save();

        // Log the unfreeze action
        await AuditLog.create({
            user: userId,
            action: 'ACCOUNT_UNFROZEN',
            resource: 'account',
            resourceId: accountId,
            message: `Account ${account.accountNumber} unfrozen. Reason: ${reason || 'Not specified'}`,
            details: {
                accountNumber: account.accountNumber,
                unfreezeReason: reason,
                unfrozenBy: userRole,
                timestamp: new Date()
            },
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent') || 'Unknown',
            deviceId: req.headers['x-device-id'] || null
        });

        // Send notification
        await notificationService.sendNotification({
            userId: account.user,
            action: 'ACCOUNT_UNFROZEN',
            message: `Your account ${account.accountNumber} has been restored. You can now perform transactions.`,
            resource: 'account',
            resourceId: accountId
        });

        Logger.info(`Account unfrozen - Account: ${accountId}, Reason: ${reason}`);

        return successResponse(
            res,
            {
                accountId: account._id,
                accountNumber: account.accountNumber,
                status: account.status,
                unfrozenAt: new Date(),
                reason: reason || 'Not specified'
            },
            'Account unfrozen successfully',
            200
        );
    } catch (error) {
        Logger.error(`Error unfreezing account: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Close an account (permanent - requires verification)
 * @route POST /api/v1/accounts/:accountId/close
 * @access Private (Authenticated User - Account Owner)
 * @body { reason: String, password: String (verification) }
 */
exports.closeAccount = async (req, res, next) => {
    try {
        const { accountId } = req.params;
        const userId = req.user._id;
        const { reason, password } = req.body;

        // Fetch account and user
        const account = await Account.findById(accountId);
        const user = await User.findById(userId).select('+password');

        if (!account) {
            Logger.warn(`Account not found for close operation: ${accountId}`);
            return errorResponse(res, null, 404, 'Account not found');
        }

        // Verify ownership
        if (account.user.toString() !== userId.toString()) {
            Logger.warn(`Unauthorized close attempt - Account ${accountId} by User ${userId}`);
            return errorResponse(res, null, 403, 'You can only close your own account');
        }

        // Verify account has zero balance
        if (account.balance !== 0) {
            Logger.warn(`Close attempt with non-zero balance - Account ${accountId}, Balance: ${account.balance}`);
            return errorResponse(
                res,
                null,
                400,
                'Account must have zero balance before closing. Please withdraw remaining funds.'
            );
        }

        // Verify password for security
        const isPasswordValid = await user.correctPassword(password, user.password);
        if (!isPasswordValid) {
            Logger.warn(`Failed password verification for account close - User ${userId}`);
            return errorResponse(res, null, 401, 'Invalid password. Cannot close account without verification.');
        }

        // Close the account
        account.status = 'closed';
        await account.save();

        // Log account closure
        await AuditLog.create({
            user: userId,
            action: 'ACCOUNT_CLOSED',
            resource: 'account',
            resourceId: accountId,
            message: `Account ${account.accountNumber} closed by user`,
            details: {
                accountNumber: account.accountNumber,
                closeReason: reason,
                closedAt: new Date()
            },
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent') || 'Unknown',
            deviceId: req.headers['x-device-id'] || null
        });

        // Send notification
        await notificationService.sendNotification({
            userId: userId,
            action: 'ACCOUNT_CLOSED',
            message: `Your account ${account.accountNumber} has been closed successfully.`,
            resource: 'account',
            resourceId: accountId
        });

        Logger.info(`Account closed - Account: ${accountId}, Reason: ${reason}`);

        return successResponse(
            res,
            {
                accountId: account._id,
                accountNumber: account.accountNumber,
                status: account.status,
                closedAt: new Date()
            },
            'Account closed successfully',
            200
        );
    } catch (error) {
        Logger.error(`Error closing account: ${error.message}`);
        next(error);
    }
};

/**
 * @desc Helper function to generate unique account number
 * Format: BANKCODE(3) + BRANCHCODE(3) + SEQUENTIAL(10) = 16 digits
 */
async function generateUniqueAccountNumber() {
    let accountNumber;
    let isUnique = false;

    while (!isUnique) {
        const bankCode = '123'; // Fixed bank code
        const branchCode = '456'; // Fixed branch code
        const sequential = Math.floor(1000000000 + Math.random() * 9000000000); // 10-digit number
        accountNumber = `${bankCode}${branchCode}${sequential}`;

        const existingAccount = await Account.findOne({ accountNumber });
        isUnique = !existingAccount;
    }

    return accountNumber;
}
