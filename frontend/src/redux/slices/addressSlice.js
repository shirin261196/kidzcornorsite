import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchAddresses = createAsyncThunk('user/fetchAddresses', async (_, thunkAPI) => {
  const token = localStorage.getItem('token');
  const response = await axios.get('http://localhost:4000/user/address', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
});

export const addAddress = createAsyncThunk('address/addAddress', async (addressData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post('http://localhost:4000/user/address', addressData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
});

export const updateAddress = createAsyncThunk(
  'address/updateAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      const { addressId, ...updatedData } = addressData; // Use `id` for the API call
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:4000/user/address/${addressId}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data || 'Failed to update address');
    }
  }
);

export const deleteAddress = createAsyncThunk('address/deleteAddress', async ({ addressId }, thunkAPI) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`http://localhost:4000/user/address/${addressId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return { addressId }; // Return only the id for filtering
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || error.message);
  }
});

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
