# ECHOVAULT BANKING SERVER - Complete Backend Documentation

A secure, production-ready banking backend API built with Node.js, Express, and MongoDB. ECHOVAULT Banking provides comprehensive financial transaction management with advanced security features, KYC verification, and multi-role access control.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Prerequisites](#prerequisites)
5. [Installation & Setup](#installation--setup)
6. [Environment Configuration](#environment-configuration)
7. [Database Schema](#database-schema)
8. [API Endpoints Documentation](#api-endpoints-documentation)
9. [Authentication & Authorization](#authentication--authorization)
10. [Error Handling](#error-handling)
11. [Security Features](#security-features)
12. [Testing Guide](#testing-guide-with-postman)
13. [Project Structure](#project-structure)
14. [Troubleshooting](#troubleshooting)

---

## Overview

**ECHOVAULT Banking Server** is a REST API backend that implements a complete banking system with the following capabilities:

- **User Management**: Registration, email verification, account approval workflow
- **KYC Verification**: Document submission and admin review process
- **Account Management**: Multiple account types (Savings, Checking, Business)
- **Transactions**: Fund transfers with PIN-based security
- **Security**: JWT authentication, rate limiting, encryption, audit logging
- **Real-time Notifications**: Socket.IO integration for transaction updates
- **Admin Dashboard**: Admin approval and KYC review endpoints

**Server Port**: 5200 (configurable via `.env` file)
**Base URL**: `http://localhost:5200/api/v1`
**API Version**: v1

---

## Features

### ✅ Core Features
- ✓ User registration and email verification
- ✓ Multi-factor authentication with OTP
- ✓ Custom User ID generation (VBANK XXXX format)
- ✓ KYC document submission and verification
- ✓ Multiple account types support
- ✓ Fund transfer between accounts
- ✓ Transaction history and statements
- ✓ Account freeze/unfreeze functionality
- ✓ Account closure with verification
- ✓ Real-time transaction notifications

### 🔒 Security Features
- JWT-based authentication
- Rate limiting (Global, Auth, Transfer)
- Encryption of sensitive data (PAN, Aadhaar)
- CORS protection
- Helmet.js security headers
- XSS attack prevention
- MongoDB injection prevention
- HPP (HTTP Parameter Pollution) protection
- Request validation with Joi
- Audit logging for all transactions
- Transaction PIN verification

### 📊 Audit & Logging
- Comprehensive audit trail
- IP address tracking
- User agent logging
- Geolocation tracking
- Device fingerprinting
- Request/response logging

---

## Tech Stack

```
Backend Framework:      Node.js + Express.js (v5.2.1)
Database:               MongoDB (v9.5.0) with Mongoose
Authentication:         Passport.js + JWT (jsonwebtoken v9.0.3)
Validation:             Joi (v18.1.2)
Data Encryption:        crypto (AES-256-GCM)
Email Service:          Nodemailer (v8.0.5)
Real-time Socket:       Socket.IO (v4.8.3)
Logging:                Winston (v3.19.0)
HTTP Security:          Helmet (v8.1.0), CORS, HPP
Rate Limiting:          express-rate-limit (v8.4.0)
Authentication Caching: Passport-local (v1.0.0)
Dev Tools:              Nodemon (v3.1.14)
```

---

## Prerequisites

Before running the server, ensure you have:

- **Node.js**: v16.0.0 or higher
- **npm**: v7.0.0 or higher
- **MongoDB**: v4.4.0 or higher (local or Atlas)
- **Git**: for version control
- **Postman**: for testing API endpoints (optional but recommended)
- **Mailtrap Account**: for email testing (or any SMTP service)

### Check Installation

```bash
node --version     # Should be v16+
npm --version      # Should be v7+
mongod --version   # Should be v4.4+
```

---

## Installation & Setup

### Step 1: Clone the Repository

```bash
cd Desktop
git clone https://github.com/yourusername/echovault-banking.git
cd echovault-banking/banking_server
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all packages listed in `package.json` including:
- Express and middleware
- MongoDB driver and Mongoose
- Authentication libraries
- Security packages
- Email service
- Development tools

### Step 3: Configure Environment Variables

Create a `.env` file in the root `banking_server` directory:

```bash
cp .env.example .env
```

Or manually create `.env` with required variables (see next section).

### Step 4: Start MongoDB

#### Option A: Local MongoDB

```bash
# On Windows
mongod

# On macOS (if installed via Homebrew)
brew services start mongodb-community

# On Linux
sudo systemctl start mongod
```

#### Option B: MongoDB Atlas Cloud

Use cloud MongoDB and set `DB_URI` in `.env` to your Atlas connection string.

### Step 5: Run the Server

#### Development Mode (with auto-reload):

```bash
npm run dev
```

#### Production Mode:

```bash
npm start
```

### Expected Output

```
[nodemon] 3.1.14
[nodemon] watching path(s): *.*
[nodemon] starting `node server.js`
◇ injected env (28) from .env
info: MongoDB Connected: localhost
Server running in development mode on port 5200
```

---

## Environment Configuration

### Complete `.env` File Setup

```env
# ============================================
# 1. APPLICATION ENVIRONMENT
# ============================================

NODE_ENV=development
# Options: development | staging | production

PORT=5200
# Server port (adjust if 5200 is already in use)

# ============================================
# 2. DATABASE CONFIGURATION
# ============================================

DB_URI=mongodb://localhost:27017/echovault_banking
# Local MongoDB: mongodb://localhost:27017/echovault_banking
# MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/echovault_banking?retryWrites=true&w=majority

# ============================================
# 3. AUTHENTICATION & JWT
# ============================================

JWT_SECRET=258a36635d9d5be575bd3e46b95469d0dcfadc5629c5172f405f3700a96a71e4
# Generate 32-byte hex string using:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

JWT_EXPIRE=7d
# Token expiration: 7d (7 days) | 24h (24 hours) | 30 (30 seconds)

# ============================================
# 4. EMAIL CONFIGURATION (SMTP)
# ============================================

EMAIL_HOST=sandbox.smtp.mailtrap.io
# SMTP Server: smtp.gmail.com | smtp.office365.com | sandbox.smtp.mailtrap.io

EMAIL_PORT=2525
# Port: 587 (TLS) | 465 (SSL) | 2525 (Mailtrap)

EMAIL_USER=your-email@gmail.com
# SMTP username/email

EMAIL_PASS=your-app-password
# SMTP password or app-specific password

# ============================================
# 5. ENCRYPTION CONFIGURATION
# ============================================

ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
# 64-character hex string (256-bit key)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ============================================
# 6. CORS CONFIGURATION
# ============================================

CORS_ORIGIN=http://localhost:3000
# Frontend URL for CORS policy

# ============================================
# 7. LOGGING CONFIGURATION
# ============================================

LOG_LEVEL=info
# Options: error | warn | info | debug | verbose
```

### How to Generate Secret Keys

```bash
# Generate JWT_SECRET (run in terminal)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output: 258a36635d9d5be575bd3e46b95469d0dcfadc5629c5172f405f3700a96a71e4
```

---

## Database Schema

### 1. User Model

```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique),
  password: String (required, hashed with bcrypt),
  customUserID: String (unique, format: VBANK-XXXX),
  role: Enum ['customer', 'admin', 'support'] (default: 'customer'),
  
  // Email Verification
  isEmailVerified: Boolean (default: false),
  emailVerificationToken: String,
  
  // Account Status
  accountApprovalStatus: Enum ['pending', 'approved', 'rejected'],
  
  // KYC Information
  kycStatus: Enum ['pending', 'verified', 'rejected'],
  kycData: {
    panNumber: String (encrypted, unique),
    aadhaarNumber: String (encrypted, unique),
    submittedAt: Date,
    verifiedAt: Date,
    rejectionReason: String
  },
  
  // Security
  transactionPin: String (hashed),
  transactionPinAttempts: Number (default: 0),
  transactionPinLockedUntil: Date,
  
  // OTP
  otp: String (hashed),
  otpExpires: Date,
  
  // 2FA
  twoFactorEnabled: Boolean (default: false),
  twoFactorSecret: String,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Account Model

```javascript
{
  user: ObjectId (ref: 'User'),
  accountNumber: String (required, unique, auto-generated),
  accountType: Enum ['savings', 'checking', 'business'],
  
  // Financial Data
  balance: Decimal128 (default: 0.00),
  currency: String (default: 'INR'),
  
  // Status
  status: Enum ['active', 'frozen', 'closed'],
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Transaction Model

```javascript
{
  transactionReference: String (required, unique),
  senderAccount: ObjectId (ref: 'Account'),
  receiverAccount: ObjectId (ref: 'Account'),
  
  // Transaction Details
  amount: Decimal128,
  type: Enum ['transfer', 'deposit', 'withdrawal', 'reversal'],
  status: Enum ['pending', 'completed', 'failed', 'reversed'],
  description: String,
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    location: String,
    deviceId: String
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Audit Log Model

```javascript
{
  user: ObjectId (ref: 'User'),
  action: String (e.g., 'LOGIN', 'TRANSFER', 'KYC_SUBMISSION'),
  message: String,
  resource: String,
  resourceId: ObjectId,
  
  // Request Context
  ipAddress: String,
  userAgent: String,
  location: String,
  deviceId: String,
  
  // Additional Details
  details: Object,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints Documentation

### Base URL
```
http://localhost:5200/api/v1
```

---

## AUTHENTICATION ENDPOINTS

### 1. User Registration (Public)

**Endpoint:** `POST /auth/register`

**Description:** User self-registration with email verification

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

**Validation Rules:**
```javascript
firstName: String, min 2 characters, max 50 characters
lastName: String, min 2 characters, max 50 characters
email: Valid email format
password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "john@example.com"
  },
  "message": "Registration successful. Please check your email for the OTP to verify your account.",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

**Error Response (400/409):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email already registered. Please log in or use a different email."
  },
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

### 2. Verify Email with OTP

**Endpoint:** `POST /auth/verify-email`

**Description:** Verify email address using OTP sent to registered email

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "customUserID": "VBANK1234",
    "email": "john@example.com",
    "isEmailVerified": true
  },
  "message": "Email verified successfully. You can now proceed with KYC submission.",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

**Error Response (400/401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_OTP",
    "message": "Invalid or expired OTP. Please request a new OTP."
  },
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

### 3. Login with Email

**Endpoint:** `POST /auth/login-email`

**Description:** Authenticate user using email and password

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer",
      "kycStatus": "pending",
      "accountApprovalStatus": "pending"
    }
  },
  "message": "Login successful",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

**Error Response (401/403):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  },
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

### 4. Login with Custom User ID

**Endpoint:** `POST /auth/login-userid`

**Description:** Authenticate user using custom VBANK ID and password

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "customUserID": "VBANK1234",
  "password": "SecurePass@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "customUserID": "VBANK1234",
      "email": "john@example.com",
      "firstName": "John",
      "role": "customer"
    }
  },
  "message": "Login successful",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

### 5. Submit KYC Documents

**Endpoint:** `POST /auth/submit-kyc`

**Description:** Customer submits KYC documents for verification

**Authentication:** Required (JWT Token in Authorization header)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "panNumber": "ABCDE1234F",
  "aadhaarNumber": "123456789012"
}
```

**Validation Rules:**
```javascript
panNumber: 10-character alphanumeric, format validation
aadhaarNumber: 12-digit string, format validation
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "kycStatus": "pending",
    "submittedAt": "2026-04-24T10:30:00Z"
  },
  "message": "KYC documents submitted successfully. Please wait for admin verification.",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

**Error Response (400/401/409):**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_KYC",
    "message": "PAN Number already exists in our system."
  },
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

