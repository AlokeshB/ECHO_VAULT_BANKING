const AuditLog = require('../models/AuditLog');
const Logger = require('../utils/logger');

let io;

exports.initialize = (socketToInstance) => {
    io = socketToInstance;
};

/**
 * @desc Send real-time notification to user device via Socket.IO and log to DB
 */
const sendNotification = async ({ userId, action, message, resource, resourceId, details, ipAddress, userAgent, location, deviceId }) => {
    const notificationAction = action || 'SYSTEM_NOTIFICATION';
    const notificationResource = resource || 'general';
    
    try {
        if (io) {
            io.to(userId).emit('notification', {
                action: notificationAction,
                message,
                resource: notificationResource,
                resourceId,
                details,
                timestamp: new Date()
            });
            Logger.info(`Notification sent to user ${userId} for action ${notificationAction} on resource ${notificationResource}`);
        }
        
        await AuditLog.create({
            user: userId,
            action: notificationAction,
            resource: notificationResource,
            resourceId: resourceId || null,
            message: message,
            details: { ...details },
            ipAddress: ipAddress || '127.0.0.1',
            userAgent: userAgent || 'Unknown',
            location: location || null,
            deviceId: deviceId || null
        });
        Logger.info(`Audit log created for user ${userId} action ${notificationAction} on resource ${notificationResource}`);
    }
    catch (err) {
        Logger.error(`Error sending notification: ${err.message}`);
    }
};

/**
 * @desc Admin Actions to be notified to users/Support staff
 */
exports.notifyAdminAction = async ({ userId, action, message }) => {
    await sendNotification({ userId, action, message, resource: 'admin-action' });
};

/**
 * @desc User/Support Actions to be notified to Admin staff
 */
exports.notifyUserAction = async ({ userId, action, message }) => {
    try {
        const User = require('../models/User');
        const adminUsers = await User.find({ role: 'admin' }).select('_id');
        adminUsers.forEach(admin => {
            sendNotification({ userId: admin._id.toString(), action, message, resource: 'user-action' });
        });
    }
    catch (err) {
        Logger.error(`Error notifying admin: ${err.message}`);
    }
};