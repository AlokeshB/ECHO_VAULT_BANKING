const dotenv = require('dotenv');
const socketIo = require('socket.io');
const notificationService = require('./src/service/notification.service');
const connectDB = require('./src/config/db');
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1); // Exit with failure code
});
dotenv.config();
connectDB();
const app = require('./src/app');
const PORT = process.env.PORT || 5200;
const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

const io = socketIo(server, {
    cors: {
        origin: '*',
    }
});
notificationService.initialize(io);
io.on('connection', (socket) => {
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} connected to notifications`);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected from notifications');
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    server.close(() => {
        process.exit(1); // Exit with failure code
    });
});