### 6. Admin Review KYC

**Endpoint:** `PATCH /auth/admin/review-kyc/:userId`

**Description:** Admin approves or rejects KYC submission

**Authentication:** Required (Admin role)

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```

**URL Parameters:**
```
userId: MongoDB ObjectId of the user
```

**Request Body:**
```json
{
  "action": "verify",
  "rejectionReason": null
}
```

OR

```json
{
  "action": "reject",
  "rejectionReason": "Invalid PAN format"
}
```

**Valid Actions:** `verify`, `verified`, `reject`, `rejected`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "kycStatus": "verified",
    "verifiedAt": "2026-04-24T10:30:00Z"
  },
  "message": "KYC verification completed successfully.",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

### 7. Setup Transaction PIN

**Endpoint:** `POST /auth/setup-transaction-pin`

**Description:** User sets up 4-digit PIN for transaction authorization (only after KYC verified)

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "transactionPin": "1234"
}
```

**Validation Rules:**
```javascript
transactionPin: Exactly 4 digits (0000-9999)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "pinSetup": true,
    "setupAt": "2026-04-24T10:30:00Z"
  },
  "message": "Transaction PIN set up successfully.",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

### 8. Change Password

**Endpoint:** `PATCH /auth/change-password`

**Description:** User changes password with OTP verification

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@456",
  "confirmPassword": "NewPass@456",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully.",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

### 9. Admin Approve Account

**Endpoint:** `PATCH /auth/admin/approve-account/:userId`

**Description:** Admin approves customer account for transaction

**Authentication:** Required (Admin role)

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```

