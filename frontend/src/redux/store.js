// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import userReducer from './slices/userSlice.js'
import cartReducer from './slices/cartSlice'
import orderReducer from './slices/orderSlice'
import categoryReducer from './slices/categorySlice.js'
import addressReducer from './slices/addressSlice.js'
import adminOrderReducer from './slices/adminSlice.js'
import wishlistReducer from './slices/wishlistSlice.js'
import walletReducer from './slices/walletSlice.js'
import bestReducer from './slices/bestSelling.js'
const store = configureStore({
  reducer: {
    auth: authReducer,
    user:userReducer,
    address:addressReducer,
    products: productReducer,
    categories:categoryReducer,
   cart:cartReducer,
   order:orderReducer,
   adminOrders:adminOrderReducer,
   wishlist: wishlistReducer,
   wallet: walletReducer,
   best: bestReducer
  },

});

export default store;
