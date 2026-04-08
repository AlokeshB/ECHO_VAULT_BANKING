const mongoose = require('mongoose');
const logger = require('../utils/logger');
require('dotenv').config();
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DB_URI, {
            useNewUrlParser: true, // Using the new URL parser to avoid deprecation warnings
            useUnifiedTopology: true, // Using the new Server Discover and Monitoring engine
            autoIndex: true, // Automatically build indexes defined in the schema
            useCreateIndex: true, // Using createIndex() to create an index
            useFindAndModify: false, // will be using findOneAndUpdate() rather than findAndModify()
        });
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        const isReplicaSet = conn.connection.db.admin().command({ ismaster: 1 }).then((info) => {
            if (info.ismaster && info.ismaster.setName) {
                logger.info(`Connected to MongoDB Replica Set: ${info.ismaster.setName}`);
            }
            else if (!info.setName && process.env.NODE_ENV === 'developement') {
                logger.warn('Connected to MongoDB standalone instance. Transactions will not work. Consider using a replica set for production environments.');
            }
        });
    } catch (error) {
        logger.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
    mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB connection lost. Attempting to reconnect...');
    });
    mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected successfully.');
    });
    mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
    });
}