**URL Parameters:**
```
userId: MongoDB ObjectId of the user
```

**Request Body:**
```json
{
  "approvalNotes": "Account approved - All documents verified"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "accountApprovalStatus": "approved",
    "approvedAt": "2026-04-24T10:30:00Z"
  },
  "message": "Account approved successfully.",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

## ACCOUNT ENDPOINTS

### 1. Get All User Accounts

**Endpoint:** `GET /accounts`

**Description:** Fetch all accounts for authenticated user

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "accountNumber": "ACC001234567",
      "accountType": "savings",
      "balance": 5000.00,
      "currency": "INR",
      "status": "active",
      "createdAt": "2026-04-24T10:30:00Z"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "accountNumber": "ACC001234568",
      "accountType": "checking",
      "balance": 10000.00,
      "currency": "INR",
      "status": "active",
      "createdAt": "2026-04-24T11:30:00Z"
    }
  ],
  "message": "Accounts fetched successfully",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

### 2. Get Account Balance

**Endpoint:** `GET /accounts/:accountId/balance`

**Description:** Fetch current account balance and account details

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
```
accountId: MongoDB ObjectId of the account
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accountId": "507f1f77bcf86cd799439011",
    "accountNumber": "ACC001234567",
    "accountType": "savings",
    "balance": 5000.00,
    "currency": "INR",
    "status": "active",
    "lastUpdated": "2026-04-24T10:30:00Z"
  },
  "message": "Account balance fetched successfully",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

### 3. Get Account Details

**Endpoint:** `GET /accounts/:accountId/details`

