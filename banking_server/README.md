# ECHOVAULT BANKING SERVER

A secure, production-ready banking backend API built with Node.js, Express, and MongoDB. ECHOVAULT Banking provides comprehensive financial transaction management with advanced security features, KYC verification, multi-role access control, and real-time notifications.

**Server**: `http://localhost:5200`  
**API Base**: `/api/v1`  
**Status**: Production Ready  
**Version**: 1.0.0 (May 2026)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Recent Updates](#recent-updates)
4. [Tech Stack](#tech-stack)
5. [Quick Start](#quick-start)
6. [Environment Setup](#environment-setup)
7. [Authentication & 2FA](#authentication--2fa)
8. [API Reference](#api-reference)
9. [Data Models](#data-models)
10. [Security Features](#security-features)
11. [Real-Time Notifications](#real-time-notifications)
12. [Project Structure](#project-structure)
13. [Middleware Overview](#middleware-overview)
14. [Services](#services)
15. [Error Handling](#error-handling)
16. [Audit Logging](#audit-logging)
17. [Troubleshooting](#troubleshooting)

---

## Overview

**ECHOVAULT Banking Server** is a comprehensive REST API for a complete digital banking platform with:

- **Multi-role authentication**: Customer, Admin, Support User roles
- **KYC verification**: Document submission with encrypted storage (AES-256-GCM)
- **Optional PIN-based 2FA**: Extra security layer for sensitive operations
- **Real-time in-app notifications**: Socket.IO for instant user feedback
- **Complete audit trail**: Every action logged for compliance & security
- **Multiple account types**: Savings, Checking, Business accounts
- **Secure fund transfers**: With PIN verification and transaction limits

---

## Features

### Core Banking Features
✅ **User Registration & Authentication**
- Email-based registration with OTP verification
- Dual login options: Email or Custom UserID (VBANK####)
- JWT tokens with 7-day expiry
- Secure password hashing with Bcrypt

✅ **KYC Verification System**
- Customer submits PAN & Aadhaar numbers
- AES-256-GCM encrypted storage
- Admin review & approval workflow
- Verification status tracking (pending/verified/rejected)
- Rejection reasons for transparency

✅ **Account Management**
- Multiple account types (Savings, Checking, Business)
- Auto-generated unique account numbers
- Real-time balance tracking
- Account freezing & closure capabilities
- Account statements with date-range filtering
- Transaction history with pagination & filters

✅ **Financial Transactions**
- Secure fund transfers between accounts
- Transaction PIN verification
- Transaction reference tracking
- Real-time transaction status updates
- Full transaction history & reconciliation
- Support for multiple currencies (default: INR)

✅ **Two-Factor Authentication (2FA)**
- Optional 4-digit PIN-based 2FA (after KYC verified)
- PIN setup, change, and disable operations
- Failed attempt tracking with 15-minute lockouts
- 2FA required for login and fund transfers

✅ **Real-Time Notifications**
- Socket.IO-based in-app notifications (no email)
- Admin notifications for KYC submissions & account requests
- User notifications for account approvals & transactions
- Persistent notification storage in audit logs

✅ **Admin Dashboard Features**
- Create support users
- Approve/reject customer accounts
- Review & verify KYC documents
- View all users with role-based filtering
- System-wide audit logs

---

## Recent Updates

### April 2026 - May 2026

#### Email System Removal
- ❌ Removed Nodemailer email service
- ❌ Removed email notification layer
- ❌ No more email OTP or approval notifications
- ✅ OTP returned directly in API response for frontend display

#### 2FA PIN System Implementation
- ✅ Optional PIN-based 2FA (4-digit numeric PIN)
- ✅ PIN stored as Bcrypt-hashed value for security
- ✅ Failed attempt tracking (max 3 attempts, then 15-min lockout)
- ✅ Endpoints: `setup-2fa-pin`, `verify-2fa-pin`, `change-2fa-pin`, `disable-2fa`
- ✅ PIN verification required during login (if enabled)
- ✅ PIN verification required for fund transfers

#### In-App Notifications System
- ✅ Real-time Socket.IO notification delivery
- ✅ User actions trigger admin notifications
- ✅ Admin actions trigger user notifications
- ✅ All notifications persisted in AuditLog
- ✅ Frontend handles all notification UI/UX

#### Admin Actions Service
- ✅ New centralized service: `AdminActionsService`
- ✅ Methods: `createSupportUser()`, `approveCustomerAccount()`, `reviewKYC()`, `getUserKYCData()`
- ✅ Better separation of concerns
- ✅ Reduced code duplication in controllers

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js 4.18+ |
| **Database** | MongoDB 5.0+ |
| **ORM** | Mongoose 9.5+ |
| **Authentication** | Passport.js + JWT |
| **Real-Time** | Socket.IO 4.8+ |
| **Validation** | Joi 18+ |
| **Logging** | Winston 3.19+ |
| **Password Hashing** | Bcrypt 6.0+ |
| **Encryption** | Node.js crypto (AES-256-GCM) |
| **Security Headers** | Helmet.js 8.1+ |
| **Rate Limiting** | express-rate-limit 8.4+ |
| **CORS** | cors 2.8+ |
| **XSS Protection** | xss-clean 0.1+ |

---

## Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally or connection URI
- npm or yarn

### Installation
```bash
# 1. Clone repository
cd banking_server

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Configure environment variables (see Environment Setup)
# Edit .env with your values

# 5. Start server
npm run dev      # Development with hot-reload (Nodemon)
npm start        # Production
```

### Verify Installation
```bash
curl http://localhost:5200/api/v1/health

# Expected response:
{
  "success": true,
  "message": "API is running",
  "version": "v1",
  "timestamp": "2026-05-04T..."
}
```

---

## Environment Setup

Create `.env` file in `banking_server/` root directory:

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=development                    # development | production | test
PORT=5200                               # Server port

# ============================================
# DATABASE
# ============================================
MONGODB_URI=mongodb://localhost:27017/echovault_banking
# For MongoDB Atlas: mongodb+srv://user:password@cluster.mongodb.net/db_name

# ============================================
# JWT CONFIGURATION
# ============================================
JWT_SECRET=your_very_secret_jwt_key_minimum_32_chars_xyz123abc
JWT_EXPIRE=7d                           # Token expiry duration

# ============================================
# ENCRYPTION (For PAN, Aadhaar)
# ============================================
ENCRYPTION_KEY=1234567890123456789012345678901   # 32 chars for AES-256
ENCRYPTION_IV=1234567890123456                   # 16 chars for IV

# ============================================
# CORS & SECURITY
# ============================================
CORS_ORIGIN=http://localhost:3000       # Frontend URL
SOCKET_IO_CORS_ORIGIN=http://localhost:3000

# ============================================
# RATE LIMITING
# ============================================
REGISTER_RATE_LIMIT=5                   # Registrations per 24 hours per IP
LOGIN_RATE_LIMIT=10                     # Login attempts per 15 minutes per IP
TRANSFER_RATE_LIMIT=20                  # Transfers per day per user

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=debug                         # debug | info | warn | error

# ============================================
# USER CONFIGURATION
# ============================================
OTP_EXPIRY_MINUTES=10                   # OTP validity duration
MAX_LOGIN_ATTEMPTS=5                    # Failed attempts before lockout
LOGIN_LOCKOUT_MINUTES=30                # Lockout duration after max attempts
```

---

## Authentication & 2FA

### User Roles
```
1. Customer    - Regular banking users (can open accounts, transfer funds)
2. Admin       - System administrators (approve accounts, verify KYC)
3. Support     - Support staff created by admin (handle customer issues)
```

### Registration Flow
```
1. POST /api/v1/auth/register
   ↓ Creates user with pending account approval
   ↓ Generates 6-digit OTP (valid 10 minutes)
   ↓ Returns OTP in API response
   
2. POST /api/v1/auth/verify-email
   ↓ User enters OTP
   ↓ Email marked as verified
   ↓ Account ready for admin approval
```

### Login Flow (Without 2FA)
```
POST /api/v1/auth/login-email or login-userid
  ↓ Validates credentials
  ↓ Generates JWT token (7-day expiry)
  ↓ Returns token + user profile
└─ User is authenticated
```

### Login Flow (With 2FA Enabled)
```
Step 1: POST /api/v1/auth/login-email
  ├─ Validates email/password
  ├─ Detects 2FA is enabled
  └─ Returns partial token + twoFactorRequired: true

Step 2: POST /api/v1/auth/verify-2fa-pin
  ├─ User enters 4-digit PIN
  ├─ Verifies PIN against hashed value
  ├─ Generates complete JWT token
  └─ User is authenticated
```

### 2FA Setup Process (Customer Only, After KYC Verified)
```
1. POST /api/v1/auth/setup-2fa-pin
   - Body: { pin, confirmPin, otp }
   - User creates 4-digit PIN
   - OTP verification required
   - Hashed PIN stored in User model
   - twoFactorEnabled flag set to true
   
2. All future logins require PIN verification
3. PIN also required for fund transfers
```

### 2FA Management
```
Change PIN:
  PATCH /api/v1/auth/change-2fa-pin
  Body: { currentPin, newPin, confirmPin }

Disable 2FA:
  PATCH /api/v1/auth/disable-2fa
  Headers: Authorization: Bearer {jwt_token}
```

### Transaction PIN vs Login PIN
- **Login PIN (2FA PIN)**: 4-digit PIN for login verification (twoFactorEnabled)
- **Transaction PIN**: Same PIN used for fund transfer verification
- Both use same hashed value in `transactionPin` field

---

## API Reference

### Base URL
```
http://localhost:5200/api/v1
```

### Response Format
All API responses follow standard format:

**Success Response (2xx)**:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "statusCode": 200,
  "timestamp": "2026-05-04T10:30:00Z"
}
```

**Error Response (4xx/5xx)**:
```json
{
  "success": false,
  "message": "Error description",
  "error": null,
  "statusCode": 400,
  "timestamp": "2026-05-04T10:30:00Z"
}
```

### Authentication Headers
```
Authorization: Bearer {jwt_token}
X-Request-ID: {unique_request_id}
Content-Type: application/json
```

---

## Authentication Endpoints

### 1. Register Customer
```
POST /api/v1/auth/register

Request Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "otp": "123456"
  },
  "message": "Registration successful. Use the OTP to verify your account."
}
```

### 2. Verify Email
```
POST /api/v1/auth/verify-email

Request Body:
{
  "email": "john@example.com",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "Email verified successfully. Your account is now active."
}
```

### 3. Login with Email
```
POST /api/v1/auth/login-email

Request Body:
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response (Without 2FA):
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "customer",
      "customUserID": "VBANK1234",
      "twoFactorEnabled": false
    }
  },
  "message": "Login successful."
}

Response (With 2FA):
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "twoFactorRequired": true,
    "message": "Please verify your PIN to complete login"
  }
}
```

### 4. Login with UserID
```
POST /api/v1/auth/login-userid

Request Body:
{
  "userId": "VBANK1234",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "customUserID": "VBANK1234",
      "role": "customer",
      "twoFactorEnabled": false
    }
  },
  "message": "Login successful."
}
```

### 5. Verify 2FA PIN
```
POST /api/v1/auth/verify-2fa-pin
Headers: Authorization: Bearer {token}

Request Body:
{
  "pin": "1234"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "2FA verification successful."
}
```

### 6. Setup 2FA PIN
```
POST /api/v1/auth/setup-2fa-pin
Headers: Authorization: Bearer {token}
Requires: KYC verified

Request Body:
{
  "pin": "1234",
  "confirmPin": "1234",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "2FA PIN setup successfully."
}
```

### 7. Change 2FA PIN
```
PATCH /api/v1/auth/change-2fa-pin
Headers: Authorization: Bearer {token}
Requires: 2FA enabled

Request Body:
{
  "currentPin": "1234",
  "newPin": "5678",
  "confirmPin": "5678"
}

Response:
{
  "success": true,
  "message": "PIN changed successfully."
}
```

### 8. Disable 2FA
```
PATCH /api/v1/auth/disable-2fa
Headers: Authorization: Bearer {token}
Requires: 2FA enabled

Response:
{
  "success": true,
  "message": "2FA disabled successfully."
}
```

### 9. Change Password
```
PATCH /api/v1/auth/change-password
Headers: Authorization: Bearer {token}

Request Body:
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!",
  "confirmPassword": "NewPass456!"
}

Response:
{
  "success": true,
  "message": "Password changed successfully."
}
```

### 10. Forgot Password
```
POST /api/v1/auth/forgot-password

Request Body:
{
  "email": "john@example.com"
}

Response:
{
  "success": true,
  "data": { "otp": "123456" },
  "message": "OTP sent to your email."
}
```

### 11. Reset Password
```
PATCH /api/v1/auth/reset-password

Request Body:
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "NewPass456!",
  "confirmPassword": "NewPass456!"
}

Response:
{
  "success": true,
  "message": "Password reset successfully."
}
```

### 12. Submit KYC
```
POST /api/v1/auth/submit-kyc
Headers: Authorization: Bearer {token}
Requires: Account approved

Request Body:
{
  "panNumber": "ABCD1234E",
  "aadhaarNumber": "1234-5678-9012"
}

Response:
{
  "success": true,
  "message": "KYC documents submitted successfully."
}
```

### 13. Get KYC Data
```
GET /api/v1/auth/kyc-data/:userId
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "panNumber": "ABCD1234E" (decrypted),
    "aadhaarNumber": "1234-5678-9012" (decrypted),
    "verified": true,
    "verifiedAt": "2026-05-04T10:30:00Z"
  }
}
```

### 14. Create Support User (Admin Only)
```
POST /api/v1/auth/create-support
Headers: Authorization: Bearer {admin_token}
Role Required: Admin

Request Body:
{
  "firstName": "Support",
  "lastName": "Agent",
  "email": "support@bank.com",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "support@bank.com",
    "role": "support"
  },
  "message": "Support user created successfully."
}
```

### 15. Approve Account (Admin Only)
```
PATCH /api/v1/auth/admin/approve-account/:userId
Headers: Authorization: Bearer {admin_token}
Role Required: Admin

Request Body:
{
  "action": "approve"
}

Response:
{
  "success": true,
  "message": "Account approved successfully."
}
```

### 16. Review KYC (Admin Only)
```
PATCH /api/v1/auth/admin/review-kyc/:userId
Headers: Authorization: Bearer {admin_token}
Role Required: Admin

Request Body:
{
  "action": "verify",
  "rejectionReason": null
}

Or for rejection:
{
  "action": "reject",
  "rejectionReason": "Documents not clear"
}

Response:
{
  "success": true,
  "message": "KYC verified successfully."
}
```

### 17. Get All Users (Admin Only)
```
GET /api/v1/auth/admin/users?role=customer&kycStatus=pending
Headers: Authorization: Bearer {admin_token}
Role Required: Admin

Query Parameters:
- role: customer | admin | support
- kycStatus: pending | verified | rejected
- accountApprovalStatus: pending | approved | rejected

Response:
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "customer",
      "customUserID": "VBANK1234",
      "kycStatus": "pending",
      "accountApprovalStatus": "approved",
      "createdAt": "2026-05-04T10:30:00Z"
    }
  ]
}
```

---

## Account Endpoints

### 1. Get All Accounts
```
GET /api/v1/accounts
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "accountId": "507f1f77bcf86cd799439011",
      "accountNumber": "ACT1001234567890",
      "accountType": "savings",
      "balance": 50000,
      "currency": "INR",
      "status": "active",
      "createdAt": "2026-05-04T10:30:00Z"
    }
  ],
  "message": "Retrieved 1 account(s) successfully"
}
```

### 2. Get Account Balance
```
GET /api/v1/accounts/:accountId/balance
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "accountId": "507f1f77bcf86cd799439011",
    "accountNumber": "ACT1001234567890",
    "accountType": "savings",
    "balance": 50000,
    "currency": "INR",
    "routingNumber": "123456789",
    "status": "active",
    "lastUpdated": "2026-05-04T10:30:00Z"
  },
  "message": "Balance fetched successfully"
}
```

### 3. Get Account Details
```
GET /api/v1/accounts/:accountId/details
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "accountId": "507f1f77bcf86cd799439011",
    "accountNumber": "ACT1001234567890",
    "accountType": "savings",
    "accountHolder": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "balance": 50000,
    "currency": "INR",
    "status": "active",
    "createdAt": "2026-05-04T10:30:00Z",
    "updatedAt": "2026-05-04T10:30:00Z",
    "isActive": true,
    "isFrozen": false,
    "isClosed": false
  },
  "message": "Account details fetched successfully"
}
```

### 4. Get Transaction History
```
GET /api/v1/accounts/:accountId/transactions?page=1&limit=10&startDate=2026-05-01&endDate=2026-05-04&status=completed
Headers: Authorization: Bearer {token}

Query Parameters:
- page: Page number (default: 1)
- limit: Records per page (default: 10, max: 50)
- startDate: YYYY-MM-DD format
- endDate: YYYY-MM-DD format
- type: credit | debit
- status: pending | completed | failed | cancelled

Response:
{
  "success": true,
  "data": {
    "transactions": [
      {
        "transactionId": "507f1f77bcf86cd799439011",
        "reference": "TXN2026050412345",
        "type": "transfer",
        "status": "completed",
        "amount": 5000,
        "currency": "INR",
        "accountDirection": "debit",
        "senderAccount": {
          "accountNumber": "ACT1001234567890",
          "accountType": "savings"
        },
        "receiverAccount": {
          "accountNumber": "ACT1001234567999",
          "accountType": "savings"
        },
        "description": "Payment to vendor",
        "createdAt": "2026-05-04T10:30:00Z",
        "completedAt": "2026-05-04T10:31:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalTransactions": 45,
      "perPage": 10
    },
    "accountNumber": "ACT1001234567890",
    "accountType": "savings"
  },
  "message": "Transaction history retrieved successfully"
}
```

### 5. Get Account Statement
```
GET /api/v1/accounts/:accountId/statement?month=2026-05&year=2026
Headers: Authorization: Bearer {token}

Query Parameters:
- month: YYYY-MM format (optional, defaults to current month)
- year: YYYY format (optional)

Response:
{
  "success": true,
  "data": {
    "statementPeriod": "May 2026",
    "accountNumber": "ACT1001234567890",
    "accountType": "savings",
    "accountHolder": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "openingBalance": 45000,
    "closingBalance": 50000,
    "totalCredits": 10000,
    "totalDebits": 5000,
    "transactions": [ /* transactions array */ ]
  },
  "message": "Account statement generated successfully"
}
```

### 6. Open New Account
```
POST /api/v1/accounts/open-account
Headers: Authorization: Bearer {token}
Requires: KYC verified

Request Body:
{
  "accountType": "savings",
  "initialBalance": 5000
}

Account Types: savings | checking | business

Response:
{
  "success": true,
  "data": {
    "accountId": "507f1f77bcf86cd799439011",
    "accountNumber": "ACT1001234567890",
    "accountType": "savings",
    "balance": 5000,
    "currency": "INR",
    "status": "active"
  },
  "message": "Account opened successfully"
}
```

### 7. Freeze Account
```
POST /api/v1/accounts/:accountId/freeze
Headers: Authorization: Bearer {token}

Request Body:
{
  "reason": "Suspicious activity"
}

Response:
{
  "success": true,
  "message": "Account frozen successfully"
}
```

### 8. Unfreeze Account
```
POST /api/v1/accounts/:accountId/unfreeze
Headers: Authorization: Bearer {token}
Requires: Admin or account owner verification

Request Body:
{
  "reason": "Issue resolved"
}

Response:
{
  "success": true,
  "message": "Account unfrozen successfully"
}
```

### 9. Close Account
```
POST /api/v1/accounts/:accountId/close
Headers: Authorization: Bearer {token}
Requires: Account must have zero balance

Request Body:
{
  "reason": "Account no longer needed",
  "password": "AccountPassword123!"
}

Response:
{
  "success": true,
  "message": "Account closed successfully"
}
```

---

## Transaction Endpoints

### 1. Transfer Funds
```
POST /api/v1/transactions/transfer
Headers: Authorization: Bearer {token}
Requires: KYC verified, 2FA PIN setup

Request Body:
{
  "senderAccountNumber": "ACT1001234567890",
  "receiverAccountNumber": "ACT1001234567999",
  "amount": 5000,
  "description": "Payment for services",
  "transactionPin": "1234"
}

Response:
{
  "success": true,
  "data": {
    "transactionId": "507f1f77bcf86cd799439011",
    "reference": "TXN2026050412345",
    "amount": 5000,
    "timestamp": "2026-05-04T10:30:00Z"
  },
  "message": "Transfer completed successfully"
}

Possible Errors:
- "Insufficient funds" (400)
- "KYC not verified" (400)
- "Sender and receiver account numbers cannot be the same" (400)
- "Transfer amount must be greater than zero" (400)
- "Invalid transaction PIN" (401)
- "Transaction PIN is temporarily locked" (429)
- "Receiver account does not exist or is inactive" (400)
```

---

## Data Models

### User Model
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (bcrypt hashed),
  role: String (customer | admin | support),
  customUserID: String (unique, format: VBANK####),
  
  // Account Status
  accountApprovalStatus: String (pending | approved | rejected),
  
  // Email Verification
  isEmailVerified: Boolean (default: false),
  otp: String (hashed),
  otpExpires: Date,
  
  // 2FA Fields
  twoFactorEnabled: Boolean (default: false),
  transactionPin: String (bcrypt hashed 4-digit PIN),
  transactionPinAttempts: Number (default: 0),
  transactionPinLockedUntil: Date,
  
  // KYC
  kycStatus: String (pending | verified | rejected),
  kycData: {
    panNumber: String (AES-256-GCM encrypted),
    aadhaarNumber: String (AES-256-GCM encrypted),
    verifiedAt: Date,
    rejectedAt: Date,
    rejectionReason: String
  },
  
  // Login Tracking
  loginAttempts: Number (default: 0),
  lastLoginAttempts: Date,
  lockedUntil: Date,
  lastLoginAt: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Account Model
```javascript
{
  user: ObjectId (ref: User),
  accountNumber: String (unique),
  accountType: String (savings | checking | business),
  balance: Number (default: 0),
  currency: String (default: INR),
  status: String (active | frozen | closed),
  
  // Account Metadata
  issuedAt: Date,
  lastUpdated: Date,
  freezeReason: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Model
```javascript
{
  senderAccount: ObjectId (ref: Account),
  recieverAccount: ObjectId (ref: Account),
  
  transactionReference: String (unique),
  type: String (transfer | deposit | withdrawal),
  status: String (pending | completed | failed | cancelled),
  amount: Number,
  currency: String (default: INR),
  description: String,
  
  // Metadata
  initiatedBy: ObjectId (ref: User),
  iPAddress: String,
  userAgent: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

### AuditLog Model
```javascript
{
  userId: ObjectId (ref: User),
  action: String (e.g., 'login', 'transfer', 'kyc_submitted'),
  resource: String (auth | transaction | account | admin),
  
  // Request Details
  method: String (GET | POST | PATCH | DELETE),
  endpoint: String,
  statusCode: Number,
  
  // Security Metadata
  iPAddress: String,
  userAgent: String,
  geoLocation: String,
  
  // Audit Data
  changes: Object,
  notification: {
    type: String,
    recipients: [ObjectId],
    deliveredAt: Date
  },
  
  createdAt: Date
}
```

---

## Security Features

### Authentication & Authorization
- **JWT Tokens**: 7-day expiration with refresh capability
- **Bcrypt Password Hashing**: 10-round salt for password security
- **Passport.js**: Multiple authentication strategies (email-local, userid-local, JWT)
- **Role-Based Access Control**: Customer, Admin, Support roles with endpoint restrictions

### Data Protection
- **AES-256-GCM Encryption**: For sensitive documents (PAN, Aadhaar)
- **Request Sanitization**: XSS cleaning, input validation with Joi
- **SQL/NoSQL Injection Prevention**: Parameterized queries via Mongoose

### Threat Mitigation
- **Rate Limiting**:
  - Register: 5 attempts per 24 hours per IP
  - Login: 10 attempts per 15 minutes per IP
  - Transfers: 20 per day per user
  - Global: 100 requests per 15 minutes per IP

- **Brute Force Protection**:
  - Account lockout after 5 failed login attempts
  - 30-minute lockout duration
  - PIN lockout after 3 failed attempts
  - 15-minute PIN lockout

- **Security Headers** (Helmet.js):
  - X-Frame-Options: DENY (Clickjacking prevention)
  - X-XSS-Protection: 1; mode=block
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security (HTTPS enforcement)
  - Content-Security-Policy headers

### Request Validation
- **Content-Type Validation**: Only accepts application/json
- **Parameter Pollution Prevention**: via hpp middleware
- **Request Size Limit**: 10KB max for JSON bodies
- **Suspicious Activity Detection**: Geographic location, user agent changes

---

## Real-Time Notifications

### Socket.IO Integration
```javascript
// Server initialization (server.js)
const io = socketIo(server, {
  cors: { origin: '*' }
});

notificationService.initialize(io);

// Client joins notification room
io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    socket.join(userId);  // Join user-specific room
  });
});
```

### Notification Types

**User Actions → Admin Notifications**:
- KYC document submitted
- Account opening requested
- Support ticket created

**Admin Actions → User Notifications**:
- Account approved
- Account rejected
- KYC verified
- KYC rejected
- Support ticket resolved

**System Notifications**:
- Transaction completed
- Transaction failed
- Account frozen
- Account unfrozen
- 2FA setup confirmed
- Login from new device

### Frontend Integration Example
```javascript
// Connect to notifications
socket.emit('join', userId);

// Listen for notifications
socket.on('notification', (data) => {
  console.log(data.type, data.message);
  // Display toast/modal based on type
});

// Notification data structure
{
  type: 'kyc_verified' | 'account_approved' | 'transaction_completed',
  message: 'Your KYC has been verified',
  timestamp: '2026-05-04T10:30:00Z',
  data: { /* type-specific data */ }
}
```

---

## Project Structure

```
banking_server/
├── server.js                           # Entry point with Socket.IO setup
├── package.json                        # Dependencies & scripts
├── .env                                # Environment variables
├── README.md                           # Documentation
│
├── src/
│   ├── app.js                          # Express app initialization
│   │
│   ├── config/
│   │   ├── db.js                       # MongoDB connection
│   │   ├── passport.js                 # Passport strategies (2 local + JWT)
│   │   └── secuirity.js                # Security middleware config
│   │
│   ├── controllers/
│   │   ├── auth.controller.js         # 30+ Auth operations (register, login, KYC, 2FA)
│   │   ├── account.controller.js      # Account CRUD + statements + history
│   │   └── transaction.controller.js  # Fund transfers + reconciliation
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js         # JWT protect + role-based access
│   │   ├── error.middleware.js        # Global error handler + 404
│   │   ├── audit.middleware.js        # Request/response logging
│   │   ├── login-attempt.middleware.js # Brute force protection
│   │   ├── secuirity.middleware.js    # XSS, injection, suspicious activity
│   │   └── validation.middleware.js   # Request validation wrapper
│   │
│   ├── models/
│   │   ├── User.js                    # User with 2FA + KYC fields
│   │   ├── Account.js                 # Multi-account support
│   │   ├── Transaction.js             # Complete transaction tracking
│   │   └── AuditLog.js                # Compliance logging + notifications
│   │
│   ├── routes/
│   │   ├── index.js                   # Route aggregation
│   │   ├── auth.routes.js             # 17+ Auth endpoints
│   │   ├── account.routes.js          # 9 Account management endpoints
│   │   └── transaction.routes.js      # 1 Transfer endpoint (main feature)
│   │
│   ├── service/
│   │   ├── admin-actions.service.js   # Centralized admin operations
│   │   ├── notification.service.js    # Socket.IO notifications
│   │   ├── transaction.service.js     # Transfer logic + validation
│   │   └── ledger.service.js          # Financial reconciliation
│   │
│   ├── utils/
│   │   ├── encryption.js              # AES-256-GCM utilities
│   │   ├── logger.js                  # Winston logging
│   │   ├── response.js                # Standardized response formatter
│   │   ├── request-parser.js          # Metadata extraction for audit
│   │   └── validate.js                # Joi schema utilities
│   │
│   └── validations/
│       ├── auth.validation.js         # Auth request schemas
│       ├── account.validation.js      # Account operation schemas
│       └── transaction.validation.js  # Transfer schemas
│
└── logs/
    └── error.log                       # Error logs (Winston)
```

---

## Middleware Overview

| Middleware | Purpose | Location |
|-----------|---------|----------|
| `configureHelmet()` | Security headers | app.js (first) |
| `configureCors()` | Cross-origin requests | app.js (early) |
| `globalRateLimiter` | Request rate limiting | app.js (early) |
| `detectSuspiciousActivity` | Geographic anomalies | app.js |
| `validateContentType` | Ensure JSON requests | app.js |
| `verifyRequestOrigin` | Origin validation | app.js |
| `expressJson()` | Parse JSON bodies | app.js |
| `xssClean()` | XSS prevention | app.js |
| `preventParameterPollution` | hpp protection | app.js |
| `sanitizeRequestData` | Data sanitization | app.js |
| `hpp()` | HTTP Parameter Pollution | app.js |
| `morgan()` | HTTP request logging | app.js |
| `auditMiddleware` | Request metadata capture | app.js |
| `passport.initialize()` | Passport setup | app.js |
| `protect` | JWT verification | Routes |
| `restrictTo(role)` | Role-based access | Routes |
| `validateRequest(schema)` | Joi validation | Routes |
| `checkLoginAttempts` | Brute force check | Auth routes |
| `authenticateWithAttempts` | Passport + attempt tracking | Auth routes |

---

## Services

### AdminActionsService
```javascript
// In: src/service/admin-actions.service.js

Methods:
1. createSupportUser(firstName, lastName, email, password)
   → Creates support staff account

2. approveCustomerAccount(userId)
   → Sets accountApprovalStatus to 'approved'
   → Notifies user of approval
   → Logs audit entry

3. reviewKYC(userId, action, rejectionReason)
   → action: 'verify' | 'reject'
   → Sets kycStatus and timestamps
   → Sends appropriate notification

4. getUserKYCData(userId, requestedBy)
   → Retrieves and decrypts KYC data
   → Permission checks (admin or self)
```

### NotificationService
```javascript
// In: src/service/notification.service.js

Methods:
1. initialize(io)
   → Setup Socket.IO instance

2. notifyUserAction(userId, action, data)
   → Sends notification to admins about user action
   → Stores in AuditLog
   → Emits via Socket.IO

3. notifyAdminAction(userId, action, data)
   → Sends notification to user about admin action
   → Stores in AuditLog
   → Emits via Socket.IO

3. notifyTransactionUpdate(accountId, status, data)
   → Notifies account owner of transaction status
```

### TransactionService
```javascript
// In: src/service/transaction.service.js

Methods:
1. initiateTransfer(userId, senderAcct, receiverAcct, amount, desc, context)
   → Validates accounts and balances
   → Creates transaction record
   → Updates account balances
   → Sends notifications
   → Returns transaction details

Error Handling:
- Insufficient funds
- KYC not verified
- Accounts don't match user
- Receiver account inactive
- Amount validation
```

### LedgerService
```javascript
// In: src/service/ledger.service.js

Methods:
1. getAccountLedger(accountId, startDate, endDate)
   → Returns all transactions for account
   → Calculates running balance
   → Returns formatted ledger

2. reconcileAccounts(accountIds)
   → Verifies account balance accuracy
   → Identifies discrepancies
   → Returns reconciliation report
```

---

## Error Handling

### Global Error Handler
```javascript
// In: src/middlewares/error.middleware.js

Catches all errors and returns standardized format:

{
  success: false,
  message: "Error description",
  error: null,
  statusCode: 400,
  timestamp: "2026-05-04T..."
}

Error Types Handled:
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Duplicate key errors (409)
- Rate limit errors (429)
- Server errors (500)
```

### HTTP Status Codes
```
200 OK - Successful request
201 Created - Resource created
400 Bad Request - Invalid input
401 Unauthorized - Invalid credentials
403 Forbidden - Insufficient permissions
404 Not Found - Resource not found
409 Conflict - Duplicate/existing resource
429 Too Many Requests - Rate limited
500 Internal Server Error - Server error
```

---

## Audit Logging

### What Gets Logged
- Every API request (method, endpoint, status)
- User authentication events (login, logout, failed attempts)
- KYC submission and review
- Account approval/rejection
- Fund transfers (success/failure)
- 2FA setup/changes
- Error events

### Audit Data Captured
```javascript
{
  userId: ObjectId,
  action: String,           // Specific operation
  resource: String,         // auth | account | transaction | admin
  method: String,           // HTTP method
  endpoint: String,         // API endpoint
  statusCode: Number,       // Response code
  iPAddress: String,        // Client IP
  userAgent: String,        // Browser/client info
  geoLocation: String,      // Geographic location
  changes: Object,          // What was changed
  notification: {           // Notification tracking
    type: String,
    recipients: [ObjectId],
    deliveredAt: Date
  },
  createdAt: Date
}
```

### Access Audit Logs
```
Admin can retrieve logs via internal tools
Frontend can display notifications from logs
All logs stored indefinitely for compliance
Winston logs also written to: logs/error.log
```

---

## Troubleshooting

### Installation Issues

**"npm install" fails**
```
Solution: Clear npm cache
  npm cache clean --force
  rm package-lock.json
  npm install
```

**"MongoDB connection fails"**
```
Issues:
  1. MongoDB not running: mongod --dbpath /path/to/data
  2. Wrong connection string in .env
  3. Incorrect credentials for MongoDB Atlas

Verify connection:
  mongosh "mongodb://localhost:27017"
```

### Authentication Issues

**"Invalid JWT token" / "401 Unauthorized"**
```
Causes:
  1. Token expired (7 days)
  2. Token malformed in request
  3. JWT_SECRET changed

Solutions:
  1. Re-login to get fresh token
  2. Include header: Authorization: Bearer {token}
  3. Verify JWT_SECRET in .env matches
```

**"2FA not working" / "PIN validation fails"**
```
Causes:
  1. 2FA not enabled on account
  2. KYC not verified
  3. PIN format incorrect (must be 4 digits)
  4. PIN locked after 3 attempts

Solutions:
  1. Setup 2FA first: POST /setup-2fa-pin
  2. Submit and get KYC verified by admin
  3. Use 4-digit numeric PIN (e.g., "1234")
  4. Wait 15 minutes for PIN lockout to expire
```

### Rate Limiting Issues

**"429 Too Many Requests"**
```
Causes:
  1. Exceeded rate limit for endpoint
  2. Making requests too quickly from same IP

Limits:
  - Register: 5 per 24 hours per IP
  - Login: 10 per 15 minutes per IP
  - Transfers: 20 per day per user
  - Global: 100 per 15 minutes per IP

Solutions:
  1. Wait for rate limit window to reset
  2. If legitimate use, contact admin for IP whitelisting
```

### KYC & Account Issues

**"KYC not verified" / "Account not approved"**
```
Flow:
  1. Register → Email verified
  2. Admin approves account (approveCustomerAccount)
  3. Submit KYC (PAN + Aadhaar)
  4. Admin reviews & verifies KYC
  5. Can now setup 2FA & open accounts

Check Status:
  GET /api/v1/auth/kyc-data/:userId
  → Returns kycStatus and accountApprovalStatus
```

**"Cannot setup 2FA" / "account is not approved"**
```
Solution: Complete full workflow
  1. Get account approved by admin
  2. Submit KYC documents
  3. Wait for KYC verification
  4. Then setup 2FA PIN
```

### Transaction Issues

**"Insufficient funds" during transfer**
```
Cause: Account balance < transfer amount
Solution: Check balance first
  GET /api/v1/accounts/{accountId}/balance
  Transfer amount must be ≤ available balance
```

**"Receiver account does not exist"**
```
Cause: Wrong account number format or account closed
Solution:
  1. Verify receiver account number is correct
  2. Check receiver account exists
  3. Receiver account status must be 'active'
```

**"Transaction PIN is temporarily locked"**
```
Cause: 3 failed PIN attempts
Solution:
  1. Check PIN is correct (4 digits)
  2. Wait 15 minutes for lockout to expire
  3. Try transfer again
```

### Notification Issues

**"Not receiving real-time notifications"**
```
Causes:
  1. Socket.IO not connected
  2. User not in correct room
  3. CORS issue with sockets

Solutions:
  1. Verify Socket.IO initialized in frontend
  2. Emit 'join' event with userId after login
  3. Check SOCKET_IO_CORS_ORIGIN in .env
  4. Check browser console for Socket.IO errors
```

### Database Issues

**"Duplicate key error"**
```
Cause: Unique field already exists
Common fields: email, customUserID, accountNumber

Solution:
  1. Check if user already registered
  2. Use different email/data
  3. If testing, drop database: db.dropDatabase()
```

**"Connection timeout"**
```
Cause: MongoDB not accessible
Solutions:
  1. Start MongoDB: mongod --dbpath /data/db
  2. Check MONGODB_URI in .env
  3. For MongoDB Atlas, check:
     - IP whitelist includes your IP
     - Password has no special chars (or URL encoded)
     - Network connectivity
```

### Performance Issues

**"Slow transaction queries"**
```
Solutions:
  1. Add database indexes:
     db.transactions.createIndex({ senderAccount: 1, createdAt: -1 })
     db.transactions.createIndex({ recieverAccount: 1, createdAt: -1 })
     
  2. Limit query results with pagination
  
  3. Use date range filters for statement queries
```

---

## Development Workflow

### Running the Server
```bash
# Development (with hot-reload)
npm run dev

# Production
npm start

# Expected output:
# Server running in development mode on port 5200
```

### Testing the API

Using cURL:
```bash
# Health check
curl http://localhost:5200/api/v1/health

# Register
curl -X POST http://localhost:5200/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# Login
curl -X POST http://localhost:5200/api/v1/auth/login-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

Using Postman:
1. Import the API collection
2. Set environment variables (baseUrl, token)
3. Call endpoints with pre-configured requests

Using Frontend:
```js
// Frontend example (React)
const response = await fetch('http://localhost:5200/api/v1/auth/login-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
});

const data = await response.json();
const token = data.data.token;
localStorage.setItem('token', token);
```

---

## Deployment Checklist

- [ ] Set NODE_ENV=production
- [ ] Configure MongoDB Atlas URI
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Generate encryption keys (32 chars for key, 16 for IV)
- [ ] Set CORS_ORIGIN for production frontend URL
- [ ] Enable HTTPS (set in Helmet config)
- [ ] Configure rate limits for production load
- [ ] Set up Winston logging to file/cloud
- [ ] Configure proper error monitoring
- [ ] Enable database backups
- [ ] Test with production-like data
- [ ] Load testing before launch
- [ ] Set up CI/CD pipeline
- [ ] Configure monitoring & alerting

---

## Support & Contributing

For issues, questions, or contributions:
1. Check troubleshooting section above
2. Review API documentation
3. Check Winston logs for errors
4. Verify .env configuration
5. Test with provided examples

---

## License

ISC License - See package.json for details

---

**Last Updated**: May 4, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
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
