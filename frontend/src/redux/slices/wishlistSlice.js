import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';


const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.mykidzcornor.info'
  : 'http://localhost:5001'; 

// Fetch wishlist items for a specific user
export const fetchWishlist = createAsyncThunk('wishlist/fetchWishlist', async (userId, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URL}/user/wishlist/${userId}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

// Add an item to the wishlist
export const addToWishlist = createAsyncThunk('wishlist/addToWishlist', async (item, thunkAPI) => {
  try {
    const response = await axios.post(`${API_URL}/user/wishlist/add`, item);
    console.log(response.data.wishlist)
    return response.data.wishlist;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

// Remove an item from the wishlist
export const removeFromWishlist = createAsyncThunk('wishlist/removeFromWishlist', async (item, thunkAPI) => {
  try {
    const response = await axios.delete(`${API_URL}/user/wishlist/remove`, { data: item });
    return response.data.wishlist;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearWishlist: (state) => {
      state.items = [];
    },
    setWishlist: (state, action) => {
        state.items = action.payload; // Sets the wishlist items
      },
    },
  extraReducers: (builder) => {
    builder
      // Fetch wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch wishlist';
      })
      // Add to wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add item to wishlist';
      })
      // Remove from wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to remove item from wishlist';
      });
  },
});

export const { clearWishlist ,setWishlist} = wishlistSlice.actions;

export const selectWishlistItems = (state) => state.wishlist.items;
export const selectWishlistLoading = (state) => state.wishlist.loading;
export const selectWishlistError = (state) => state.wishlist.error;

export default wishlistSlice.reducer;
