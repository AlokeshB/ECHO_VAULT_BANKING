import apiClient from './apiClient';

// Get transactions for account
export const getTransactions = async (accountId, filters = {}) => {
  const response = await apiClient.get(`/transactions`, {
    params: { accountId, ...filters },
  });
  return response.data;
};

// Get single transaction
export const getTransactionById = async (transactionId) => {
  const response = await apiClient.get(`/transactions/${transactionId}`);
  return response.data;
};

// Get transaction history with pagination
export const getTransactionHistory = async (accountId, page, limit, filters = {}) => {
  const response = await apiClient.get(`/transactions/history/${accountId}`, {
    params: { page, limit, ...filters },
  });
  return response.data;
};

// Initiate transfer
export const initiateTransfer = async (transferData) => {
  const response = await apiClient.post('/transactions/transfer', transferData);
  return response.data;
};

// Verify transfer OTP
export const verifyTransferOTP = async (transferId, otp) => {
  const response = await apiClient.post(`/transactions/${transferId}/verify-otp`, { otp });
  return response.data;
};

// Cancel pending transfer
export const cancelTransfer = async (transferId) => {
  const response = await apiClient.post(`/transactions/${transferId}/cancel`);
  return response.data;
};

// Get transfer status
export const getTransferStatus = async (transferId) => {
  const response = await apiClient.get(`/transactions/${transferId}/status`);
  return response.data;
};

// Add beneficiary
export const addBeneficiary = async (beneficiaryData) => {
  const response = await apiClient.post('/transactions/beneficiary', beneficiaryData);
  return response.data;
};

// Get beneficiaries
export const getBeneficiaries = async () => {
  const response = await apiClient.get('/transactions/beneficiaries');
  return response.data;
};

// Remove beneficiary
export const removeBeneficiary = async (beneficiaryId) => {
  const response = await apiClient.delete(`/transactions/beneficiary/${beneficiaryId}`);
  return response.data;
};

// Download transaction receipt
export const downloadTransactionReceipt = async (transactionId) => {
  const response = await apiClient.get(
    `/transactions/${transactionId}/receipt`,
    {
      responseType: 'blob',
    }
  );
  return response.data;
};

// Get transaction summary
export const getTransactionSummary = async (accountId, period = '30d') => {
  const response = await apiClient.get(`/transactions/summary/${accountId}`, {
    params: { period },
  });
  return response.data;
};
