import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  id: null,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  nationality: '',
  aadharNumber: '',
  panNumber: '',
  documentVerified: false,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserData: (state, action) => {
      return { ...state, ...action.payload, error: null };
    },
    updateUserField: (state, action) => {
      const { field, value } = action.payload;
      state[field] = value;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearUser: () => {
      return initialState;
    },
  },
});

export const {
  setUserData,
  updateUserField,
  setLoading,
  setError,
  clearUser,
} = userSlice.actions;

export default userSlice.reducer;
