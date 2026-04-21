const Joi = require('joi');

/**
 * @desc Transfer funds validation schema
 */
exports.transferSchema = Joi.object({
    senderAccountNumber: Joi.string()
        .required()
        .min(10)
        .max(20)
        .alphanum()
        .messages({
            'string.base': 'Sender account number must be a string',
            'string.empty': 'Sender account number is required',
            'string.min': 'Sender account number must be at least 10 characters',
            'string.max': 'Sender account number cannot exceed 20 characters',
            'string.alphanum': 'Sender account number must contain only alphanumeric characters'
        }),
    
    receiverAccountNumber: Joi.string()
        .required()
        .min(10)
        .max(20)
        .alphanum()
        .invalid(Joi.ref('senderAccountNumber')) // Prevent transferring to the same account
        .messages({
            'string.base': 'Receiver account number must be a string',
            'string.empty': 'Receiver account number is required',
            'string.min': 'Receiver account number must be at least 10 characters',
            'string.max': 'Receiver account number cannot exceed 20 characters',
            'string.alphanum': 'Receiver account number must contain only alphanumeric characters',
            'any.invalid': 'Receiver account number cannot be the same as the sender account number'
        }),
    
    amount: Joi.number()
        .required()
        .positive()
        .precision(2)
        .min(0.01)
        .max(1000000)
        .messages({
            'number.base': 'Amount must be a number',
            'number.positive': 'Amount must be greater than zero',
            'number.min': 'Amount must be at least 0.01',
            'number.max': 'Amount cannot exceed 1,000,000'
        }),
    
    description: Joi.string()
        .optional()
        .max(255)
        .pattern(/^[a-zA-Z0-9\s.,'\-\&\/]*$/)
        .messages({
            'string.base': 'Description must be a string',
            'string.max': 'Description cannot exceed 255 characters',
            'string.pattern.base': 'Description contains invalid characters. Only alphanumeric, spaces, and basic punctuation are allowed'
        }),
    
    transactionPin: Joi.string()
        .required()
        .length(4)
        .pattern(/^\d+$/)
        .messages({
            'string.base': 'Transaction PIN must be a string',
            'string.empty': 'Transaction PIN is required',
            'string.length': 'Transaction PIN must be exactly 4 digits',
            'string.pattern.base': 'Transaction PIN must contain only digits'
        })
}).required();