import apiClient from './apiClient';

// Get all accounts for user
export const getAccounts = async () => {
  const response = await apiClient.get('/accounts');
  return response.data;
};

// Get single account details
export const getAccountById = async (accountId) => {
  const response = await apiClient.get(`/accounts/${accountId}`);
  return response.data;
};

// Get account balance
export const getAccountBalance = async (accountId) => {
  const response = await apiClient.get(`/accounts/${accountId}/balance`);
  return response.data;
};

// Create new account
export const createAccount = async (accountData) => {
  const response = await apiClient.post('/accounts', accountData);
  return response.data;
};

// Update account details
export const updateAccount = async (accountId, accountData) => {
  const response = await apiClient.put(`/accounts/${accountId}`, accountData);
  return response.data;
};

// Close account
export const closeAccount = async (accountId) => {
  const response = await apiClient.post(`/accounts/${accountId}/close`);
  return response.data;
};

// Get account statements
export const getAccountStatement = async (accountId, startDate, endDate) => {
  const response = await apiClient.get(`/accounts/${accountId}/statement`, {
    params: { startDate, endDate },
  });
  return response.data;
};

// Set up account alerts
export const setAccountAlerts = async (accountId, alertSettings) => {
  const response = await apiClient.post(`/accounts/${accountId}/alerts`, alertSettings);
  return response.data;
};

// Get account alerts
export const getAccountAlerts = async (accountId) => {
  const response = await apiClient.get(`/accounts/${accountId}/alerts`);
  return response.data;
};
