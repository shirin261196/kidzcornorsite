import React, { createContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { fetchProducts } from "../redux/slices/productSlice";
import { loginSuccess, logout } from "../redux/slices/authSlice";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currency = "₹";
  const delivery_fee = 50;

  // Local states for UI-specific data
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Redux state selectors
  const { products, loading, error } = useSelector((state) => state.products); 
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

    // Initialize session state from localStorage
    useEffect(() => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        setIsAdminLoggedIn(true);
      }
    }, []);
  
    const logout = () => {
      localStorage.removeItem('adminToken'); // Clear token
      setIsAdminLoggedIn(false);
      navigate('/admin/login'); // Redirect user to login after logout
    };

  const handleSearch = (query) => {
    dispatch(setSearch(query));
  };
  
  // Fetch products using Redux async thunk
  const fetchProductsFromAPI = () => {
    dispatch(fetchProducts()); // Directly dispatch the async thunk
  };


  // Handle login success
  const handleLoginSuccess = (userData) => {
    dispatch(loginSuccess(userData));
    toast.success("Login successful!");
  };

  // Logout
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Context value
  const value = {
    products, // Redux-managed products
    loading, // Loading state for fetching products
    error, // Error state for fetching products
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    handleSearch,
    user, // Redux-managed user
    token, // Redux-managed token
    handleLoginSuccess,
    handleLogout,
    fetchProducts: fetchProductsFromAPI,
    isAdminLoggedIn,
    logout,
    setAdminSession: setIsAdminLoggedIn, // Fetch products via Redux thunk
  };

  return <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>;
};

export default ShopContextProvider;
