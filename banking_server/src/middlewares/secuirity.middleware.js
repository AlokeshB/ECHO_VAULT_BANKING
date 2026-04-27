const Logger = require('../utils/logger');

/**
 * @desc Validate request content type
 */
exports.validateContentType = (req, res, next) => {
    const contentType = req.headers['content-type'];
    const allowedTypes = ['application/json', 'application/x-www-form-urlencoded'];
    
    if (req.method !== 'GET' && req.method !== 'DELETE') {
        if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
            Logger.warn(`Invalid content type: ${contentType} from ${req.ip}`);
            return res.status(415).json({
                success: false,
                message: 'Invalid Content-Type. Expected application/json or application/x-www-form-urlencoded'
            });
        }
    }
    
    next();
};

/**
 * @desc Prevent parameter pollution
 */
exports.preventParameterPollution = (req, res, next) => {
    try {
        // Check for duplicate query parameters
        const keys = Object.keys(req.query);
        const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
        
        if (duplicates.length > 0) {
            Logger.warn(`Parameter pollution detected: ${duplicates.join(', ')} from ${req.ip}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid request: duplicate parameters detected'
            });
        }

        // Sanitize body for suspicious patterns
        if (req.body && typeof req.body === 'object') {
            Object.keys(req.body).forEach(key => {
                if (typeof req.body[key] === 'string') {
                    // Remove potentially malicious patterns
                    req.body[key] = req.body[key]
                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                        .replace(/javascript:/gi, '')
                        .replace(/on\w+\s*=/gi, '');
                }
            });
        }

        next();
    }
    catch (err) {
        Logger.error(`Error in parameter pollution prevention: ${err.message}`);
        next(err);
    }
};

/**
 * @desc Check for suspicious request patterns
 */
exports.detectSuspiciousActivity = (req, res, next) => {
    const { method, url, headers, body } = req;
    
    try {
        // Check for SQL injection patterns
        const sqlPatterns = /('.*?'|".*?"|\/\*.*?\*\/|--|;|\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b)/gi;
        const urlString = url.toLowerCase();
        
        if (sqlPatterns.test(urlString)) {
            Logger.warn(`Potential SQL injection attempt from ${req.ip}: ${url}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid request detected'
            });
        }

        // Check for suspicious user agents
        const userAgent = (headers['user-agent'] || '').toLowerCase();
        const maliciousAgents = ['sqlmap', 'nmap', 'nikto', 'nessus', 'metasploit', 'burpsuite'];
        
        if (maliciousAgents.some(agent => userAgent.includes(agent))) {
            Logger.error(`Suspicious user agent detected from ${req.ip}: ${userAgent}`);
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check for path traversal attempts
        if (url.includes('../') || url.includes('..\\')) {
            Logger.warn(`Path traversal attempt from ${req.ip}: ${url}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid request path'
            });
        }

        next();
    }
    catch (err) {
        Logger.error(`Error in suspicious activity detection: ${err.message}`);
        next(err);
    }
};

/**
 * @desc Rate limit per user based on action
 */
exports.userActionRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    const store = new Map();

    return (req, res, next) => {
        try {
            const key = `${req.user?._id || req.ip}:${req.path}`;
            const now = Date.now();

            if (!store.has(key)) {
                store.set(key, { attempts: 1, resetTime: now + windowMs });
                return next();
            }

            const record = store.get(key);

            if (now > record.resetTime) {
                store.set(key, { attempts: 1, resetTime: now + windowMs });
                return next();
            }

            record.attempts++;

            if (record.attempts > maxAttempts) {
                Logger.warn(`Rate limit exceeded for user ${req.user?.email || req.ip} on ${req.path}`);
                return res.status(429).json({
                    success: false,
                    message: `Too many attempts. Please try again after ${Math.ceil((record.resetTime - now) / 1000)} seconds`
                });
            }

            next();
        }
        catch (err) {
            Logger.error(`Error in user action rate limiting: ${err.message}`);
            next(err);
        }
    };
};

/**
 * @desc Validate request size
 */
exports.validateRequestSize = (maxSize = 10 * 1024) => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'], 10);

        if (contentLength && contentLength > maxSize) {
            Logger.warn(`Request size exceeded from ${req.ip}: ${contentLength} bytes`);
            return res.status(413).json({
                success: false,
                message: `Payload too large. Maximum size is ${maxSize} bytes`
            });
        }

        next();
    };
};

/**
 * @desc Sanitize request data and prevent NoSQL injection
 */
exports.sanitizeRequestData = (req, res, next) => {
    try {
        const sanitizeValue = (value) => {
            if (typeof value === 'string') {
                return value
                    .trim()
                    .replace(/\0/g, '')
                    .substring(0, 1000); // Limit string length
            }
            return value;
        };

        const preventNoSQLInjection = (obj) => {
            if (obj === null || obj === undefined) return obj;
            
            // Check for NoSQL injection patterns
            const noSQLPatterns = [
                /^\s*\$\w+/,                           // MongoDB operators like $ne, $gt, etc.
                /^\s*\{[\s\S]*\}/,                     // Object payloads
                /,\s*\$where\s*:/i,                    // $where operator
                /\)\s*\{\s*return/i,                   // JavaScript execution patterns
            ];

            if (typeof obj === 'string') {
                // Check for suspicious patterns
                for (const pattern of noSQLPatterns) {
                    if (pattern.test(obj)) {
                        Logger.warn(`Potential NoSQL injection detected in value: ${obj.substring(0, 50)}`);
                        return null; // Neutralize the injection
                    }
                }
                return sanitizeValue(obj);
            }

            if (typeof obj === 'object' && obj !== null) {
                const sanitized = Array.isArray(obj) ? [] : {};
                
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        // Check if key itself is suspicious
                        if (key.startsWith('$')) {
                            Logger.warn(`Suspicious key detected: ${key} from ${this.ip || 'unknown'}`);
                            continue; // Skip MongoDB operator keys
                        }

                        sanitized[key] = preventNoSQLInjection(obj[key]);
                    }
                }
                return sanitized;
            }

            return obj;
        };

        // Process request body
        if (req.body && typeof req.body === 'object') {
            req.body = preventNoSQLInjection(req.body);
        }

        // Process query parameters
        if (req.query && typeof req.query === 'object') {
            const sanitizedQuery = {};
            Object.keys(req.query).forEach(key => {
                if (!key.startsWith('$')) {
                    sanitizedQuery[key] = preventNoSQLInjection(req.query[key]);
                } else {
                    Logger.warn(`Suspicious query parameter detected: ${key} from ${req.ip}`);
                }
            });
            req.query = sanitizedQuery;
        }

        // Process URL parameters
        if (req.params && typeof req.params === 'object') {
            req.params = preventNoSQLInjection(req.params);
        }

        next();
    }
    catch (err) {
        Logger.error(`Error sanitizing request data: ${err.message}`);
        next(err);
    }
};

/**
 * @desc Verify request origin for sensitive operations
 */
exports.verifyRequestOrigin = (req, res, next) => {
    try {
        const origin = req.headers.origin || req.headers.referer;
        const allowedOrigins = [
            process.env.CORS_ORIGIN || 'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8000'
        ];

        // Allow if no origin (e.g., REST client requests)
        if (!origin) {
            return next();
        }

        const isAllowed = allowedOrigins.some(allowed => origin.includes(allowed));

        if (!isAllowed && process.env.NODE_ENV === 'production') {
            Logger.warn(`Request from unauthorized origin: ${origin} to ${req.originalUrl}`);
            return res.status(403).json({
                success: false,
                message: 'Request origin not allowed'
            });
        }

        next();
    }
    catch (err) {
        Logger.error(`Error verifying request origin: ${err.message}`);
        next(err);
    }
};
