import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoading: false,
  error: null,
  success: false,
  message: '',
};

const apiStateSlice = createSlice({
  name: 'apiState',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.success = false;
    },
    setSuccess: (state, action) => {
      state.success = true;
      state.error = null;
      state.message = action.payload;
    },
    clearApiState: (state) => {
      return initialState;
    },
  },
});

export const { setLoading, setError, setSuccess, clearApiState } =
  apiStateSlice.actions;

export default apiStateSlice.reducer;
