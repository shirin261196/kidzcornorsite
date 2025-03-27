import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Title from './Title';
import ProductItem from './ProductItem';
import styled from 'styled-components';

const LatestCollectionContainer = styled.div`
  margin: 2rem 0;

  .title-container {
    text-align: center;
    padding: 2rem 0;
    font-size: 1.875rem;
  }

  .description {
    width: 80%;
    max-width: 700px;
    margin: 0 auto;
    color: #4a5568;
    font-size: 0.875rem;

    @media (min-width: 640px) {
      font-size: 1rem;
    }
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1.5rem;

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

const LatestCollection = () => {
  const {products} = useSelector((state) => state.products);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Calculate pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <LatestCollectionContainer>
      <div className="title-container">
        <Title text1="LATEST " text2="COLLECTIONS" />
        <p className="description">
          Discover the latest trends in kids' fashion with our exclusive new collection, thoughtfully designed for style and comfort.
        </p>
      </div>

      {/* Rendering Products */}
      <div className="product-grid">
        {currentProducts.map((item) => {
          const imageUrl = item.images?.[0]?.url || 'https://via.placeholder.com/150';

          return (
            <ProductItem
              key={item._id}
              id={item._id}
              image={imageUrl}
              name={item.name}
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
    </LatestCollectionContainer>
  );
};

export default LatestCollection;