**Description:** Fetch complete account details including holder information

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
```
accountId: MongoDB ObjectId of the account
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accountId": "507f1f77bcf86cd799439011",
    "accountNumber": "ACC001234567",
    "accountType": "savings",
    "holder": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "balance": 5000.00,
    "currency": "INR",
    "status": "active",
    "createdAt": "2026-04-24T10:30:00Z"
  },
  "message": "Account details fetched successfully",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

### 4. Get Transaction History

**Endpoint:** `GET /accounts/:accountId/transactions`

**Description:** Fetch paginated transaction history for the account

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
```
accountId: MongoDB ObjectId of the account
```

**Query Parameters:**
```
page: Page number (default: 1)
limit: Records per page (default: 10, max: 50)
startDate: ISO 8601 date (e.g., 2026-04-01)
endDate: ISO 8601 date (e.g., 2026-04-30)
type: Transaction type (transfer|deposit|withdrawal|reversal)
status: Transaction status (pending|completed|failed|reversed)
```

**Example Request:**
```
GET /accounts/507f1f77bcf86cd799439011/transactions?page=1&limit=10&status=completed
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "507f1f77bcf86cd799439020",
        "transactionReference": "TXN202604240001",
        "senderAccount": "ACC001234567",
        "receiverAccount": "ACC001234568",
        "amount": 500.00,
        "type": "transfer",
        "status": "completed",
        "description": "Payment for groceries",
        "createdAt": "2026-04-24T10:15:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 45,
      "recordsPerPage": 10
    }
  },
  "message": "Transaction history fetched successfully",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

### 5. Get Account Statement

**Endpoint:** `GET /accounts/:accountId/statement`

**Description:** Generate account statement for a specific month or year

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
```
accountId: MongoDB ObjectId of the account
```

**Query Parameters:**
```
month: YYYY-MM format (e.g., 2026-04)
year: YYYY format (e.g., 2026)
format: json | pdf (default: json)
```

**Example Request:**
```
GET /accounts/507f1f77bcf86cd799439011/statement?month=2026-04
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "statementPeriod": "April 2026",
    "account": {
      "accountNumber": "ACC001234567",
      "accountType": "savings",
      "holder": "John Doe"
    },
    "openingBalance": 4500.00,
    "closingBalance": 5000.00,
    "totalDebits": 2000.00,
    "totalCredits": 2500.00,
    "transactions": [
      {
        "date": "2026-04-24",
        "description": "Transfer to ACC001234568",
        "debit": 500.00,
        "credit": 0,
        "balance": 4500.00,
        "reference": "TXN202604240001"
      }
    ]
  },
  "message": "Account statement generated successfully",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

### 6. Open New Account

**Endpoint:** `POST /accounts/open-account`

**Description:** Open a new account (user must be KYC verified and account approved)

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "accountType": "savings",
  "initialBalance": 1000.00
}
```

**Validation Rules:**
```javascript
accountType: Enum ['savings', 'checking', 'business']
initialBalance: Number, minimum 0, optional
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "accountId": "507f1f77bcf86cd799439015",
    "accountNumber": "ACC001234575",
    "accountType": "savings",
    "balance": 1000.00,
    "currency": "INR",
    "status": "active",
    "createdAt": "2026-04-24T10:30:00Z"
  },
  "message": "Account opened successfully",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

**Error Response (400/403):**
```json
{
  "success": false,
  "error": {
    "code": "KYC_NOT_VERIFIED",
    "message": "KYC verification is required to open a new account."
  },
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

### 7. Freeze Account

**Endpoint:** `POST /accounts/:accountId/freeze`

**Description:** Freeze account to temporarily disable transactions

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**URL Parameters:**
```
accountId: MongoDB ObjectId of the account
```

**Request Body:**
```json
{
  "reason": "Account temporarily frozen for security investigation"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accountId": "507f1f77bcf86cd799439011",
    "status": "frozen",
    "frozenAt": "2026-04-24T10:30:00Z",
    "reason": "Account temporarily frozen for security investigation"
  },
  "message": "Account frozen successfully",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

### 8. Unfreeze Account

**Endpoint:** `POST /accounts/:accountId/unfreeze`

**Description:** Unfreeze a frozen account (Admin or verified Account Owner)

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**URL Parameters:**
```
accountId: MongoDB ObjectId of the account
```

**Request Body:**
```json
{
  "reason": "Issue resolved, account can be unfrozen",
  "verificationCode": "ABC123" // Optional, for non-admin users
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accountId": "507f1f77bcf86cd799439011",
    "status": "active",
    "unfrozenAt": "2026-04-24T10:30:00Z"
  },
  "message": "Account unfrozen successfully",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

### 9. Close Account

**Endpoint:** `POST /accounts/:accountId/close`

**Description:** Permanently close an account (irreversible action)

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**URL Parameters:**
```
accountId: MongoDB ObjectId of the account
```

**Request Body:**
```json
{
  "reason": "No longer needed",
  "password": "SecurePass@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accountId": "507f1f77bcf86cd799439011",
    "status": "closed",
    "closedAt": "2026-04-24T10:30:00Z"
  },
  "message": "Account closed successfully. This action is irreversible.",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

## TRANSACTION ENDPOINTS

### 1. Transfer Funds

**Endpoint:** `POST /transactions/transfer`

**Description:** Initiate a fund transfer between accounts

**Authentication:** Required (JWT Token)

**Rate Limit:** 10 requests per 15 minutes

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "senderAccountNumber": "ACC001234567",
  "receiverAccountNumber": "ACC001234568",
  "amount": 500.00,
  "description": "Payment for services",
  "transactionPin": "1234"
}
```

**Validation Rules:**
```javascript
senderAccountNumber: String, must be valid account
receiverAccountNumber: String, must be valid account (different from sender)
amount: Number, greater than 0, not more than account balance
description: String, max 200 characters
transactionPin: 4 digits, must match user's set PIN
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "transactionId": "507f1f77bcf86cd799439030",
    "transactionReference": "TXN202604240001",
    "senderAccount": "ACC001234567",
    "receiverAccount": "ACC001234568",
    "amount": 500.00,
    "type": "transfer",
    "status": "completed",
    "timestamp": "2026-04-24T10:30:00Z",
    "senderNewBalance": 4500.00,
    "receiverNewBalance": 10500.00
  },
  "message": "Funds transferred successfully",
  "timestamp": "2026-04-24T10:30:00Z"
}
```

**Error Response (400/401/429):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PIN",
    "message": "Invalid transaction PIN (Attempt 1/3)"
  },
  "timestamp": "2026-04-24T10:30:00Z"
}
```

---

### Error Scenarios for Transfers:

1. **Invalid PIN** (3 attempts allowed, 15-minute lockout):
```json
{
  "success": false,
  "error": {
    "code": "LOCKED_PIN",
    "message": "Too many failed PIN attempts. Transaction temporarily locked for 15 minutes."
  }
}
```

2. **Insufficient Balance**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient balance for this transaction"
  }
}
```

