const Joi = require('joi');
const Logger = require('../utils/logger');

/**
 * @desc Validation schemas for auth routes
 */
const schemas = {
    registerCustomer: Joi.object().keys({
        firstName: Joi.string().required().min(2).max(50).messages({
            'string.empty': 'First name is required',
            'string.min': 'First name must be at least 2 characters',
            'string.max': 'First name cannot exceed 50 characters'
        }),
        lastName: Joi.string().required().min(2).max(50).messages({
            'string.empty': 'Last name is required',
            'string.min': 'Last name must be at least 2 characters',
            'string.max': 'Last name cannot exceed 50 characters'
        }),
        email: Joi.string().required().email().messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address'
        }),
        password: Joi.string().required().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 8 characters',
            'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character'
        })
    }),

    verifyEmail: Joi.object().keys({
        email: Joi.string().required().email().messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address'
        }),
        otp: Joi.string().required().length(6).pattern(/^\d+$/).messages({
            'string.empty': 'OTP is required',
            'string.length': 'OTP must be exactly 6 digits',
            'string.pattern.base': 'OTP must contain only numbers'
        })
    }),

    createSupportUser: Joi.object().keys({
        firstName: Joi.string().required().min(2).max(50).messages({
            'string.empty': 'First name is required',
            'string.min': 'First name must be at least 2 characters'
        }),
        lastName: Joi.string().required().min(2).max(50).messages({
            'string.empty': 'Last name is required',
            'string.min': 'Last name must be at least 2 characters'
        }),
        email: Joi.string().required().email().messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address'
        }),
        password: Joi.string().required().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 8 characters',
            'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character'
        })
    }),

    approveAccount: Joi.object().keys({
        userId: Joi.string().required().messages({
            'string.empty': 'User ID is required'
        })
    }),

    submitKYC: Joi.object().keys({
        panNumber: Joi.string().required().length(10).pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).messages({
            'string.empty': 'PAN number is required',
            'string.length': 'PAN number must be exactly 10 characters',
            'string.pattern.base': 'Invalid PAN format. Expected format: AAAAA9999A'
        }),
        aadhaarNumber: Joi.string().required().length(12).pattern(/^\d{12}$/).messages({
            'string.empty': 'Aadhaar number is required',
            'string.length': 'Aadhaar number must be exactly 12 digits',
            'string.pattern.base': 'Aadhaar number must contain only digits'
        })
    }),

    reviewKYC: Joi.object().keys({
        action: Joi.string().required().valid('verify', 'verified', 'reject', 'rejected').messages({
            'string.empty': 'Action is required',
            'any.only': 'Action must be one of: verify, verified, reject, rejected'
        }),
        rejectionReason: Joi.string().when('action', {
            is: Joi.alternatives().try('reject', 'rejected'),
            then: Joi.required().min(10).max(500).messages({
                'string.empty': 'Rejection reason is required when rejecting KYC',
                'string.min': 'Rejection reason must be at least 10 characters'
            }),
            otherwise: Joi.optional()
        })
    })
};

/**
 * @desc Validation middleware factory
 * @param {string} schemaName - Name of the schema to validate against
 * @returns {Function} Express middleware function
 */
const validate = (schemaName) => {
    return (req, res, next) => {
        if (!schemas[schemaName]) {
            Logger.error(`Validation schema "${schemaName}" not found`);
            return res.status(500).json({
                success: false,
                message: 'Internal validation error'
            });
        }

        const schema = schemas[schemaName];
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errorDetails = error.details.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));

            Logger.warn(`Validation error for schema "${schemaName}":`, errorDetails);

            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errorDetails
            });
        }

        req.body = value;
        next();
    };
};

module.exports = {
    validate,
    schemas
};
