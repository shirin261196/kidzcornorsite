import React from 'react';
import styled from 'styled-components';
import { assets } from '../../assets/assets';

// Styled components for each section of the Hero component
const HeroContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #ccc;
  
  @media (min-width: 576px) {
    flex-direction: row;
  }
`;

const HeroLeft = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  
  @media (min-width: 576px) {
    width: 50%;
    padding: 0;
  }
`;

const TextContainer = styled.div`
  color: #414141;
  text-align: center;
`;

const Divider = styled.p`
  width: 2rem;
  height: 2px;
  background-color: #414141;
`;

const SubHeading = styled.p`
  font-weight: 500;
  font-size: 0.875rem; /* small size */
`;

const Heading = styled.h1`
  font-size: 2rem;
  margin: 1rem 0;

  @media (min-width: 768px) {
    font-size: 3rem;
  }

  @media (min-width: 992px) {
    font-size: 4rem;
  }
`;

const ShopNowContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ShopNowText = styled.p`
  font-weight: 600;
  font-size: 0.875rem;
`;

const HeroImage = styled.img`
  width: 100%;
  height: auto;

  @media (min-width: 576px) {
    width: 50%;
  }
`;

const Hero = () => {
  return (
    <HeroContainer>
      {/* Hero Left Side */}
      <HeroLeft>
        <TextContainer>
          <div className="d-flex align-items-center gap-2">
            <Divider />
            <SubHeading>OUR BESTSELLERS</SubHeading>
          </div>
          <Heading>Latest Arrivals</Heading>
          <ShopNowContainer>
            <ShopNowText>SHOP NOW</ShopNowText>
            <Divider />
          </ShopNowContainer>
        </TextContainer>
      </HeroLeft>

      {/* Hero Right Side */}
      <HeroImage src={assets.hero} alt="Hero" />
    </HeroContainer>
  );
};

export default Hero;