3. **Rate Limit Exceeded**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT",
    "message": "Too many transfer attempts, for your security, please try again after 15 minutes"
  }
}
```

---

## Authentication & Authorization

### JWT Token Structure

The JWT token returned after login contains:

```javascript
{
  "id": "507f1f77bcf86cd799439011",  // User ID
  "iat": 1703000000,                   // Issued At
  "exp": 1703604000                    // Expiration Time (7 days later)
}
```

### How to Use JWT Token

1. **Include in Authorization Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. **Token Validation Flow:**
   - Client sends request with token in Authorization header
   - Server validates token signature using JWT_SECRET
   - Server checks token expiration
   - If valid, request proceeds; if invalid, returns 401 Unauthorized

### Role-Based Access Control (RBAC)

```javascript
Roles Available:
- customer: Regular users who can manage accounts and transactions
- admin: Can approve accounts, review KYC, manage users
- support: Customer support representatives

Access Matrix:
┌──────────────────────┬──────────┬─────────┬─────────┐
│ Endpoint             │ Customer │ Admin   │ Support │
├──────────────────────┼──────────┼─────────┼─────────┤
│ GET /accounts        │ ✓        │ ✗       │ ✗       │
│ POST /accounts/open  │ ✓        │ ✗       │ ✗       │
│ POST /transactions   │ ✓        │ ✗       │ ✗       │
│ PATCH /auth/review   │ ✗        │ ✓       │ ✗       │
│ PATCH /auth/approve  │ ✗        │ ✓       │ ✗       │
└──────────────────────┴──────────┴─────────┴─────────┘
```

---

## Error Handling

### Error Response Format

All error responses follow this standard format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Optional additional details"
  },
  "timestamp": "2026-04-24T10:30:00Z"
}
```

### HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | OK | Successful GET, PATCH request |
| 201 | Created | Successful POST request (resource created) |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (email, PAN, etc.) |
| 415 | Unsupported Media Type | Wrong Content-Type header |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

### Common Error Codes

```javascript
VALIDATION_ERROR       // Input validation failed
INVALID_CREDENTIALS    // Wrong email/password
UNAUTHORIZED          // Missing/invalid token
FORBIDDEN_ACCESS      // User doesn't have permission
RESOURCE_NOT_FOUND    // Record doesn't exist
DUPLICATE_RESOURCE    // Email/PAN already exists
RATE_LIMIT_EXCEEDED   // Too many requests
INVALID_OTP           // Wrong OTP code
INVALID_PIN           // Wrong transaction PIN
LOCKED_PIN            // Too many PIN attempts
INSUFFICIENT_BALANCE  // Not enough money
ACCOUNT_FROZEN        // Account is frozen
KYC_NOT_VERIFIED      // KYC not completed
SERVER_ERROR          // Internal server error
```

---

## Security Features

### 1. JWT Authentication
- Tokens signed with HS256 algorithm
- 7-day expiration by default
- Token refresh: Client must login again after expiration
- Automatic token validation on protected routes

### 2. Rate Limiting

```javascript
Global Rate Limiter:       100 requests per 15 minutes
Auth Rate Limiter:         5 requests per 15 minutes
Transfer Rate Limiter:     10 requests per 15 minutes
```

Implementation prevents:
- Brute force attacks
- DoS attacks
- Spam

### 3. Password Security

```javascript
Requirements:
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)

Hashing:
- Algorithm: bcrypt
- Rounds: 12 (salting)
- Never stored in plain text
- Passwords are never returned in API responses
```

### 4. Data Encryption

```javascript
Encrypted Fields:
- PAN Number: Encrypted using AES-256-GCM
- Aadhaar Number: Encrypted using AES-256-GCM
- Transaction PIN: Hashed using bcrypt (one-way)

Encryption Details:
- Algorithm: AES-256-GCM (Advanced Encryption Standard)
- Key Size: 256 bits (32 bytes)
- IV (Initialization Vector): Random 16 bytes
- Authentication Tag: Ensures data integrity
```

