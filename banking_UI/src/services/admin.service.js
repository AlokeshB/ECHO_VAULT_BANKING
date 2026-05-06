import apiClient from './apiClient';

// Get all users for admin
export const getAllUsers = async (page, limit, filters = {}) => {
  const response = await apiClient.get('/admin/users', {
    params: { page, limit, ...filters },
  });
  return response.data;
};

// Get user details
export const getUserDetails = async (userId) => {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return response.data;
};

// Get user accounts
export const getUserAccounts = async (userId) => {
  const response = await apiClient.get(`/admin/users/${userId}/accounts`);
  return response.data;
};

// Get user transactions
export const getUserTransactions = async (userId) => {
  const response = await apiClient.get(`/admin/users/${userId}/transactions`);
  return response.data;
};

// Get audit logs
export const getAuditLogs = async (page, limit, filters = {}) => {
  const response = await apiClient.get('/admin/audit-logs', {
    params: { page, limit, ...filters },
  });
  return response.data;
};

// Get system statistics
export const getSystemStats = async () => {
  const response = await apiClient.get('/admin/statistics');
  return response.data;
};

// Get transaction details for admin
export const getTransactionDetails = async (transactionId) => {
  const response = await apiClient.get(`/admin/transactions/${transactionId}`);
  return response.data;
};

// Approve/Reject pending transaction
export const approveTransaction = async (transactionId) => {
  const response = await apiClient.post(`/admin/transactions/${transactionId}/approve`);
  return response.data;
};

// Enable/Disable user account
export const toggleUserStatus = async (userId, status) => {
  const response = await apiClient.put(`/admin/users/${userId}/status`, { status });
  return response.data;
};

// Verify user KYC
export const verifyUserKYC = async (userId, kycData) => {
  const response = await apiClient.post(`/admin/users/${userId}/verify-kyc`, kycData);
  return response.data;
};

// Reject user KYC
export const rejectUserKYC = async (userId, reason) => {
  const response = await apiClient.post(`/admin/users/${userId}/reject-kyc`, { reason });
  return response.data;
};

// Send notification to user
export const sendNotificationToUser = async (userId, message) => {
  const response = await apiClient.post(`/admin/send-notification`, {
    userId,
    message,
  });
  return response.data;
};

// Download audit report
export const downloadAuditReport = async (filters = {}) => {
  const response = await apiClient.get('/admin/audit-logs/export', {
    params: filters,
    responseType: 'blob',
  });
  return response.data;
};

// Get dashboard metrics
export const getDashboardMetrics = async () => {
  const response = await apiClient.get('/admin/dashboard/metrics');
  return response.data;
};
