import { createSlice } from '@reduxjs/toolkit';

// Safe parsing function to handle invalid JSON safely
const safeJSONParse = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
};

// Retrieve user information and token from localStorage (if available)
const initialState = {
  user: safeJSONParse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload?.user || null;
      state.token = action.payload?.token || null;
      
      // Save token and user to localStorage only if server response contains valid data
      if (action.payload?.user?.role) {
        localStorage.setItem('token', action.payload?.token || '');
        localStorage.setItem('userRole', action.payload?.user?.role);
      } else {
        localStorage.setItem('userRole', 'default');
      }

      const userId = action.payload?.user?.id || action.payload?.user?._id; // Check both id and _id
  if (userId) {
    localStorage.setItem('user', JSON.stringify(action.payload.user));
    localStorage.setItem('userId', userId);
    console.log('loginSuccess - User ID set:', userId); // Debug
  } else {
    console.error('loginSuccess - No valid user ID found in payload:', action.payload);
  }
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      // Only clear localStorage and reset state during logout
      state.user = null;
      state.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
    },
  },
});

// Selectors
export const selectIsAuthenticated = (state) => !!state.auth.token || !!localStorage.getItem('token');
export const selectUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectUserId = (state) => state.auth.user ? (state.auth.user.id || state.auth.user._id) : null;
 // Selector for `userId`

export const { loginRequest, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
