const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1); // Exit with failure code
});
dotenv.config();
connectDB();
const app = require('./src/app');
const PORT = process.env.PORT || 5200;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    server.close(() => {
        process.exit(1); // Exit with failure code
    });
});
