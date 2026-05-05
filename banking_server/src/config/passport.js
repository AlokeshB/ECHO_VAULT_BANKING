const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const Logger = require('../utils/logger');

/**
 * @desc LocalStrategy for email/password authentication
 */
passport.use('email-local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, email, password, done) => {
    try {
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            Logger.warn(`Login attempt with non-existent email: ${email}`);
            return done(null, false, { message: 'Invalid email or password' });
        }
        
        if (!user.isEmailVerified) {
            Logger.warn(`Login attempt with unverified email: ${email}`);
            return done(null, false, { message: 'Please verify your email before logging in' });
        }
        
        if (user.accountApprovalStatus !== 'approved') {
            Logger.warn(`Login attempt with unapproved account: ${email}`);
            return done(null, false, { message: 'Your account is not approved yet. Please wait for admin approval' });
        }
        
        const isPasswordValid = await user.correctPassword(password, user.password);
        
        if (!isPasswordValid) {
            Logger.warn(`Failed login attempt for email: ${email}`);
            return done(null, false, { message: 'Invalid email or password' });
        }
        
        Logger.info(`Successful login via email: ${email}`);
        return done(null, user);
    }
    catch (err) {
        Logger.error(`Error in email-local strategy: ${err.message}`);
        return done(err);
    }
}));

/**
 * @desc LocalStrategy for UserID/password authentication
 */
passport.use('userid-local', new LocalStrategy({
    usernameField: 'userId',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, userId, password, done) => {
    try {
        const user = await User.findOne({ customUserID: userId }).select('+password');
        
        if (!user) {
            Logger.warn(`Login attempt with non-existent UserID: ${userId}`);
            return done(null, false, { message: 'Invalid UserID or password' });
        }
        
        if (!user.isEmailVerified) {
            Logger.warn(`Login attempt with unverified email (UserID: ${userId})`);
            return done(null, false, { message: 'Please verify your email before logging in' });
        }
        
        if (user.kycStatus !== 'verified') {
            Logger.warn(`Login attempt without KYC verification (UserID: ${userId})`);
            return done(null, false, { message: 'Your KYC must be verified before you can log in' });
        }
        
        const isPasswordValid = await user.correctPassword(password);
        
        if (!isPasswordValid) {
            Logger.warn(`Failed login attempt for UserID: ${userId}`);
            return done(null, false, { message: 'Invalid UserID or password' });
        }
        
        Logger.info(`Successful login via UserID: ${userId}`);
        return done(null, user);
    }
    catch (err) {
        Logger.error(`Error in userid-local strategy: ${err.message}`);
        return done(err);
    }
}));

/**
 * @desc Serialize user for sessions
 */
passport.serializeUser((user, done) => {
    done(null, user._id);
});

/**
 * @desc Deserialize user from sessions
 */
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    }
    catch (err) {
        done(err);
    }
});

module.exports = passport;
