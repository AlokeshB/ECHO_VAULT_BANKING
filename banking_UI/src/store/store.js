import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import accountReducer from './slices/accountSlice';
import transactionReducer from './slices/transactionSlice';
import apiStateReducer from './slices/apiStateSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    account: accountReducer,
    transaction: transactionReducer,
    apiState: apiStateReducer,
  },
});

export default store;
