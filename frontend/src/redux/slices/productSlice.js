import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';

const initialState = {
  products: [], // Ensure this matches the structure of the returned data
  search: "",
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
  const response = await fetch('http://localhost:4000/admin/products/list');
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch products');
  }

  return data.products; // Ensure we return only the array
});

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    updateProductStock: (state, action) => {
      const { id, size, stock } = action.payload;
    
      // Find the product by ID
      const product = state.products.find((product) => product._id === id);
    
      if (product && Array.isArray(product.sizes)) {
        // Find the specific size object to update
        const productSize = product.sizes.find((s) => s.size === size);
    
        if (productSize) {
          // Update stock for the specific size
          productSize.stock = stock;
    
          // Recalculate totalStock for the product
          product.totalStock = product.sizes.reduce(
            (total, s) => total + (s.stock || 0),
            0 // Initial value for total
          );
        }
      }
    },
    
      
      setProducts(state, action) {
        state.products = action.payload.map((product) => ({
          ...product,
          totalStock: Array.isArray(product.sizes)
            ? product.sizes?.reduce((total, size) => total + (size.stock || 0), 0)
            : 0, // Default to 0 if sizes is not an array
        }));
      },
      
      updateProductDiscount: (state, action) => {
        const { id, discountPrice } = action.payload;
        const product = state.products.find((product) => product._id === id);
        if (product) {
          product.discountPrice = discountPrice;
        }
      },
      
    setSearch(state, action) {
      state.search = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload; // Expect an array
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

// Export actions
export const {  updateProductDiscount,updateProductStock,setProducts, setSearch } = productSlice.actions;

// Create a selector for filtered products
export const selectFilteredProducts = createSelector(
  [(state) => state.products.products, (state) => state.products.search],
  (products, search) =>
    products.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    )
);

export default productSlice.reducer;
