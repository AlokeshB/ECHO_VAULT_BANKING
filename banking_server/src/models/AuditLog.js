const mongoose = require('mongoose');
const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    resource: {
        type: String,
        required: true
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    details: {
        type: Object,
        default: {}
    },
    ipAddress: String,
    userAgent: String,
    location: String,
    deviceId: String
},
    { timestamps: true });
module.exports = mongoose.model('AuditLog', auditLogSchema);