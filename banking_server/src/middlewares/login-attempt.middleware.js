const User = require('../models/User');
const Logger = require('../utils/logger');
const { errorResponse } = require('../utils/response');

/**
 * @desc Check if user account is locked due to failed login attempts
 * Uses layered approach:
 * Stage 1 (5 attempts): Warning only
 * Stage 2 (8 attempts): OTP challenge required
 * Stage 3 (12+ attempts): Temporary account lock
 */
exports.checkLoginAttempts = async (req, res, next) => {
    try {
        const { email, userId } = req.body;
        
        if (!email && !userId) {
            return next();
        }
        
        // Find user by email or userId
        const user = await User.findOne({
            $or: [
                email ? { email: email.toLowerCase() } : null,
                userId ? { customUserID: userId } : null
            ].filter(Boolean)
        }).select('+loginAttempts +lockUntil +lastFailedLoginAt +loginAttemptWindow');

        if (!user) {
            // Don't reveal if user exists
            return next();
        }

        // Check login status using layered approach
        const loginStatus = user.checkLoginStatus();

        // Stage 3: Hard lock - account is temporarily locked
        if (loginStatus.isLocked) {
            Logger.warn(
                `[LOGIN BLOCKED] Account locked for user: ${email || userId}. ` +
                `Attempts: ${loginStatus.attemptCount}. Lock expires in ${loginStatus.remainingMinutes} minutes`
            );
            
            return errorResponse(
                res,
                null,
                429,
                `Account is temporarily locked due to too many failed login attempts. ` +
                `Please try again in ${loginStatus.remainingMinutes} minute(s) or reset your password.`
            );
        }

        // Stage 2: OTP challenge required
        if (loginStatus.requiresOTP) {
            Logger.warn(
                `[LOGIN OTP CHALLENGE] Multiple failed attempts for user: ${email || userId}. ` +
                `Attempts: ${loginStatus.attemptCount}. OTP verification required.`
            );
            
            // Generate OTP for additional verification
            const crypto = require('crypto');
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            user.otp = crypto.createHash('sha256').update(otp).digest('hex');
            user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
            await user.save({ validateBeforeSave: false });
            
            return errorResponse(
                res,
                { 
                    requiresOTP: true,
                    email: user.email,
                    otp: otp // Send via secure channel in production (SMS/Email)
                },
                403,
                `Security Challenge: Additional verification required. ` +
                `An OTP has been sent for verification. Enter it to proceed.`
            );
        }

        // Store user in request for next middleware
        req.loginUser = user;
        next();
    } catch (err) {
        Logger.error(`Error checking login attempts: ${err.message}`);
        next(err);
    }
};

/**
 * @desc Authenticate and record failed login attempts
 * Wrapper around passport.authenticate that records failures
 */
exports.authenticateWithAttempts = (strategy, loginField) => {
    return (req, res, next) => {
        passport.authenticate(strategy, { session: false }, async (err, user, info) => {
            try {
                if (err) {
                    return next(err);
                }
                
                if (!user) {
                    // Record failed login attempt
                    const emailOrUserId = req.body[loginField || 'email'];
                    const findUser = await User.findOne({
                        $or: [
                            loginField === 'userId' 
                                ? { customUserID: emailOrUserId }
                                : { email: emailOrUserId?.toLowerCase() }
                        ]
                    });
                    
                    if (findUser) {
                        await findUser.recordFailedLogin();
                        Logger.warn(`[LOGIN FAILED] Failed attempt for: ${emailOrUserId}`);
                    }
                    
                    return res.status(401).json({
                        success: false,
                        message: info?.message || 'Invalid credentials'
                    });
                }
                
                // Authentication successful
                req.user = user;
                next();
            } catch (error) {
                Logger.error(`Error in authenticate with attempts: ${error.message}`);
                next(error);
            }
        })(req, res, next);
    };
};