### 5. Middleware Security

```javascript
CORS Protection:
- Whitelist specific frontend origins
- Only allow listed methods: GET, POST, PUT, PATCH, DELETE

Helmet.js:
- Content Security Policy headers
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing prevention)

XSS Protection:
- Input sanitization
- Output encoding
- XSS-Clean middleware

NoSQL Injection Prevention:
- Mongoose schema validation
- Input type checking
- MongoDB injection sanitization

HPP (HTTP Parameter Pollution):
- Filters suspicious parameter patterns
```

### 6. Audit Logging

Every transaction is logged with:
- User ID and email
- IP Address (geolocation)
- User Agent (browser/device info)
- Request method and path
- Timestamp
- Action details

### 7. OTP Verification

```javascript
OTP Properties:
- Length: 6 digits
- Expiration: 10 minutes
- Hashing: SHA-256 (one-way hash)
- Rate limit: 5 attempts per 15 minutes
- Cannot reuse: New OTP invalidates old ones
```

### 8. Transaction PIN

```javascript
PIN Properties:
- Length: Exactly 4 digits (0000-9999)
- Hashing: bcrypt (one-way)
- Storage: One hash per user
- Attempts: 3 attempts allowed
- Lockout: 15 minutes after 3 failed attempts
- Never transmitted over network
```

---

## Testing Guide with Postman

### Setup Postman Collection

1. **Create New Collection**: "ECHOVAULT Banking API"

2. **Set Base URL (Pre-script)**:
```javascript
// In collection Pre-request Script:
pm.environment.set("baseUrl", "http://localhost:5200/api/v1");
pm.environment.set("token", "");
```

3. **Environment Variables**:
```json
{
  "baseUrl": "http://localhost:5200/api/v1",
  "adminToken": "",
  "customerToken": "",
  "email": "test@example.com",
  "password": "TestPass@123",
  "userId": "",
  "accountId": ""
}
```

---

### Test Scenarios

#### Scenario 1: Complete User Registration & Verification Flow

**Step 1.1: Register New User**
```
POST {{baseUrl}}/auth/register

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "TestPass@123"
}

Expected Response: 201 Created
Response Script (save userId and email):
pm.environment.set("userId", pm.response.json().data.userId);
pm.environment.set("email", pm.response.json().data.email);
```

**Step 1.2: Verify Email with OTP**
```
POST {{baseUrl}}/auth/verify-email

{
  "email": "john@example.com",
  "otp": "123456"  // Use the OTP from email
}

Expected Response: 200 OK
Response Script:
pm.environment.set("customerToken", pm.response.json().data.token);
```

---

#### Scenario 2: Submit and Verify KYC

**Step 2.1: Submit KYC Documentation**
```
POST {{baseUrl}}/auth/submit-kyc
Authorization: Bearer {{customerToken}}

{
  "panNumber": "ABCDE1234F",
  "aadhaarNumber": "123456789012"
}

Expected Response: 200 OK
```

**Step 2.2: Admin Reviews KYC** (Admin Account Required)
```
PATCH {{baseUrl}}/auth/admin/review-kyc/{{userId}}
Authorization: Bearer {{adminToken}}

{
  "action": "verify",
  "rejectionReason": null
}

Expected Response: 200 OK
```

**Step 2.3: Admin Approves Account**
```
PATCH {{baseUrl}}/auth/admin/approve-account/{{userId}}
Authorization: Bearer {{adminToken}}

{
  "approvalNotes": "All documents verified"
}

Expected Response: 200 OK
```

---

#### Scenario 3: Account Management

**Step 3.1: Setup Transaction PIN**
```
POST {{baseUrl}}/auth/setup-transaction-pin
Authorization: Bearer {{customerToken}}

{
  "transactionPin": "1234"
}

Expected Response: 200 OK
```

**Step 3.2: Open New Account**
```
POST {{baseUrl}}/accounts/open-account
Authorization: Bearer {{customerToken}}

{
  "accountType": "savings",
  "initialBalance": 5000
}

Expected Response: 201 Created
Response Script:
pm.environment.set("accountId", pm.response.json().data.accountId);
```

**Step 3.3: Get Account Balance**
```
GET {{baseUrl}}/accounts/{{accountId}}/balance
Authorization: Bearer {{customerToken}}

Expected Response: 200 OK
```

**Step 3.4: Get All Accounts**
```
GET {{baseUrl}}/accounts
Authorization: Bearer {{customerToken}}

Expected Response: 200 OK
```

---

#### Scenario 4: Transaction Testing

**Step 4.1: Create Second Account for Transfer**
```
POST {{baseUrl}}/accounts/open-account
Authorization: Bearer {{customerToken}}

{
  "accountType": "checking",
  "initialBalance": 10000
}

Expected Response: 201 Created
Response Script:
pm.environment.set("accountId2", pm.response.json().data.accountId);
```

