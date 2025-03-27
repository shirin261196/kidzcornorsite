import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  items: [],
  totalPrice: 0,
  finalPrice: 0, 
  discountAmount: 0,
  totalQuantity: 0,
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
};

// Helper to calculate total price (no coupon/offer)
const calculateTotalPrice = (items) => {
  return items.reduce(
    (total, item) => total + (item.discountPrice || item.price) * item.quantity,
    0
  );
};

// Thunks for API calls
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (userId, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://localhost:4000/user/cart/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Fetch Cart Response:', response.data);
      return response.data.data || { items: [] }; // Fallback if cart is empty
    } catch (error) {
      if (error.response?.status === 404) {
        return { items: [] }; // Return empty cart if not found
      }
      console.error('Fetch Cart Error:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ userId, productId, size, quantity, images, stock, discountPrice }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        'http://localhost:4000/user/cart/add',
        { userId, productId, size, quantity, images, stock, discountPrice },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data; // Ensure the response contains the updated cart
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'Failed to add to cart');
    }
  }
);

export const updateCartItemQty = createAsyncThunk(
  'cart/updateCartItemQty',
  async ({ userId, productId, size, quantity, discountPrice }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(
        'http://localhost:4000/user/cart/update',
        { userId, productId, size, quantity, discountPrice },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data; // Ensure response contains the correct updated cart data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update cart quantity');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async ({ userId, productId, size }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.delete(
        `http://localhost:4000/user/cart/remove/${userId}/${productId}`, // No need for size in URL
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { size },  // Pass size in the request body
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'Failed to remove item from cart');
    }
  }
);

export const clearCart = createAsyncThunk('cart/clearCart', async (userId, { rejectWithValue }) => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.delete(`http://localhost:4000/user/cart/clear/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data.message || 'Failed to clear cart');
  }
});

// Slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
    resetCart: (state) => {
      state.items = [];
      state.totalPrice = 0;
      state.finalPrice = 0;
      state.totalQuantity = 0;
      state.status = 'idle';
      state.error = null;
    },
    setDiscountAmount: (state, action) => {
      state.discountAmount = action.payload;
      state.finalPrice = state.totalPrice - action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        const items = action.payload.items || [];
        console.log('Fetched cart items:', items); 
        state.items = items;
        state.totalPrice = calculateTotalPrice(items);
        state.finalPrice = action.payload.finalPrice || 0; // Set from backend response

        state.totalQuantity = items.reduce((total, item) => total + (item.quantity || 0), 0);
        state.status = 'succeeded';
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch cart';
      });

    // Add to Cart
    builder
    .addCase(addToCart.fulfilled, (state, action) => {
      if (action.payload && action.payload.items) {
        state.items = action.payload.items;
        state.totalPrice = calculateTotalPrice(action.payload.items);
        state.finalPrice = action.payload.finalPrice || state.totalPrice;
        state.totalQuantity = action.payload.items.reduce(
          (total, item) => total + item.quantity,
          0
        );
      } else {
        state.error = 'Error adding to cart. Data is malformed.';
      }
    })
  
      .addCase(addToCart.rejected, (state, action) => {
        state.error = action.payload || 'Failed to add to cart';
      });

    // Update Cart Item Quantity
    builder
      .addCase(updateCartItemQty.fulfilled, (state, action) => {
        if (action.payload && action.payload.items) {
          state.items = action.payload.items;
          state.totalPrice = calculateTotalPrice(action.payload.items);
          state.finalPrice = action.payload.finalPrice || state.totalPrice;
          state.totalQuantity = action.payload.totalQuantity || 0;
        } else {
          state.error = 'Error updating cart quantity. Data is malformed.';
        }
      })
      .addCase(updateCartItemQty.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update cart quantity';
      });

    // Remove from Cart
    builder
      .addCase(removeFromCart.fulfilled, (state, action) => {
        if (action.payload && action.payload.items) {
          state.items = action.payload.items;
          state.totalPrice = isNaN(action.payload.totalPrice) ? 0 : action.payload.totalPrice;
          state.finalPrice = action.payload.finalPrice || state.totalPrice; 
          state.totalQuantity = action.payload.totalQuantity || 0;
        } else {
          state.error = 'Error removing from cart. Data is malformed.';
        }
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.error = action.payload || 'Failed to remove item from cart';
      });

    // Clear Cart
    builder.addCase(clearCart.fulfilled, (state, action) => {
      const data = action.payload?.data || {};  // Ensure data exists
      state.items = data.items || [];
      state.totalPrice = data.totalPrice || 0;
      state.finalPrice = data.finalPrice || 0;
      state.totalQuantity = data.totalQuantity || 0;
    })
    .addCase(clearCart.rejected, (state, action) => {
      state.error = action.payload || 'Failed to clear cart';
    });
    
  },
});

// Selectors
export const selectCartItems = (state) => state.cart.items || [];
export const selectTotalPrice = (state) => calculateTotalPrice(state.cart.items);
export const selectTotalQuantity = (state) => state.cart.items.reduce((total, item) => total + item.quantity, 0);
export const selectFinalPrice = (state) => state.cart.finalPrice; 
export const selectDiscountAmount = (state) => state.cart.discountAmount;
export const { setUserId, resetCart,setDiscountAmount } = cartSlice.actions;

export default cartSlice.reducer;
