import React from "react";
import { Container, Row, Col, Image } from "react-bootstrap";
import { assets } from "../../assets/assets";

const About = () => {
  return (
    <Container className="py-5">
      <Row className="align-items-center flex-column-reverse flex-md-row">
        
        {/* Image Section */}
        <Col md={6} className="d-flex justify-content-center mb-4 mb-md-0">
          <Image 
            src={assets.Logo} 
            alt="KidzCorner Fashion"
            className="rounded shadow-lg"
            style={{ maxWidth: "200px", height: "auto" }}
          />
        </Col>

        {/* Text Section */}
        <Col md={6} className="text-center text-md-start">
          <h1 className="fw-bold text-primary mb-3" style={{ fontFamily: 'Comic Sans MS, sans-serif' }}>
            Welcome to <span style={{ color: "#ff4081" }}>KIDZCORNER</span>!
          </h1>
          <p className="lead" style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>
            <strong>KIDZCORNER</strong> is your ultimate destination for trendy and comfortable kids' fashion.  
            We believe every child deserves to shine, and our collection reflects the joy and colors of childhood.
          </p>
          <p style={{ fontSize: '1rem', color: '#666' }}>
            Discover our wide range of stylish apparel crafted with love and care, perfect for every occasion.  
            From playful prints to classic designs, our outfits are designed to make your little ones stand out.
          </p>
          <p style={{ fontSize: '1rem', color: '#666' }}>
            We promise quality, comfort, and a whole lot of fun! Dress your kids in the best, and let them conquer the world with confidence.
          </p>
        </Col>

      </Row>
    </Container>
  );
};

export default About;
