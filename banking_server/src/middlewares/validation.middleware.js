const Logger = require('../utils/logger');
const { errorResponse } = require('../utils/response');

/**
 * @desc Validation middleware for request body
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        if (!schema) {
            Logger.error('No validation schema provided');
            return errorResponse(res, null, 500, 'Internal server error');
        }

        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errorDetails = error.details.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));

            Logger.warn(`Validation error:`, errorDetails);

            return errorResponse(res, errorDetails, 400, 'Validation failed');
        }

        req.body = value;
        next();
    };
};

/**
 * @desc Validation middleware for query parameters
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        if (!schema) {
            Logger.error('No validation schema provided');
            return errorResponse(res, null, 500, 'Internal server error');
        }

        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errorDetails = error.details.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));

            Logger.warn(`Query validation error:`, errorDetails);

            return errorResponse(res, errorDetails, 400, 'Validation failed');
        }

        req.query = value;
        next();
    };
};

/**
 * @desc Validation middleware for route parameters
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateParams = (schema) => {
    return (req, res, next) => {
        if (!schema) {
            Logger.error('No validation schema provided');
            return errorResponse(res, null, 500, 'Internal server error');
        }

        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errorDetails = error.details.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));

            Logger.warn(`Params validation error:`, errorDetails);

            return errorResponse(res, errorDetails, 400, 'Validation failed');
        }

        req.params = value;
        next();
    };
};

module.exports = {
    validateRequest,
    validateQuery,
    validateParams
};
