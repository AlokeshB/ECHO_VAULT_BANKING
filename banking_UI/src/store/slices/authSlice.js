import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('authToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  user: null,
  role: null, // 'admin' or 'customer'
  isAuthenticated: !!localStorage.getItem('authToken'),
  twoFactorRequired: false,
  twoFactorVerified: false,
  kycVerified: false,
  mPinSet: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action) => {
      const { token, refreshToken, user, role } = action.payload;
      state.token = token;
      state.refreshToken = refreshToken;
      state.user = user;
      state.role = role;
      state.isAuthenticated = true;
      localStorage.setItem('authToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userRole', role);
    },
    setTwoFactorRequired: (state, action) => {
      state.twoFactorRequired = action.payload;
    },
    setTwoFactorVerified: (state, action) => {
      state.twoFactorVerified = action.payload;
    },
    setKycVerified: (state, action) => {
      state.kycVerified = action.payload;
      if (action.payload) {
        localStorage.setItem('kycVerified', 'true');
      }
    },
    setMPinSet: (state, action) => {
      state.mPinSet = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.role = null;
      state.isAuthenticated = false;
      state.twoFactorRequired = false;
      state.twoFactorVerified = false;
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('kycVerified');
    },
    clearTwoFactor: (state) => {
      state.twoFactorRequired = false;
      state.twoFactorVerified = false;
    },
  },
});

export const {
  setAuth,
  setTwoFactorRequired,
  setTwoFactorVerified,
  setKycVerified,
  setMPinSet,
  logout,
  clearTwoFactor,
} = authSlice.actions;

export default authSlice.reducer;
