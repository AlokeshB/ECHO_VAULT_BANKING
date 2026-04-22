const Joi = require('joi');
const Logger = require('../utils/logger');
const { errorResponse } = require('../utils/response');

/**
 * @desc Validation schemas for account routes
 */
const schemas = {
    // Open a new account
    openNewAccount: Joi.object().keys({
        accountType: Joi.string()
            .required()
            .valid('savings', 'checking', 'business')
            .messages({
                'string.empty': 'Account type is required',
                'any.only': 'Account type must be one of: savings, checking, business'
            }),
        initialBalance: Joi.number()
            .optional()
            .min(0)
            .precision(2)
            .messages({
                'number.base': 'Initial balance must be a valid number',
                'number.min': 'Initial balance cannot be negative'
            })
    }),

    // Freeze account
    freezeAccount: Joi.object().keys({
        reason: Joi.string()
            .optional()
            .max(500)
            .trim()
            .messages({
                'string.max': 'Freeze reason cannot exceed 500 characters'
            })
    }),

    // Unfreeze account
    unfreezeAccount: Joi.object().keys({
        reason: Joi.string()
            .optional()
            .max(500)
            .trim()
            .messages({
                'string.max': 'Unfreeze reason cannot exceed 500 characters'
            }),
        verificationCode: Joi.string()
            .optional()
            .messages({
                'string.empty': 'Verification code cannot be empty if provided'
            })
    }),

    // Close account
    closeAccount: Joi.object().keys({
        reason: Joi.string()
            .optional()
            .max(500)
            .trim()
            .messages({
                'string.max': 'Close reason cannot exceed 500 characters'
            }),
        password: Joi.string()
            .required()
            .messages({
                'string.empty': 'Password is required to close account'
            })
    }),

    // Statement generation query params
    getStatement: Joi.object().keys({
        month: Joi.string()
            .optional()
            .pattern(/^\d{4}-\d{2}$/)
            .messages({
                'string.pattern.base': 'Month must be in YYYY-MM format'
            }),
        year: Joi.string()
            .optional()
            .pattern(/^\d{4}$/)
            .messages({
                'string.pattern.base': 'Year must be in YYYY format'
            })
    }),

    // Transaction history query params
    getTransactionHistory: Joi.object().keys({
        page: Joi.number()
            .optional()
            .min(1)
            .messages({
                'number.base': 'Page must be a number',
                'number.min': 'Page must be at least 1'
            }),
        limit: Joi.number()
            .optional()
            .min(1)
            .max(100)
            .messages({
                'number.base': 'Limit must be a number',
                'number.min': 'Limit must be at least 1',
                'number.max': 'Limit cannot exceed 100'
            }),
        startDate: Joi.string()
            .optional()
            .isoDate()
            .messages({
                'string.isoDate': 'Start date must be a valid ISO date'
            }),
        endDate: Joi.string()
            .optional()
            .isoDate()
            .messages({
                'string.isoDate': 'End date must be a valid ISO date'
            }),
        type: Joi.string()
            .optional()
            .valid('transfer', 'deposit', 'withdrawal', 'reversal')
            .messages({
                'any.only': 'Transaction type must be one of: transfer, deposit, withdrawal, reversal'
            }),
        status: Joi.string()
            .optional()
            .valid('pending', 'completed', 'failed', 'reversed')
            .messages({
                'any.only': 'Transaction status must be one of: pending, completed, failed, reversed'
            })
    })
};

/**
 * @desc Middleware to validate request body
 */
exports.validate = (schemaName) => {
    return (req, res, next) => {
        const schema = schemas[schemaName];

        if (!schema) {
            Logger.error(`Validation schema not found: ${schemaName}`);
            return errorResponse(res, null, 500, 'Internal validation error');
        }

        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            const errorDetails = error.details.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));

            Logger.warn(`Validation error in ${schemaName}: ${JSON.stringify(errorDetails)}`);
            return errorResponse(res, errorDetails, 400, 'Validation failed');
        }

        req.body = value;
        next();
    };
};

/**
 * @desc Middleware to validate query parameters
 */
exports.validateQuery = (schemaName) => {
    return (req, res, next) => {
        const schema = schemas[schemaName];

        if (!schema) {
            Logger.error(`Validation schema not found: ${schemaName}`);
            return errorResponse(res, null, 500, 'Internal validation error');
        }

        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            const errorDetails = error.details.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));

            Logger.warn(`Query validation error in ${schemaName}: ${JSON.stringify(errorDetails)}`);
            return errorResponse(res, errorDetails, 400, 'Query validation failed');
        }

        req.query = value;
        next();
    };
};
