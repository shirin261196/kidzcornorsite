import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders, updateOrderStatus, selectOrders } from '../../redux/slices/adminSlice.js';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Button } from 'react-bootstrap';

const ProductDetails = () => {
  const { orderId, productId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const orders = useSelector(selectOrders);

  const order = orders.find((o) => o._id === orderId);
  const product = order?.items.find((item) => item.product._id === productId);

  useEffect(() => {
    if (!orders.length) dispatch(fetchOrders());
  }, [dispatch, orders]);

  const handleStatusChange = async (status) => {
    try {
      await dispatch(updateOrderStatus({ orderId, productId, status })).unwrap();
     
      navigate('/admin/orders');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (!product) {
    return <Alert variant="danger">Product not found.</Alert>;
  }

  return (
    <div className="container my-4">
      <h2>Product Details</h2>
      <p><strong>Name:</strong> {product.product.name}</p>
      <p><strong>Price:</strong> {product.price}</p>
      <p><strong>Quantity:</strong> {product.quantity}</p>
      <p><strong>Status:</strong> {product.trackingStatus}</p>

      {/* Display product images */}
      <div className="product-images">
        {product.product.images && product.product.images.length > 0 ? (
          product.product.images.map((image, index) => (
            <img
              key={index}
              src={image.url} // Use the URL of each image
              alt={`${product.product.name} - ${index + 1}`}
              style={{ width: '200px', height: 'auto', margin: '10px' }}
            />
          ))
        ) : (
          <p>No images available</p>
        )}
      </div>
<Button variant="secondary" onClick={() => window.history.back()}>
        Go Back
      </Button>
      
    </div>
  );
};

export default ProductDetails;
