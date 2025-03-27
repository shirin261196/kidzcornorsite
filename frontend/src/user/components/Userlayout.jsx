import React from "react";
import styled from "styled-components";
import Navbar from "../../user/components/Navbar.jsx";
import Footer from "../../user/components/Footer.jsx";
import Searchbar from "../../user/components/Searchbar";
import { Outlet } from "react-router-dom";

const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* Ensures the layout covers the full viewport height */
`;

const Content = styled.div`
  flex: 1; /* Makes this area grow to occupy available space */
`;

const Userlayout = () => {
  return (
    <LayoutWrapper>
      <Navbar />
      <Searchbar />
      <Content>
        <Outlet />
      </Content>
      <Footer />
    </LayoutWrapper>
  );
};

export default Userlayout;
