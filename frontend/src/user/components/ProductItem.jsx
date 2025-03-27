import React, { useContext } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Container, Row, Col } from 'react-bootstrap';

const ProductCard = styled(Link)`
  color: #4a5568;
  text-decoration: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  transition: box-shadow 0.3s ease;
  display: block;

  &:hover {
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  }

  .image-container {
    overflow: hidden;
    border-radius: 8px;
    margin-bottom: 0.75rem;

    img {
      width: 100%;
      transition: transform 0.3s ease;
      border-radius: 8px;

      &:hover {
        transform: scale(1.05);
      }
    }
  }

  .name {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: #2d3748;
  }

  .price {
    font-size: 1rem;
    font-weight: 600;
    color: #1a202c;
  }

  .size-info {
    font-size: 0.875rem;
    margin-top: 1rem;
  }

  .size-item {
    display: inline-block;
    margin-right: 10px;
    padding: 5px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    background-color: #f7fafc;
    color: #4a5568;
    transition: background-color 0.3s;

    &:hover {
      background-color: #edf2f7;
    }
  }

  .stock-info {
    font-size: 0.875rem;
    font-weight: 500;
    margin-top: 0.5rem;
  }

  .in-stock {
    color: #38a169; /* Green for in stock */
  }

  .out-of-stock {
    color: #e53e3e; /* Red for out of stock */
  }
`;

const ProductItem = ({ id, image = '', name, price, stock, sizes }) => {
  const { currency } = useContext(ShopContext);

  // Fallback image if the image array is empty
  const productImage = image || 'https://via.placeholder.com/150';

  return (
    <ProductCard to={`/product/${id}`}>
      <div className="image-container">
        <img src={productImage} alt={name} />
      </div>
      <p className="name">{name}</p>
      <p className="price">
        {currency}
        {price}
      </p>

   {/* Size and stock information */}
   <div className="size-info">
        {sizes && sizes.length > 0 ? (
          <div>
            <strong>Sizes:</strong>
            {sizes.map(({ size, stock }, index) => (
              <span
                key={`${id}-${size}-${index}`} // Unique key using id, size, and index
                className={`size-item ${stock > 0 ? 'in-stock' : 'out-of-stock'}`}
              >
                {size} ({stock > 0 ? `${stock} in stock` : 'Out of stock'})
              </span>
            ))}
          </div>
        ) : (
          <p>No sizes available</p>
        )}
      </div>
    </ProductCard>
  );
};

export default ProductItem;