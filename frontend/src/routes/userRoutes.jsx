import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../user/pages/Home.jsx";
import Collection from "../user/pages/Collection.jsx";
import About from "../user/pages/About.jsx";
import Contact from "../user/pages/Contact.jsx";
import Product from "../user/pages/Product.jsx";
import Cart from "../user/pages/Cart.jsx";

import UserLayout from "../user/components/Userlayout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import ForgetPassword from "../user/pages/Forgotpass.jsx";
import Profile from "../user/pages/Profile.jsx";

import Checkout from "../user/pages/Checkout.jsx";


import UserOrderPage from "../user/pages/Orders.jsx";
import OrderDetailsPage from "../user/pages/Orderdetails.jsx";
import WishlistPage from "../user/pages/Wishlist.jsx";


const UserRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<UserLayout />}>
        <Route index element={<Home />} />
        <Route path="/forgot-password" element={<ForgetPassword />} />
        <Route path="collection" element={<Collection />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="product/:id" element={<Product />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute userRole="user" />}>
        <Route path="/" element={<UserLayout />}>
        <Route path="profile" element={<Profile />} />
        <Route path="contact" element={<Contact />} />
        <Route path="About" element={<About />} />
          <Route path="cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<UserOrderPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default UserRoutes;
