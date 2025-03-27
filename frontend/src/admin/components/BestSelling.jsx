import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";


import {
  fetchBestSellingProducts,
  fetchBestSellingCategories,
  fetchBestSellingBrands,
} from "../../redux/slices/bestSelling.js";
import { Container, Row, Col, Card, Spinner, Button } from "react-bootstrap";
import { currency } from "../../App.jsx";
import { assets } from "../../assets/assets.js";

const BestSelling = () => {
  const dispatch = useDispatch();
  const { products, categories, brands, loading, error } = useSelector(
    (state) => state.best
  );

  const navigate = useNavigate();
  useEffect(() => {
    dispatch(fetchBestSellingProducts());
    dispatch(fetchBestSellingCategories());
    dispatch(fetchBestSellingBrands());
  }, [dispatch]);


    const categoryImages = {
      boys: assets.boyfashion,
      girls: assets.girlfashion
    };
  
  
    // ✅ Brand Image Mapping
    const brandImages = {
      babyhug: assets.babyhug_logo,
      "h&m": assets.hm_logo,
      hopscotch: assets.hopscotch_logo,
    };

  return (
    <Container>
      <h2 className="text-center my-4">Best Selling Dashboard</h2>

      {loading && <Spinner animation="border" />}
      {error && <p className="text-danger">{error}</p>}

      {/* Best Selling Products */}
      <h3 className="mt-4">Top Selling Products</h3>
      <Row>
        {products.map((product) => (
          <Col key={product.productId} md={4} className="mb-4">
            <Card>
            <Card.Img
  variant="top"
  src={product.images?.[0]?.url || "/path/to/default-image.jpg"} // Handle missing images
  style={{ height: "200px", objectFit: "cover" }}
/>

              <Card.Body>
                <Card.Title>{product.name}</Card.Title>
                <Card.Text>Price: {currency}{product.price}</Card.Text>
                <Card.Text>Sold: {product.totalSold}</Card.Text>
                <Button
    variant="warning"
    onClick={() => navigate(`/admin/products/edit/${product.productId}`)}
  >
    ✏️ Edit
  </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Best Selling Categories */}
      <h3 className="mt-4">Top Selling Categories</h3>
      <Row>
        {categories.map((category) => (
          <Col key={category.categoryId} md={4} className="mb-4">
            <Card>
            <Card.Img
  variant="top"
  src={categoryImages[category.categoryName.toLowerCase()] || "/path/to/default-category.jpg"}
  style={{ height: "200px", objectFit: "contain" }}
/>

              <Card.Body>
                <Card.Title>{category.categoryName}</Card.Title>
                <Card.Text>Sold: {category.totalSold}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Best Selling Brands */}
      <h3 className="mt-4">Top Selling Brands</h3>
      <Row>
        {brands.map((brand, index) => (
          <Col key={index} md={4} className="mb-4">
            <Card>
            <Card.Img
  variant="top"
  src={brandImages[brand.brand.toLowerCase()] || "/path/to/default-brand.jpg"}
  style={{ height: "100px", objectFit: "contain" }}
/>

              <Card.Body>
                <Card.Title>{brand.brand}</Card.Title>
                <Card.Text>Total Sold: {brand.totalSold}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default BestSelling;
