const nodemailer = require('nodemailer');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
/**
 * @desc Send Base email and log to DB
 */
exports.sendEmail = async ({ to, subject, text, html, userId, action, resource, resourceId, details, ipAddress, userAgent, location, deviceId }) => {
    try {
        const mailOptions = {
            from: `"No Reply Vault Banking" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text
        };
        const info = await transporter.sendMail(mailOptions);
        Logger.info(`Email sent to ${to} with subject "${subject}". Message ID: ${info.messageId}`);
        const user = await User.findOne({ email: to }).select('_id');
        if (user) {
            await AuditLog.create({
                user: userId,
                action: 'EMAIL_SENT',
                resource,
                resourceId,
                message: `Email sent with subject "${subject}"`,
                details,
                ipAddress,
                userAgent,
                location,
                deviceId
            });
            Logger.info(`Audit log created for email sent to ${to} with action ${action}`);
            return true;
        }
    }
    catch (err) {
        Logger.error(`Error sending email: ${err.message}`);
        return false;
    }
};
/**
 * @desc Wrapper for OTP sending and validation
 */
exports.sendOTPEmail = async (email, otp) => {
    const subject = 'Your OTP Code';
    const text = `Your OTP code is ${otp}. It is valid for 10 minutes.`;
    await this.sendEmail({ to: email, subject, text, resource: 'otp', action: 'OTP_EMAIL_SENT' });
};
/**
 * @desc Specific wrapper for KYC document submission email
 */
exports.sendKYCRequestEmail = async (email) => {
    const subject = 'KYC Document Submission Required';
    const text = 'Dear Customer,\n\nYour account has been approved. Please submit your KYC documents to complete the verification process.\n\nThank you,\nVault Banking Team';
    await this.sendEmail({ to: email, subject, text, resource: 'kyc-request', action: 'KYC_REQUEST_SENT' });
};

/**
 * @desc Specific wrapper for KYC outcome notification email
 */
exports.sendKYCOutcomeEmail = async (email, action) => {
    const subject = action === 'approved' ? 'KYC Approved' : 'KYC Rejected';
    const text = action === 'approved' ? 'Congratulations! Your KYC documents have been approved. You can now access all banking features.' : 'We regret to inform you that your KYC documents have been rejected. Please review the requirements and resubmit.';
    await this.sendEmail({ to: email, subject, text, resource: 'kyc-outcome', action: `KYC_${action.toUpperCase()}_EMAIL_SENT` });
};