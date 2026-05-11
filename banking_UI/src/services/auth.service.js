import apiClient from './apiClient';

// Registration
export const register = async (userData) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};

// Verify email after registration
export const verifyEmail = async (email, otp) => {
  const response = await apiClient.post('/auth/verify-email', { email, otp });
  return response.data;
};

// Login with email/password
export const loginWithEmail = async (email, password) => {
  const response = await apiClient.post('/auth/login-email', { email, password });
  return response.data;
};

// Login with userID/password
export const loginWithUserId = async (userId, password) => {
  const response = await apiClient.post('/auth/login-userid', { userId, password });
  return response.data;
};

// Verify 2FA PIN during login
export const verify2FAPIN = async (pin) => {
  const response = await apiClient.post('/auth/verify-2fa-pin', { pin });
  return response.data;
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  const response = await apiClient.patch('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
};

// Request password reset
export const requestPasswordReset = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

// Reset password with OTP
export const resetPassword = async (email, otp, newPassword) => {
  const response = await apiClient.patch('/auth/reset-password', {
    email,
    otp,
    newPassword,
  });
  return response.data;
};

// Submit KYC details
export const submitKYC = async (kycData) => {
  const response = await apiClient.post('/auth/submit-kyc', kycData);
  return response.data;
};

// Get KYC data for admin review
export const getKYCData = async (userId) => {
  const response = await apiClient.get(`/auth/kyc-data/${userId}`);
  return response.data;
};

// Setup 2FA PIN (after KYC verified)
export const setup2FAPIN = async (pin, otp) => {
  const response = await apiClient.post('/auth/setup-2fa-pin', { pin, otp });
  return response.data;
};

// Change 2FA PIN
export const change2FAPIN = async (currentPin, newPin) => {
  const response = await apiClient.patch('/auth/change-2fa-pin', {
    currentPin,
    newPin,
  });
  return response.data;
};

// Disable 2FA
export const disable2FA = async () => {
  const response = await apiClient.patch('/auth/disable-2fa');
  return response.data;
};

// Approve customer account (admin only)
export const approveCustomerAccount = async (userId, adminMessage) => {
  const response = await apiClient.patch(`/auth/admin/approve-account/${userId}`, {
    adminMessage,
  });
  return response.data;
};

// Review KYC (admin only)
export const reviewKYC = async (userId, action, rejectionReason) => {
  const response = await apiClient.patch(`/auth/admin/review-kyc/${userId}`, {
    action,
    rejectionReason,
  });
  return response.data;
};

// Get all users (admin only)
export const getAllUsers = async (filters = {}) => {
  const response = await apiClient.get('/auth/admin/users', {
    params: filters,
  });
  return response.data;
};

// Create support user (admin only)
export const createSupportUser = async (firstName, lastName, email, password) => {
  const response = await apiClient.post('/auth/create-support', {
    firstName,
    lastName,
    email,
    password,
  });
  return response.data;
};
