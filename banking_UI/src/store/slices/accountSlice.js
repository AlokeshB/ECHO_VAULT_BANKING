import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  accounts: [],
  selectedAccount: null,
  loading: false,
  error: null,
};

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setAccounts: (state, action) => {
      state.accounts = action.payload;
      state.error = null;
    },
    selectAccount: (state, action) => {
      state.selectedAccount = action.payload;
    },
    addAccount: (state, action) => {
      state.accounts.push(action.payload);
    },
    updateAccount: (state, action) => {
      const index = state.accounts.findIndex(
        (acc) => acc._id === action.payload._id
      );
      if (index !== -1) {
        state.accounts[index] = action.payload;
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearAccounts: (state) => {
      return initialState;
    },
  },
});

export const {
  setAccounts,
  selectAccount,
  addAccount,
  updateAccount,
  setLoading,
  setError,
  clearAccounts,
} = accountSlice.actions;

export default accountSlice.reducer;
