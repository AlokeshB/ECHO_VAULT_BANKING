import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  transactions: [],
  transferStatus: null, // 'pending', 'success', 'failed', null
  transferError: null,
  loading: false,
  error: null,
  filters: {
    type: 'all', // 'all', 'transfer', 'deposit', 'withdrawal'
    dateRange: 'all', // 'all', '7days', '30days', '90days'
  },
};

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    setTransactions: (state, action) => {
      state.transactions = action.payload;
      state.error = null;
    },
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload);
    },
    setTransferStatus: (state, action) => {
      state.transferStatus = action.payload;
    },
    setTransferError: (state, action) => {
      state.transferError = action.payload;
    },
    initiateTransfer: (state) => {
      state.transferStatus = 'pending';
      state.transferError = null;
    },
    completeTransfer: (state, action) => {
      state.transferStatus = 'success';
      state.transactions.unshift(action.payload);
    },
    failTransfer: (state, action) => {
      state.transferStatus = 'failed';
      state.transferError = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearTransactions: (state) => {
      return initialState;
    },
  },
});

export const {
  setTransactions,
  addTransaction,
  setTransferStatus,
  setTransferError,
  initiateTransfer,
  completeTransfer,
  failTransfer,
  setLoading,
  setError,
  setFilters,
  clearTransactions,
} = transactionSlice.actions;

export default transactionSlice.reducer;
