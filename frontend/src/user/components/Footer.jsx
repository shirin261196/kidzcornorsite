import React from "react";
import styled from "styled-components";
import { assets } from "../../assets/assets";

const FooterContainer = styled.div`
  background-color: #f8f9fa; /* Optional background color for the footer */
  padding: 2rem 0;
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  text-align: center;

  @media (min-width: 768px) {
    text-align: left;
  }
`;

const Column = styled.div`
  flex: 0 0 100%;
  max-width: 100%;
  margin-bottom: 1.5rem;

  @media (min-width: 768px) {
    flex: 0 0 33.333%;
    max-width: 33.333%;
  }
`;

const FooterText = styled.p`
  font-size: 13px;
  color: #6c757d;
`;

const Footer = () => {
  return (
    <FooterContainer>
      <Row>
        <Column>
          <img
            src={assets.Logo}
            className="mb-3"
            style={{ width: "80px" }}
            alt="KidzCorner Logo"
          />
          <FooterText>
            Your trusted destination for stylish and high-quality kid's fashion. Our collections
            are designed with love, comfort, and durability in mind.
          </FooterText>
        </Column>
        <Column>
          <FooterText className="h5 mb-3">COMPANY</FooterText>
          <ul className="list-unstyled">
            <li>Home</li>
            <li>About us</li>
            <li>Delivery</li>
            <li>Privacy policy</li>
          </ul>
        </Column>
        <Column>
          <FooterText className="h5 mb-3">GET IN TOUCH</FooterText>
          <ul className="list-unstyled">
            <li>+918137418148</li>
           
          </ul>
        </Column>
      </Row>
      <FooterText className="text-center mt-4">
        &copy; 2024 kidzCorner.com - All Rights Reserved
      </FooterText>
    </FooterContainer>
  );
};

export default Footer;
