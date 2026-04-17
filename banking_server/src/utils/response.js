/**
 * @desc Standardize success response
 */
exports.successResponse = (res, data=null, message, statusCode) => {
    const response = {
        success: true,
        message,
    };
    if(data){
        response.data = data;
    }
    return res.status(statusCode).json(response);
};

/**
 * @desc Standardize error response
 */
exports.errorResponse = (res, error=null, statusCode, message) => {
    const response = {
        success: false,
        message,
    };
    if(error){
        response.error = error instanceof Error ? error.message : error;
    }
    return res.status(statusCode).json(response);
};