# ECHOVAULT BANKING SERVER - Updated Documentation

A secure, production-ready banking backend API built with Node.js, Express, and MongoDB. ECHOVAULT Banking provides comprehensive financial transaction management with advanced security features, KYC verification, and multi-role access control.

---

## 🔄 Recent Updates (April 2026)

### Email System Removed
- ❌ Removed all email functionality (Nodemailer)
- ❌ Removed email service layer
- ❌ No more email OTP or account approval emails

### PIN-Based 2FA Added
- ✅ Optional 2FA with 4-digit PIN (set after KYC verification)
- ✅ `twoFactorEnabled` flag in User model (true/false)
- ✅ New endpoints: `/setup-2fa-pin`, `/verify-2fa-pin`, `/change-2fa-pin`, `/disable-2fa`
- ✅ PIN verification during login if enabled

### In-App Notifications Only
- ✅ No email notifications
- ✅ Real-time Socket.IO notifications
- ✅ User/Support actions → Admin notification
- ✅ Admin actions → User/Support notification
- ✅ Frontend handles all notification display

### Admin Actions Service
- ✅ New file: `src/service/admin-actions.service.js`
- ✅ Centralized admin operation: account approval, KYC review, support user creation
- ✅ Cleaner separation of concerns

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Quick Start](#quick-start)
5. [Authentication & 2FA](#authentication--2fa)
6. [API Endpoints](#api-endpoints)
7. [In-App Notifications](#in-app-notifications)
8. [Project Structure](#project-structure)
9. [Troubleshooting](#troubleshooting)

---

## Overview

**ECHOVAULT Banking Server** is a REST API backend for a complete banking system with:

- Multi-role authentication (Customer, Admin, Support)
- KYC document verification with encrypted storage
- Optional PIN-based 2FA for enhanced security
- Real-time in-app notifications (Socket.IO)
- Comprehensive audit logging
- Multiple account types and transactions

**Server**: `http://localhost:5200`
**API Base**: `/api/v1`

---

## Features

### Core Features
- Registration with OTP verification
- Email + UserID login options
- Optional 2FA with 4-digit PIN
- KYC document submission & verification
- Multiple account types
- Fund transfers with PIN security
- Real-time in-app notifications
- Complete audit trail

### Security
- JWT authentication
- Rate limiting
- AES-256-GCM encryption (PAN, Aadhaar)
- Bcrypt password hashing
- Input validation (Joi)
- Helmet.js headers
- XSS & injection prevention

---

## Tech Stack

```
Node.js + Express.js
MongoDB + Mongoose
Passport.js + JWT
Socket.IO (Real-time notifications)
Joi (Validation)
Winston (Logging)
Bcrypt (Password hashing)
crypto (AES-256-GCM encryption)
```

---

## Quick Start

### Installation
```bash
cd banking_server
npm install
```

### Configuration
Create `.env`:
```env
NODE_ENV=development
PORT=5200
MONGODB_URI=mongodb://localhost:27017/echovault_banking
JWT_SECRET=your_secret_key_here
ENCRYPTION_KEY=your_32_char_key_here
ENCRYPTION_IV=your_16_char_iv_here
CORS_ORIGIN=http://localhost:3000
SOCKET_IO_CORS_ORIGIN=http://localhost:3000
```

### Start Server
```bash
npm run dev      # Development with auto-reload
npm start        # Production
```

---

## Authentication & 2FA

### Login Flows

**Standard Login (No 2FA)**:
```
POST /api/v1/auth/login-email
→ Returns JWT token + user data
```

**Login with 2FA Enabled**:
```
POST /api/v1/auth/login-email
→ Returns partial token + twoFactorRequired: true

POST /api/v1/auth/verify-2fa-pin (with 4-digit PIN)
→ Returns complete JWT token
```

### Setup 2FA
```
1. User must have KYC verified
2. POST /api/v1/auth/setup-2fa-pin with PIN + OTP
3. twoFactorEnabled set to true
4. PIN stored as hashed value
5. Future logins require PIN verification
```

### 2FA Management
- **Change PIN**: `PATCH /api/v1/auth/change-2fa-pin`
- **Disable 2FA**: `PATCH /api/v1/auth/disable-2fa`

---

## API Endpoints

### Public Endpoints

**Register**
```
POST /api/v1/auth/register
Body: { firstName, lastName, email, password }
Returns: OTP (display in frontend)
```

**Verify Email**
```
POST /api/v1/auth/verify-email
Body: { email, otp }
```

**Login (Email)**
```
POST /api/v1/auth/login-email
Body: { email, password }
Returns: Token + User (or twoFactorRequired if 2FA enabled)
```

**Login (UserID)**
```
POST /api/v1/auth/login-userid
Body: { userId, password }
Returns: Token + User (or twoFactorRequired if 2FA enabled)
```

**Verify 2FA PIN**
```
POST /api/v1/auth/verify-2fa-pin
Headers: Authorization: Bearer {token}
Body: { pin }
Returns: Complete JWT token
```

**Forgot Password**
```
POST /api/v1/auth/forgot-password
Body: { email }
Returns: OTP
```

**Reset Password**
```
PATCH /api/v1/auth/reset-password
Body: { email, otp, newPassword, confirmPassword }
```

### Private Endpoints (Requires Auth)

**Change Password**
```
PATCH /api/v1/auth/change-password
Body: { currentPassword, newPassword, confirmPassword }
```

**Setup 2FA PIN** (Customer, after KYC verified)
```
POST /api/v1/auth/setup-2fa-pin
Body: { pin, confirmPin, otp }
```

**Change 2FA PIN** (2FA enabled)
```
PATCH /api/v1/auth/change-2fa-pin
Body: { currentPin, newPin, confirmPin }
```

**Disable 2FA**
```
PATCH /api/v1/auth/disable-2fa
```

**Submit KYC** (Customer, account approved)
```
POST /api/v1/auth/submit-kyc
Body: { panNumber, aadhaarNumber }
```

**Get KYC Data** (User own + Admin any)
```
GET /api/v1/auth/kyc-data/:userId
```

### Admin Endpoints (Admin Role Required)

**Create Support User**
```
POST /api/v1/auth/create-support
Body: { firstName, lastName, email, password }
```

**Approve Account**
```
PATCH /api/v1/auth/admin/approve-account/:userId
```

**Review KYC**
```
PATCH /api/v1/auth/admin/review-kyc/:userId
Body: { action: 'verify' | 'reject', rejectionReason? }
```

---

## In-App Notifications

### System
- **No email notifications** - all in-app via Socket.IO
- **Real-time delivery** to connected clients
- **Persistent storage** in AuditLog

### User Types Receiving Notifications

**Admin receives notifications from**:
- User KYC submission
- User account requests
- Support escalations

**Users receive notifications from**:
- Account approval status
- KYC verification/rejection
- Transaction updates
- Admin announcements

---

## User Model (2FA Fields)

```javascript
{
  email: String (unique),
  password: String (hashed with bcrypt),
  
  // 2FA Fields
  twoFactorEnabled: Boolean (default: false),
  transactionPin: String (hashed 4 digits, undefined if 2FA disabled),
  transactionPinAttempts: Number (default: 0),
  transactionPinLockedUntil: Date,
  
  // KYC
  kycStatus: String (pending/verified/rejected),
  kycData: {
    panNumber: String (AES-256-GCM encrypted),
    aadhaarNumber: String (AES-256-GCM encrypted),
    verifiedAt: Date,
    rejectedAt: Date,
    rejectionReason: String
  },
  
  // Account
  accountApprovalStatus: String (pending/approved/rejected),
  customUserID: String (VBANK####),
  
  // Timestamps
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Project Structure

```
src/
├── app.js                          # Express setup
├── config/
│   ├── db.js                       # MongoDB
│   ├── passport.js                # Auth strategies
│   └── security.js                # Security config
├── controllers/
│   ├── auth.controller.js         # Auth logic (no email calls)
│   ├── account.controller.js
│   └── transaction.controller.js
├── models/
│   ├── User.js                    # 2FA fields added
│   ├── Account.js
│   ├── Transaction.js
│   └── AuditLog.js
├── middlewares/
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   └── validation.middleware.js
├── routes/
│   ├── auth.routes.js             # 2FA endpoints
│   ├── account.routes.js
│   └── index.js
├── service/
│   ├── notification.service.js    # In-app notifications
│   ├── admin-actions.service.js   # NEW: Admin operations
│   ├── transaction.service.js
│   └── ledger.service.js
├── utils/
│   ├── encryption.js
│   ├── logger.js
│   ├── response.js
│   └── validate.js
└── validations/
    ├── auth.validation.js         # 2FA validators
    ├── account.validation.js
    └── transaction.validation.js
```

---

## Validation Schemas (2FA)

### Setup 2FA PIN
```javascript
{
  pin: "1234" (4 digits),
  confirmPin: "1234" (must match),
  otp: "123456" (6 digits)
}
```

### Verify 2FA PIN
```javascript
{
  pin: "1234" (4 digits)
}
```

### Change 2FA PIN
```javascript
{
  currentPin: "1234",
  newPin: "5678",
  confirmPin: "5678"
}
```

---

## Troubleshooting

### 2FA PIN Issues

**"PIN must be exactly 4 digits"**
- Ensure PIN is numeric, 4 characters
- Example: `1234` ✓, `123` ✗, `12ab` ✗

**"2FA is not enabled for this account"**
- User must setup 2FA first via `/setup-2fa-pin`
- Or use `/disable-2fa` endpoint to disable

**"Your KYC must be verified before setting up 2FA PIN"**
- Setup 2FA only available after KYC verified
- Admin must approve account and verify KYC first

### Notification Issues

**Not receiving in-app notifications**
- Verify Socket.IO connection in frontend
- Check SOCKET_IO_CORS_ORIGIN in .env
- Verify user is logged in (active token)

**Admin not receiving user actions**
- Check `notificationService.notifyUserAction()` is called
- Verify admin is connected to Socket.IO
- Check browser console for Socket.IO errors

---

## Key Implementation Notes

### No Email Service
- Removed: `src/service/email.service.js`
- Removed import: `const emailService = require('../service/email.service');`
- All email calls removed from controllers
- OTP still generated and returned to frontend for display

### Admin Actions Service
- New file: `src/service/admin-actions.service.js`
- Contains: `createSupportUser()`, `approveCustomerAccount()`, `reviewKYC()`, `getUserKYCData()`
- Called from: `auth.controller.js`
- Handles all admin-specific logic

### 2FA Fields in User Model
- `twoFactorEnabled`: Boolean - shows if 2FA is active
- `transactionPin`: String - hashed 4-digit PIN (undefined if 2FA disabled)
- PIN hashed with bcrypt (same as password)
- PIN compared using `user.correctPin()` method

### In-App Notifications
- Via Socket.IO (real-time)
- User/Support → Admin: `notificationService.notifyUserAction()`
- Admin → User: `notificationService.notifyAdminAction()`
- All notifications stored in AuditLog
- Frontend displays based on notification type

---

**Version**: 1.0.0 (April 2026)
**Status**: Production Ready
**Last Updated**: April 27, 2026
