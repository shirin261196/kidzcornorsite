import React from "react";
import Navbar from "../../admin/components/Navbar";
import Sidebar from "../../admin/components/Sidebar";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <>
      <Navbar />
      <div className="admin-container d-flex">
        <Sidebar />
        <div className="admin-content" style={{ flex: 1, padding: "20px" }}>
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default AdminLayout;