**Step 4.2: Transfer Funds**
```
POST {{baseUrl}}/transactions/transfer
Authorization: Bearer {{customerToken}}

{
  "senderAccountNumber": "ACC001234567",
  "receiverAccountNumber": "ACC001234568",
  "amount": 500,
  "description": "Payment for services",
  "transactionPin": "1234"
}

Expected Response: 201 Created
```

**Step 4.3: Get Transaction History**
```
GET {{baseUrl}}/accounts/{{accountId}}/transactions?page=1&limit=10
Authorization: Bearer {{customerToken}}

Expected Response: 200 OK
```

**Step 4.4: Get Account Statement**
```
GET {{baseUrl}}/accounts/{{accountId}}/statement?month=2026-04
Authorization: Bearer {{customerToken}}

Expected Response: 200 OK
```

---

#### Scenario 5: Account Operations

**Step 5.1: Freeze Account**
```
POST {{baseUrl}}/accounts/{{accountId}}/freeze
Authorization: Bearer {{customerToken}}

{
  "reason": "Security investigation"
}

Expected Response: 200 OK
```

**Step 5.2: Unfreeze Account (Admin)**
```
POST {{baseUrl}}/accounts/{{accountId}}/unfreeze
Authorization: Bearer {{adminToken}}

{
  "reason": "Issue resolved"
}

Expected Response: 200 OK
```

**Step 5.3: Close Account**
```
POST {{baseUrl}}/accounts/{{accountId}}/close
Authorization: Bearer {{customerToken}}

{
  "reason": "No longer needed",
  "password": "TestPass@123"
}

Expected Response: 200 OK
```

---

#### Scenario 6: Error Testing

**Test Invalid Credentials**
```
POST {{baseUrl}}/auth/login-email

{
  "email": "john@example.com",
  "password": "WrongPassword"
}

Expected Response: 401 Unauthorized
```

**Test Missing Authorization Header**
```
GET {{baseUrl}}/accounts
// No Authorization header

Expected Response: 401 Unauthorized
```

**Test Rate Limiting**
```
POST {{baseUrl}}/auth/login-email
// Repeat 6+ times in rapid succession

Expected Response: 429 Too Many Requests (after 5 attempts)
```

---

### Postman Test Scripts

**For Auto-saving Tokens:**
```javascript
// In test response scripts:
if (pm.response.code === 200 || pm.response.code === 201) {
    var token = pm.response.json().data.token;
    if (token) {
        pm.environment.set("customerToken", token);
    }
}
```

**For Validation Testing:**
```javascript
// In Tests tab:
pm.test("Response status is 200", function() {
    pm.response.to.have.status(200);
});

pm.test("Response has success true", function() {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Response has data object", function() {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('object');
});
```

---

## Project Structure

```
banking_server/
│
├── src/
│   ├── config/                    # Configuration files
│   │   ├── db.js                  # MongoDB connection
│   │   ├── passport.js            # Passport strategies
│   │   └── security.js            # Security policies (CORS, Helmet, etc.)
│   │
│   ├── controllers/               # Route handlers
│   │   ├── auth.controller.js     # Auth logic (register, login, KYC)
│   │   ├── account.controller.js  # Account operations
│   │   └── transaction.controller.js  # Transaction processing
│   │
│   ├── middlewares/               # Custom middlewares
│   │   ├── auth.middleware.js     # JWT verification
│   │   ├── error.middleware.js    # Error handling
│   │   ├── audit.middleware.js    # Audit logging
│   │   ├── security.middleware.js # Security checks
│   │   └── validation.middleware.js # Request validation
│   │
│   ├── models/                    # Database schemas
│   │   ├── User.js                # User schema
│   │   ├── Account.js             # Account schema
│   │   ├── Transaction.js         # Transaction schema
│   │   └── AuditLog.js            # Audit log schema
│   │
│   ├── routes/                    # API route definitions
│   │   ├── auth.routes.js         # Auth endpoints
│   │   ├── account.routes.js      # Account endpoints
│   │   ├── transaction.routes.js  # Transaction endpoints
│   │   └── index.js               # Route aggregation
│   │
│   ├── services/                  # Business logic
│   │   ├── email.service.js       # Email sending
│   │   ├── transaction.service.js # Transaction processing
│   │   ├── ledger.service.js      # Ledger management
│   │   └── notification.service.js # Socket.IO notifications
│   │
│   ├── utils/                     # Utility functions
│   │   ├── encryption.js          # AES-256 encryption
│   │   ├── logger.js              # Logging utility
│   │   ├── response.js            # Response formatting
│   │   ├── validate.js            # Validation helpers
│   │   └── request-parser.js      # Request metadata extraction
│   │
│   ├── validations/               # Joi validation schemas
│   │   ├── auth.validation.js     # Auth request schemas
│   │   ├── account.validation.js  # Account request schemas
│   │   └── transaction.validation.js  # Transaction schemas
│   │
│   └── app.js                     # Express app setup
│
├── logs/                          # Application logs
│   └── combined.log               # Combined log file
│
├── .env                           # Environment variables
├── .gitignore                     # Git ignore rules
├── server.js                      # Entry point
├── package.json                   # Dependencies & scripts
├── package-lock.json              # Locked dependency versions
└── README.md                      # This file
```

