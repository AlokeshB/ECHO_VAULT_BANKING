import apiClient from './apiClient';

// Registration
export const register = async (userData) => {
  const response = await apiClient.post('/auth/register', userData);
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

// Generate mPIN
export const generateMPin = async (userId) => {
  const response = await apiClient.post('/auth/generate-mpin', { userId });
  return response.data;
};

// Verify mPIN for 2FA
export const verifyMPin = async (userId, mPin) => {
  const response = await apiClient.post('/auth/verify-mpin', { userId, mPin });
  return response.data;
};

// Request 2FA code (OTP)
export const request2FACode = async () => {
  const response = await apiClient.post('/auth/request-2fa');
  return response.data;
};

// Verify 2FA code
export const verify2FACode = async (code) => {
  const response = await apiClient.post('/auth/verify-2fa', { code });
  return response.data;
};

// Logout
export const logout = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

// Refresh token
export const refreshToken = async (refreshToken) => {
  const response = await apiClient.post('/auth/refresh-token', { refreshToken });
  return response.data;
};

// Get current user
export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

// Update user profile
export const updateUserProfile = async (userData) => {
  const response = await apiClient.put('/auth/profile', userData);
  return response.data;
};

// Submit KYC details
export const submitKYC = async (kycData) => {
  const response = await apiClient.post('/auth/kyc-submit', kycData);
  return response.data;
};

// Get KYC status
export const getKYCStatus = async () => {
  const response = await apiClient.get('/auth/kyc-status');
  return response.data;
};

// Change password
export const changePassword = async (oldPassword, newPassword) => {
  const response = await apiClient.post('/auth/change-password', {
    oldPassword,
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
