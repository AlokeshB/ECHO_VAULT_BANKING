const AuditLog = require('../models/AuditLog');
const Logger = require('../utils/logger');
let io;
exports.init = (socketToInstance) => {
    io = socketToInstance;
    // io.on('connection', (socket) => {
    //     Logger.info(`New client connected: ${socket.id}`);
    //     socket.on('join', (userId) => {
    //         socket.join(userId);
    //         Logger.info(`User ${userId} joined notifications`);
    //     });
    //     socket.on('disconnect', () => {
    //         Logger.info(`Client disconnected: ${socket.id}`);
    //     });
    // });
}
/**
 * @desc Send real-time notification to user device via Socket.IO and log to DB
 */
const sendNotification = async ({ userId, action, message, resource, resourceId, details, ipAddress, userAgent, location, deviceId }) => {
    try{
        if (io) {
            io.to(userId).emit('notification', {
                action,
                message,
                resource,
                resourceId,
                details,
                timestamp: new Date()
            });
            Logger.info(`Notification sent to user ${userId} for action ${action} on resource ${resource}`);
        }
        await AuditLog.create({
            user: userId,
            action,
            resource,
            message,
            resourceId,
            details,
            ipAddress,
            userAgent,
            location,
            deviceId
        });
        Logger.info(`Audit log created for user ${userId} action ${action} on resource ${resource}`);
    }
    catch(err){
        Logger.error(`Error sending notification: ${err.message}`);
    }
};

/**
 * @desc Admin Actions to be notified to users/Support staff
 */
exports.notifyAdminAction = async ({ userId, action, message}) => {
    await sendNotification({ userId, action, message, 'resource': 'admin-action' });
}

/**
 * @desc User/Support Actions to be notified to Admin staff
 */
exports.notifyUserAction = async ({ userId, action, message}) => {
    try{
        const User = require('../models/User');
        const adminUsers = await User.find({ role: 'admin' }).select('_id');
        adminUsers.forEach(admin => {
            sendNotification({ userId: admin._id.toString(), action, message, 'resource': 'user-action' });
        });
    }
    catch(err){
        Logger.error(`Error notifying admin: ${err.message}`);
    }
};