---

## Troubleshooting

### Issue 1: MongoDB Connection Error

**Error Message:**
```
Error: Cannot connect to MongoDB at mongodb://localhost:27017
```

**Solutions:**
1. Check if MongoDB is running:
   ```bash
   # Windows
   net start MongoDB  # or mongod
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. Verify MongoDB is accessible:
   ```bash
   mongosh  # or mongo
   show databases  # should work
   ```

3. Check `DB_URI` in `.env`:
   - Local: `mongodb://localhost:27017/echovault_banking`
   - Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/echovault_banking`

---

### Issue 2: Port 5200 Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::5200
```

**Solutions:**
1. Find and kill the process:
   ```bash
   # Windows
   netstat -ano | findstr :5200
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -i :5200
   kill -9 <PID>
   ```

2. Use a different port in `.env`:
   ```env
   PORT=5201
   ```

---

### Issue 3: JWT Token Verification Failed

**Error Message:**
```
JsonWebTokenError: invalid token
```

**Solutions:**
1. Ensure token is in correct format:
   ```
   Authorization: Bearer <token_without_quotes>
   ```

2. Check token hasn't expired (7 days default)

3. Verify `JWT_SECRET` matches in `.env`

4. Re-login to get a new token

---

### Issue 4: Email Not Sending

**Error Message:**
```
Error: Invalid login: 535-5.7.8 Username and password not accepted
```

**Solutions:**
1. For Gmail:
   - Enable "Less secure app access": https://myaccount.google.com/lesssecureapps
   - Or use App Password: https://myaccount.google.com/apppasswords

2. Check Mailtrap credentials:
   - Verify `EMAIL_USER` and `EMAIL_PASS` in `.env`
   - Ensure SMTP credentials are correct

3. Verify `EMAIL_HOST` and `EMAIL_PORT`:
   - Gmail: `smtp.gmail.com:587`
   - Mailtrap: `sandbox.smtp.mailtrap.io:2525`

---

### Issue 5: Validation Errors

**Error Message:**
```
Validation error: "password" length must be at least 8 characters
```

**Solutions:**
1. Check request body against validation rules:
   - Password: Min 8 chars, 1 upper, 1 lower, 1 number, 1 special char
   - Email: Valid email format
   - PAN: 10 characters
   - Aadhaar: 12 digits

2. View validation schemas in `src/validations/`

3. Update request to match requirements

---

### Issue 6: Rate Limit Exceeded

**Error Message:**
```
{
  "success": false,
  "message": "Too many requests from this IP, please try again after 15 minutes"
}
```

**Solution:**
- Wait 15 minutes before retrying
- Or adjust rate limits in `src/config/security.js` for development

---

### Issue 7: CORS Error in Frontend

**Error Message:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**
1. Update `CORS_ORIGIN` in `.env`:
   ```env
   CORS_ORIGIN=http://localhost:3000
   ```

2. For multiple origins, modify `src/config/security.js`:
   ```javascript
   origin: ['http://localhost:3000', 'http://localhost:3001']
   ```

3. Ensure frontend sends with credentials if needed:
   ```javascript
   fetch(url, {
     credentials: 'include'
   })
   ```

---

### Issue 8: Duplicate Key Error on Creating Account

**Error Message:**
```
E11000 duplicate key error collection: echovault_banking.users index: email_1
```

**Solution:**
- Email already exists in database
- User should login instead of re-registering
- For testing: Delete user from MongoDB and retry:
  ```bash
  db.users.deleteOne({ email: "test@example.com" })
  ```

---

## Quick Reference

### Command Shortcuts

```bash
# Start development server
npm run dev

# Start production server
npm start

# Install dependencies
npm install

# Check Node version
node --version

# Connect to MongoDB
mongosh
```

### Useful MongoDB Commands

```bash
# List all databases
show databases

# Use specific database
use echovault_banking

# List all collections
show collections

# View all users
db.users.find()

# Find specific user
db.users.findOne({ email: "john@example.com" })

# Delete user
db.users.deleteOne({ email: "john@example.com" })

# View account details
db.accounts.findOne()

# View transactions
db.transactions.find().limit(10)

# Clear all data (WARNING: irreversible)
db.dropDatabase()
```

### API Response Examples Summary

| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| /auth/register | POST | 201 | User registration |
| /auth/verify-email | POST | 200 | Email verification |
| /auth/login-email | POST | 200 | Login with email |
| /auth/submit-kyc | POST | 200 | KYC submission |
| /auth/admin/review-kyc/:id | PATCH | 200 | KYC approval |
| /accounts | GET | 200 | List accounts |
| /accounts/open-account | POST | 201 | Create account |
| /transactions/transfer | POST | 201 | Fund transfer |

---

## Support and Updates

For issues, questions, or contributions:

- **GitHub**: [Repository URL]
- **Email**: support@echovault.com
- **Documentation**: Always refer to this README for latest info
- **API Versioning**: Current version is v1 (in URL path: `/api/v1`)

---

## License

This project is proprietary and confidential. Unauthorized copying or distribution is prohibited.

---

**Server Version**: 1.0.0
**Documentation Last Updated**: April 24, 2026
**Created**: 2026
