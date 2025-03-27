import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Title from './Title';
import ProductItem from './ProductItem';
import styled from 'styled-components';

const BestSellerContainer = styled.div`
  margin: 40px 0;

  .title {
    text-align: center;
    font-size: 2rem;
    padding: 20px 0;
  }

  .description {
    width: 75%;
    margin: auto;
    font-size: 0.875rem;
    color: #555;

    @media (min-width: 640px) {
      font-size: 1rem;
    }

    @media (min-width: 768px) {
      font-size: 1.125rem;
    }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;

    @media (min-width: 640px) {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (min-width: 768px) {
      grid-template-columns: repeat(4, 1fr);
    }

    @media (min-width: 1024px) {
      grid-template-columns: repeat(5, 1fr);
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 2rem;

    .page-button {
      padding: 0.5rem 1rem;
      border: none;
      background-color: #edf2f7;
      color: #4a5568;
      border-radius: 0.25rem;
      cursor: pointer;

      &.active {
        background-color: #3182ce;
        color: #fff;
      }

      &:disabled {
        background-color: #e2e8f0;
        cursor: not-allowed;
      }
    }
  }
`;

const BestSeller = () => {
  // Fetch products from Redux store
  const {products} = useSelector((state) => state.products);

  const [bestSeller, setBestSeller] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Adjust items per page for Best Sellers

  // Filter best-seller products whenever products change
  useEffect(() => {
    const bestProduct = products.filter((item) => item.bestseller);
    setBestSeller(bestProduct);
  }, [products]);

  // Pagination calculations
  const totalPages = Math.ceil(bestSeller.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBestSellers = bestSeller.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <BestSellerContainer>
      <div className="title">
        <Title text1="BEST" text2="SELLERS" />
        <p className="description">
          Explore now to find outfits that kids love and parents trust for quality and style
        </p>
      </div>

      {/* Responsive grid layout for products */}
      <div className="grid">
        {currentBestSellers.map((item) => {
          const imageUrl = item.images?.[0]?.url || 'https://via.placeholder.com/150';
          return (
            <ProductItem
              key={item._id}
              id={item._id}
              name={item.name}
              image={imageUrl}
              price={item.price}
              stock={item.stock}
              sizes={item.sizes}
            />
          );
        })}
      </div>

      {/* Pagination Controls */}
      <div className="pagination">
        <button
          className="page-button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index + 1}
            className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
            onClick={() => handlePageChange(index + 1)}
          >
            {index + 1}
          </button>
        ))}
        <button
          className="page-button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </BestSellerContainer>
  );
};

export default BestSeller;
