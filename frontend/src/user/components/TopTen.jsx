import React, { useEffect, useState } from "react";
import axios from "axios";
import '../../styles/topTen.css';
import { Button, Card, Container } from "react-bootstrap";
import ProductItem from "./ProductItem";
import { assets } from "../../assets/assets.js";

const TopTen = () => {
  const [bestProducts, setBestProducts] = useState([]);
  const [bestCategories, setBestCategories] = useState([]);
  const [bestBrands, setBestBrands] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 4;

  useEffect(() => {
    fetchBestSellers();
  }, []);

// Define the base URL for API calls
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.mykidzcornor.info'
  : 'http://localhost:4000'; // Use localhost for local development

const fetchBestSellers = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error('Authentication token not found. Please log in.');
    }

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    // Fetch best-selling products
    const { data: productData } = await axios.get(
      `${API_URL}/products/best-selling-products`,
      config
    );
    if (productData.success) {
      setBestProducts(productData.topProducts || []);
    } else {
      throw new Error(productData.message || 'Failed to fetch best-selling products.');
    }

    // Fetch best-selling categories
    const { data: categoryData } = await axios.get(
      `${API_URL}/products/best-selling-categories`,
      config
    );
    if (categoryData.success) {
      setBestCategories(categoryData.topCategories || []);
    } else {
      throw new Error(categoryData.message || 'Failed to fetch best-selling categories.');
    }

    // Fetch best-selling brands
    const { data: brandData } = await axios.get(
      `${API_URL}/products/best-selling-brands`,
      config
    );
    if (brandData.success) {
      setBestBrands(brandData.topBrands || []);
    } else {
      throw new Error(brandData.message || 'Failed to fetch best-selling brands.');
    }
  } catch (error) {
    console.error("Error fetching best sellers:", error.response?.data || error.message);
    toast.error(error.message || 'Error fetching best sellers. Please try again.');
  }
};

  const categoryImages = {
    boys: assets.boyfashion,
    girls: assets.girlfashion
  };

  const brandImages = {
    babyhug: assets.babyhug_logo,
    "h&m": assets.hm_logo,
    hopscotch: assets.hopscotch_logo,
  };

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = bestProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(bestProducts.length / productsPerPage);


  console.log('currentProducts:', currentProducts);
  console.log('bestCategories:', bestCategories);
  console.log('bestBrands:', bestBrands);
  return (
    <Container className="mt-4">
      {/* Best Selling Products Section */}
      <h2 className="text-center mb-4">🔥 Best Selling Products</h2>
      <div className="row justify-content-center">
        {currentProducts?.map((item) => {
          const imageUrl = item.images?.[0]?.url || "https://picsum.photos/150";
          return (
            <div key={item.productId} className="col-6 col-sm-4 col-md-3 col-lg-3 d-flex justify-content-center">
              <div className="product-item-wrapper">
                <ProductItem
                  id={item.productId}
                  image={imageUrl}
                  name={item.name}
                  price={item.price}
                  stock={item.stock}
                  sizes={item.sizes}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination d-flex justify-content-center flex-wrap gap-2 mt-4">
          <button
            className="page-button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          {[...Array(totalPages)].map((_, index) => (
            <button
              key={`page-${index + 1}`} // More explicit and stable key
              className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}

          <button
            className="page-button"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Best Selling Categories Section */}
      <h2 className="text-center mt-5 mb-4">🏆 Best Selling Categories</h2>
      <div className="row justify-content-center best-categories">
        {bestCategories?.map((item) => {
          const categoryKey = item.categoryName?.toLowerCase();
          const categoryImage = categoryImages[categoryKey] || item.categoryImage || "https://via.placeholder.com/150";
          return (
            <div key={item.categoryId} className="col-6 col-sm-4 col-md-3 col-lg-2">
              <Card className="shadow-sm text-center border-0 p-2 custom-card">
                <div className="category-image-container">
                  <Card.Img variant="top" src={categoryImage} className="fixed-category-image" />
                </div>
                <Card.Body>
                  <Card.Title className="text-truncate fw-bold">{item.categoryName || "Unknown Category"}</Card.Title>
                </Card.Body>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Best Selling Brands Section */}
      <h2 className="text-center mt-5 mb-4">🏅 Best Selling Brands</h2>
      <div className="row justify-content-center best-brands">
        {bestBrands?.map((item,index) => {
          const brandName = item.brand?.toLowerCase();
          const brandImage = brandImages[brandName] || "https://via.placeholder.com/150";
          return (
            <div key={item._id || `brand-${index}`} className="col-6 col-sm-4 col-md-3 col-lg-2">
              <Card className="shadow-sm text-center border-0 p-2 custom-card">
                <div className="brand-image-container">
                  <Card.Img variant="top" src={brandImage} className="fixed-brand-image" />
                </div>
                <Card.Body>
                  <Card.Title className="text-truncate fw-bold">{item.brand || "Unknown Brand"}</Card.Title>
                </Card.Body>
              </Card>
            </div>
          );
        })}
      </div>
    </Container>
  );
};

export default TopTen;