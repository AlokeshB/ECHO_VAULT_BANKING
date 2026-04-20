const Joi = require('joi');
const Logger = require('./logger');
const { errorResponse } = require('./response');

/**
 * @desc Generic validation function for Joi schemas
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {Object} data - Data to validate
 * @returns {Object} - { error, value }
 */
exports.validateSchema = (schema, data) => {
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });

    if (error) {
        const errorDetails = error.details.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }));
        return { error: errorDetails, value: null };
    }

    return { error: null, value };
};

/**
 * @desc Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
exports.validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = exports.validateSchema(schema, req.body);

        if (error) {
            Logger.warn(`Validation error:`, error);
            return errorResponse(res, error, 400, 'Validation failed');
        }

        req.body = value;
        next();
    };
};

/**
 * @desc Validation middleware factory with custom field mapping
 * @param {Joi.Schema} schema - Joi validation schema  
 * @param {string} source - Where to get data from (body, query, params)
 * @returns {Function} Express middleware function
 */
exports.validateWithSource = (schema, source = 'body') => {
    return (req, res, next) => {
        const data = req[source];
        const { error, value } = exports.validateSchema(schema, data);

        if (error) {
            Logger.warn(`Validation error from ${source}:`, error);
            return errorResponse(res, error, 400, 'Validation failed');
        }

        req[source] = value;
        next();
    };
};

/**
 * @desc Manual validation with custom error response
 * @param {Object} data - Data to validate
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Promise} - resolves with { valid: boolean, errors: Array | null }
 */
exports.validateAsync = async (data, schema) => {
    try {
        const { error, value } = schema.validate(data, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errorDetails = error.details.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            return { valid: false, errors: errorDetails, value: null };
        }

        return { valid: true, errors: null, value };
    } catch (err) {
        Logger.error(`Async validation error: ${err.message}`);
        return { valid: false, errors: [{ message: 'Internal validation error' }], value: null };
    }
};

module.exports = {
    validateSchema: exports.validateSchema,
    validate: exports.validate,
    validateWithSource: exports.validateWithSource,
    validateAsync: exports.validateAsync
};
