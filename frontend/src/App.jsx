import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

import Login from "./user/pages/Login";
import Signup from "./user/pages/Signup";
import AdminLogin from "./admin/components/Login.jsx";
import ShopContextProvider from "./context/ShopContext.jsx";

import UserRoutes from "./routes/userRoutes.jsx";
import AdminRoutes from "./routes/AdminRoutes.jsx";

export const backendUrl = 'http://localhost:4000'
export const currency = "₹";

// Removed ProtectedRoute to check directly
const App = () => {

  return (
    <ShopContextProvider>
   <ToastContainer />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin protected routes */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* User Routes */}
        <Route path="/*" element={<UserRoutes />} />

        {/* Fallback route */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </ShopContextProvider>
  );
};

export default App;
