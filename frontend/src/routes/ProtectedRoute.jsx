import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "../redux/slices/authSlice";

const ProtectedRoute = ({ allowedRole }) => {
  const user = useSelector(selectUser); // Get the user from Redux state
  const isAuthenticated = useSelector(selectIsAuthenticated); // Check if the user is authenticated

  if (!isAuthenticated || (allowedRole && user?.role !== allowedRole)) {
    // Redirect to login if not authenticated or role mismatch
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
