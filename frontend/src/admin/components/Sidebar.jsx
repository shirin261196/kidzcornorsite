import React from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { assets } from '../../assets/assets';

// Styled components
const SidebarContainer = styled.div`
  width: 20%; /* Default width for larger screens */
  min-height: 100vh; /* Full screen height */
  border-right: 2px solid #e0e0e0;
  background-color: #f9f9f9;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 768px) {
    width: 40%; /* Shrink width for smaller screens */
  }

  @media (max-width: 480px) {
    width: 60%; /* Shrink width further for very small screens */
  }
`;

const NavItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const NavLinkStyled = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  text-decoration: none;
  color: #333;
  border-radius: 4px;
  transition: background-color 0.3s, color 0.3s;

  &:hover {
    background-color: #007bff;
    color: #fff;
  }
`;

const Icon = styled.img`
  width: 24px;
  height: 24px;

  @media (max-width: 768px) {
    width: 20px; /* Shrink icons */
    height: 20px;
  }
`;

const NavText = styled.p`
  font-size: 14px;
  font-weight: 500;

  @media (max-width: 480px) {
    display: none; /* Hide text on very small screens */
  }
`;

// Sidebar Component
const Sidebar = () => {
  return (
    <SidebarContainer>
      <NavItems>
        <p>Dashboard</p>
         {/* Category */}
         <NavLinkStyled to="/admin/report">
          <Icon src={assets.order_icon} alt="Category Icon" />
          <NavText>Sales Report</NavText>
        </NavLinkStyled>

        {/* Ledger */}
        <NavLinkStyled to="/admin/ledger">
          <Icon src={assets.order_icon} alt="Category Icon"  />
          <NavText>Ledger Book</NavText>
        </NavLinkStyled>

        {/* Add Items */}
        <NavLinkStyled to="/admin/products/add">
          <Icon src={assets.add_icon} alt="Add Icon" />
          <NavText>Add Items</NavText>
        </NavLinkStyled>

        {/* List Items */}
        <NavLinkStyled to="/admin/products/list">
          <Icon src={assets.order_icon} alt="List Icon" />
          <NavText>List Items</NavText>
        </NavLinkStyled>

        {/* Orders */}
        <NavLinkStyled to="/admin/orders">
          <Icon src={assets.order_icon} alt="Orders Icon" />
          <NavText>Orders</NavText>
        </NavLinkStyled>

        {/* Users */}
        <NavLinkStyled to="/admin/users">
          <Icon src={assets.order_icon} alt="User Icon" />
          <NavText>Users</NavText>
        </NavLinkStyled>

        {/* Category */}
        <NavLinkStyled to="/admin/category">
          <Icon src={assets.order_icon} alt="Category Icon" />
          <NavText>Category</NavText>
        </NavLinkStyled>

          {/* Stock */}
          <NavLinkStyled to="/admin/products/stock/:id">
          <Icon src={assets.order_icon} alt="Category Icon" />
          <NavText>Stock</NavText>
        </NavLinkStyled>

          

     {/* Offers */}
     <NavLinkStyled to="/admin/coupon">
          <Icon src={assets.order_icon} alt="Category Icon" />
          <NavText>Coupons and Offers</NavText>
        </NavLinkStyled>

      </NavItems>
    </SidebarContainer>
  );
};


export default Sidebar;
