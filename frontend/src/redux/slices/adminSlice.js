import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Initial state for admin order management
const initialState = {
  orders: [], // List of all orders
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
};

// Thunks for Admin Order Management API calls

// Fetch all orders
export const fetchOrders = createAsyncThunk(
  'admin/fetchOrders',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await axios.get('http://localhost:4000/admin/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data; // Return orders data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
    'admin/updateProductStatus',
    async ({ orderId, status }, { rejectWithValue }) => {
      const token = localStorage.getItem('adminToken');
      try {
        const response = await axios.patch(
          `http://localhost:4000/admin/orders/${orderId}/status`,
          { status },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        return response.data; // Returning the updated order
      } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update product status');
      }
    }
  );
  
  export const updateTrackingStatus = createAsyncThunk(
    'order/updatetrackingstatus',
    async ({ orderId, productId, trackingStatus}, { rejectWithValue }) => {
      const token = localStorage.getItem('adminToken'); // Retrieve token from localStorage
      if (!token) {
        return rejectWithValue('Authentication token not found');
      }
      try {
        const response = await axios.put(
          `http://localhost:4000/admin/orders/${orderId}/item/${productId}/tracking-status`,
          {trackingStatus}, // Send an empty body if required
          {
            headers: {
              Authorization: `Bearer ${token}`, // Correct token format
            },
          }
        );
        return response.data; // Assuming API returns the updated order object
      } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed update status');
      }
    }
  );
  

// Cancel an order
export const cancelAdminOrder = createAsyncThunk(
  'admin/cancelOrder',
  async (orderId, { rejectWithValue }) => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await axios.delete(`http://localhost:4000/admin/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data; // Return the canceled order info
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel order');
    }
  }
);

// Approve return request
export const approveReturnRequest = createAsyncThunk(
    'admin/approveReturnRequest',
    async ({ orderId, productId }, { rejectWithValue }) => {
      const token = localStorage.getItem('adminToken');
      try {
        const response = await axios.put(
          `http://localhost:4000/admin/orders/${orderId}/item/${productId}/approve-return`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        return response.data; // Return the updated order after approving the return
      } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to approve return request');
      }
    }
  );
  

// Slice for Admin Order Management
const adminOrderSlice = createSlice({
  name: 'adminOrders',
  initialState,
  reducers: {
    setOrders: (state, action) => {
        state.orders = action.payload; // Assuming you're storing the orders in the `orders` array.
    },
  },
  extraReducers: (builder) => {

    // Fetch Orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.orders = action.payload; // Set the orders list
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });

    // Update Order Status
    builder
    .addCase(updateOrderStatus.fulfilled, (state, action) => {
      const updatedOrder = action.payload;
      // Update the order in the Redux state with the new status
      const orderIndex = state.orders.findIndex(order => order._id === updatedOrder._id);
      if (orderIndex !== -1) {
        state.orders[orderIndex] = updatedOrder;
      }
    })
    .addCase(updateOrderStatus.rejected, (state, action) => {
      state.error = action.payload;
    });
  

      // trackingStatus

      builder
      .addCase(updateTrackingStatus.fulfilled, (state, action) => {
        const updatedOrder = action.payload;
        state.orders = state.orders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        );
      })
      .addCase(updateTrackingStatus.rejected, (state, action) => {
        state.error = action.payload;
      });

          // Approve Return Request
    builder
    .addCase(approveReturnRequest.fulfilled, (state, action) => {
      const updatedOrder = action.payload;
      state.orders = state.orders.map((order) =>
        order._id === updatedOrder._id ? updatedOrder : order
      );
    })
    .addCase(approveReturnRequest.rejected, (state, action) => {
      state.error = action.payload;
    });
    
    // Cancel Order
    builder
    .addCase(cancelAdminOrder.fulfilled, (state, action) => {
      const canceledOrderId = action.payload?.orderId;
      if (canceledOrderId) {
        state.orders = state.orders.filter(order => order._id !== canceledOrderId);
      }
    })
      .addCase(cancelAdminOrder.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectOrders = (state) => state.adminOrders.orders;
export const selectOrderStatus = (state) => state.adminOrders.status;
export const selectOrderError = (state) => state.adminOrders.error;
export const { setOrders } = adminOrderSlice.actions;

export default adminOrderSlice.reducer;
