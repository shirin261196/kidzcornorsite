import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Fetch best-selling products
export const fetchBestSellingProducts = createAsyncThunk(
  "best/fetchBestSellingProducts",
  async (_, { rejectWithValue }) => {
    try {
    const token = localStorage.getItem('token');
      const { data } = await axios.get("http://localhost:4000/products/best-selling-products",  {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return data.topProducts;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Fetch best-selling categories
export const fetchBestSellingCategories = createAsyncThunk(
  "best/fetchBestSellingCategories",
  async (_, { rejectWithValue }) => {
    try {
        const token = localStorage.getItem('token');
      const { data } = await axios.get("http://localhost:4000/products/best-selling-categories",{ headers: {
        Authorization: `Bearer ${token}`,
      },});
      return data.topCategories;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Fetch best-selling brands
export const fetchBestSellingBrands = createAsyncThunk(
  "best/fetchBestSellingBrands",
  async (_, { rejectWithValue }) => {
    try {
        const token = localStorage.getItem('token');
      const { data } = await axios.get("http://localhost:4000/products/best-selling-brands",{ headers: {
        Authorization: `Bearer ${token}`,
      },});
      return data.topBrands;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const bestSlice = createSlice({
  name: "best",
  initialState: {
    products: [],
    categories: [],
    brands: [],
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBestSellingProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBestSellingProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchBestSellingProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchBestSellingCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBestSellingCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchBestSellingCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchBestSellingBrands.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBestSellingBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.brands = action.payload;
      })
      .addCase(fetchBestSellingBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default bestSlice.reducer;
