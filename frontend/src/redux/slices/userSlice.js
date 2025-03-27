import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';


// Thunks to fetch data
export const fetchUserProfile = createAsyncThunk('user/fetchProfile', async (_, thunkAPI) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }
  
      const response = await axios.get('http://localhost:4000/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  });
  
  

  export const updateUserProfile = createAsyncThunk('user/updateProfile', async (userData, thunkAPI) => {
    const token = localStorage.getItem('token');
    const response = await axios.put('http://localhost:4000/user/profile', userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  });
  

  export const fetchOrders = createAsyncThunk('user/fetchOrders', async (userId, thunkAPI) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`http://localhost:4000/user/orders/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  });
  


const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: null,
    orders: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetUserState: (state) => {
      state.profile = null;
      state.orders = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

  },
});

export const { resetUserState } = userSlice.actions;

export const selectUserProfile = (state) => state.user.profile;
export const selectUserOrders = (state) => state.user.orders;
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;

export default userSlice.reducer;
