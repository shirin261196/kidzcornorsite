import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import List from "../admin/pages/List.jsx";
import Add from "../admin/pages/Add.jsx";
import AdminLayout from "../admin/components/Adminlayout.jsx"
import Users from "../admin/pages/Users.jsx";
import Category from "../admin/pages/Category";
import EditProduct from "../admin/pages/EditProduct.jsx";
import AdminStockManagement from "../admin/pages/Stock.jsx";
import AdminOrderManagement from "../admin/pages/Orders.jsx";
import ProductDetails from "../admin/pages/Productdetails.jsx";
import ViewOrder from "../admin/pages/ViewOrder.jsx";
import OfferManagement from "../admin/pages/Offers";
import CouponManagement from "../admin/pages/Coupon";
import SalesReport from "../admin/pages/SalesReport";
import Ledger from "../admin/pages/Ledger";
import BestSelling from "../admin/components/BestSelling";


const AdminRoutes = () => {
  return (
    <Routes>
      {/* Wrap admin routes with ProtectedRoute to restrict access */}
      <Route element={<ProtectedRoute allowedRole="admin" />}>
        {/* Use AdminLayout for shared admin navigation/UI */}
        <Route element={<AdminLayout />}>
          <Route path="products/list" element={<List />} />
          <Route path="products/add" element={<Add />} />
          <Route path="products/edit/:id" element={<EditProduct />} />
          <Route path="orders" element={<AdminOrderManagement />} />
          <Route path="/orders/:orderId/products/:productId" element={<ProductDetails />} />
          <Route path="/orders/:orderId" element={<ViewOrder/>}/>
          <Route path="users" element={<Users />} />
          <Route path ="products/stock/:id" element ={<AdminStockManagement />}/>
          <Route path="category" element={<Category />} />
          <Route path="offers" element={<OfferManagement />} />
          <Route path="coupon" element={<CouponManagement />} />
          <Route path="report" element={<SalesReport />} />
          <Route path="ledger" element={<Ledger />} />
          <Route path="bestselling" element={<BestSelling/>}/>
        </Route>
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
