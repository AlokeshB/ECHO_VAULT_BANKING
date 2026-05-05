require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected for seeding admin user');
        const existingUser = await User.findOne({ email: 'admin@echovault.com' });
        if (existingUser) {
            console.log('Admin user already exists. Skipping seeding.');
            return;
        }
        const adminUser = new User({
            firstName: 'System',
            lastName: 'Administrator',
            email: 'admin@echovault.com',
            password: 'SecurePassword123',
            role: 'admin',
            isEmailVerified: true,
            accountApprovalStatus: 'approved',
            kycStatus: 'verified',
            twoFactorEnabled: true,
            loginAttempts: 0,
            transactionPin: '123456'
        });
        adminUser.setEncryptedKYC('ABCDE1234F', '[Aadhaar Redacted]');
        adminUser.kycData.verifiedAt = Date.now();
        await adminUser.save();
        console.log('Admin user seeded successfully');
        process.exit(0);
    }
    catch (err) {
        console.error('Error seeding admin user:', err);
        process.exit(1);
    }

};