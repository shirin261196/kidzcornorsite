import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';


const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.mykidzcornor.info'
  : 'http://localhost:5001'; 

export const fetchWalletBalance = createAsyncThunk(
  'wallet/fetchWalletBalance',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/user/wallet/balance/${userId}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

export const creditWallet = createAsyncThunk(
  'wallet/creditWallet',
  async ({ userId, amount }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/user/wallet/credit`, { userId, amount });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

export const debitWallet = createAsyncThunk(
  'wallet/debitWallet',
  async ({ userId, amount }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/user/wallet/debit`, { userId, amount });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    balance: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWalletBalance.fulfilled, (state, action) => {
        state.balance = action.payload.balance;
        state.loading = false;
      })
      .addCase(creditWallet.fulfilled, (state, action) => {
        state.balance += action.payload.amount;
      })
      .addCase(debitWallet.fulfilled, (state, action) => {
        state.balance -= action.payload.amount;
      })
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      );
  },
});

export const selectWalletBalance = (state) => state.wallet.balance;

export default walletSlice.reducer;
