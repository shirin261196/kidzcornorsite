import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  userId:null,
  orders: [], // User-specific orders
  walletBalance:0,
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
};

// Thunks for API calls
export const fetchOrderHistory = createAsyncThunk(
  'order/fetchOrderHistory',
  async (userId, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('http://localhost:4000/user/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data.orders; // Assuming API returns `orders` array
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order history');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'order/cancelOrder',
  async ({ orderId, itemId }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    console.log("API Request - OrderId:", orderId, "ItemId:", itemId); // Add debugging
    try {
      const response = await axios.delete(
        `http://localhost:4000/user/orders/${orderId}?itemId=${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
     
      return {
        updatedOrder: response.data.updatedOrder,
        walletBalance: response.data.walletBalance,
      };// Assuming API returns the updated order object
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel order');
    }
  }
);

export const fetchWalletBalance = createAsyncThunk(
  'order/fetchWalletBalance',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('http://localhost:4000/user/wallet/balance', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log("Wallet Balance:", response.data.walletBalance);  // Debugging line
      return response.data.walletBalance;
       // Assuming the response returns a 'balance' field
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wallet balance');
    }
  }
);



export const returnOrder = createAsyncThunk(
  'order/returnOrder',
  async ({ orderId ,itemId}, { rejectWithValue }) => {
    const token = localStorage.getItem('token'); // Retrieve token from localStorage
    if (!token) {
      return rejectWithValue('Authentication token not found');
    }
    try {
      const response = await axios.put(
        `http://localhost:4000/user/orders/${orderId}/return`,
        {itemId,orderId}, // Send an empty body if required
        {
          headers: {
            Authorization: `Bearer ${token}`, // Correct token format
          },
        }
      );
      return response.data.updatedOrder; // Assuming API returns the updated order object
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to return order');
    }
  }
);


export const handlePaymentFailure = createAsyncThunk(
  'order/handlePaymentFailure',
  async (orderId, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        'http://localhost:4000/orders/user/payment-failed',
        { orderId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Payment failure handling failed.');
    }
  }
);

export const retryPayment = createAsyncThunk(
  'order/retryPayment',
  async (orderId, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        'http://localhost:4000/orders/user/retry-payment',
        { orderId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Retrying payment failed.');
    }
  }
);



export const createOrder = createAsyncThunk(
  'order/createOrder',
  async ({ items, totalPrice, address,discountAmount, finalPrice,paymentMethod }, { rejectWithValue }) => {
    const token = localStorage.getItem('token');

    console.log("📤 Order Data Sent:", { items, totalPrice, address, discountAmount, finalPrice, paymentMethod });
    try {
      const response = await axios.post(
        `http://localhost:4000/user/orders/create`,
        { items, totalPrice, address,discountAmount,finalPrice, paymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Ensure Razorpay order details are returned for Razorpay payments
      if (paymentMethod === 'Razorpay' && response.data.razorpayOrderId) {
        return response.data; // Ensure razorpayOrderId is returned
      }
      console.log("✅ Order Response:", response.data);
      return response.data; // For other payment methods (e.g., COD)
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);



// Slice
const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    resetOrders: (state) => {
      state.orders = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Order History
    builder
      .addCase(fetchOrderHistory.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOrderHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.orders = action.payload; // Update orders with user-specific data
      })
      .addCase(fetchOrderHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(handlePaymentFailure.fulfilled, (state, action) => {
        state.orders = state.orders.map(order =>
          order._id === action.payload.orderId ? { ...order, paymentStatus: 'Pending' } : order
        );
      })
      .addCase(retryPayment.fulfilled, (state, action) => {
        state.orders = state.orders.map(order =>
          order._id === action.payload.orderId ? { ...order, paymentStatus: 'Processing' } : order
        );
      });

    // Cancel Order
    builder
    .addCase(cancelOrder.fulfilled, (state, action) => {
      const { orderId, itemId } = action.payload;
      const order = state.orders.find((order) => order.id === orderId || order._id === orderId);
      if (order) {
        order.items = order.items.filter((item) => item.id !== itemId && item._id !== itemId);
      }
      state.walletBalance = action.payload.walletBalance;
    })

      .addCase(cancelOrder.rejected, (state, action) => {
        state.error = action.payload;
      });

      builder
  .addCase(fetchWalletBalance.pending, (state) => {
    state.status = 'loading';
  })
  .addCase(fetchWalletBalance.fulfilled, (state, action) => {
    state.walletBalance = action.payload; // Set wallet balance
    state.status = 'succeeded';
  })
  .addCase(fetchWalletBalance.rejected, (state, action) => {
    state.error = action.payload;
    state.status = 'failed';
  });

      // return order

      builder
      .addCase(returnOrder.fulfilled, (state, action) => {
        const updatedOrder = action.payload; // The returned updated order
        const index = state.orders.findIndex(order => order.id === updatedOrder.id || order._id === updatedOrder._id);
        if (index !== -1) {
          state.orders[index] = updatedOrder;
        }
        state.status = 'succeeded';
      });

    // Create Order
    builder
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orders.push(action.payload); // Add the new order to the list
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.error = action.payload;
      });
    
 
  },
});

// Selectors
export const selectOrderHistory = (state) => state.order.orders;
export const selectOrderStatus = (state) => state.order.status;
export const selectOrderError = (state) => state.order.error;
export const selectWalletBalance = (state) => state.order.walletBalance;


export const { resetOrders } = orderSlice.actions;

export default orderSlice.reducer;
