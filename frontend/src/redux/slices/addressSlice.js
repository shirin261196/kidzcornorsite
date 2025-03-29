import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Define the base URL for API calls
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.mykidzcornor.info'
  : 'http://localhost:5001'; // Use localhost for local development

export const fetchAddresses = createAsyncThunk(
  'user/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const response = await axios.get(`${API_URL}/user/address`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        return response.data.addresses || [];
      } else {
        throw new Error(response.data.message || 'Failed to fetch addresses.');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch addresses.');
    }
  }
);

export const addAddress = createAsyncThunk(
  'address/addAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const response = await axios.post(`${API_URL}/user/address`, addressData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        return response.data.address;
      } else {
        throw new Error(response.data.message || 'Failed to add address.');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add address.');
    }
  }
);

export const updateAddress = createAsyncThunk(
  'address/updateAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      const { addressId, ...updatedData } = addressData;
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const response = await axios.put(
        `${API_URL}/user/address/${addressId}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        return response.data.address;
      } else {
        throw new Error(response.data.message || 'Failed to update address.');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update address.');
    }
  }
);

export const deleteAddress = createAsyncThunk(
  'address/deleteAddress',
  async ({ addressId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const response = await axios.delete(`${API_URL}/user/address/${addressId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        return { addressId };
      } else {
        throw new Error(response.data.message || 'Failed to delete address.');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete address.');
    }
  }
);

const addressSlice = createSlice({
  name: 'address',
  initialState: {
    addresses: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetState: (state) => {
      state.addresses = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addAddress.pending, (state) => {
        state.loading = true;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses.push(action.payload);
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateAddress.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.loading = false;
        const updatedAddress = action.payload;
        const index = state.addresses.findIndex((address) => address.id === updatedAddress.id); // Use `id` consistently
        if (index >= 0) {
          state.addresses[index] = updatedAddress; // Replace the old address
        }
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message; // Capture error for debugging
      })
      .addCase(deleteAddress.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.loading = false;
        const { addressId } = action.payload;
        state.addresses = state.addresses.filter((address) => address._id !== addressId); // Use `id` for filtering
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { resetState } = addressSlice.actions;

export const selectAddresses = (state) => state.address.addresses;
export const selectLoading = (state) => state.address.loading;
export const selectError = (state) => state.address.error;

export default addressSlice.reducer;
