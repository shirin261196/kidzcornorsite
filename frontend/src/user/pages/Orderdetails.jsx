import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchOrderHistory,
  cancelOrder,
  returnOrder,
  selectOrderError,
  selectOrderHistory,
  selectOrderStatus,
  fetchWalletBalance,
} from '../../redux/slices/orderSlice.js';
import { currency } from '../../App.jsx';
import Swal from 'sweetalert2';
import { Button, Card, Row, Col, Image, Pagination, Table, Alert } from 'react-bootstrap';
import DownloadInvoice from '../components/Invoices.jsx';

const ITEMS_PER_PAGE = 5;

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const orders = useSelector(selectOrderHistory) || [];
  const status = useSelector(selectOrderStatus);
  const error = useSelector(selectOrderError);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const order = Array.isArray(orders) && orders.length > 0
    ? orders.find(order => order.id === orderId || order._id === orderId)
    : null;

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderHistory());
    }
  }, [dispatch, orderId]);

  const handleBack = () => {
    navigate('/orders');
  };

  const confirmCancelOrder = (orderId, itemId) => {
    console.log("Frontend - OrderId:", orderId, "ItemId:", itemId);
  
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to cancel this order?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'No, keep it',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(cancelOrder({ orderId, itemId }));
        
        // Dispatch to update wallet balance after cancellation
        dispatch(fetchWalletBalance()).then(() => {
          // Show message after wallet balance update
          Swal.fire('Cancelled!', 'Your order has been cancelled and the amount has been transferred to your wallet.', 'success');
        });
        
        // Optionally, you can also fetch the order history after cancellation
        dispatch(fetchOrderHistory());
      }
    });
  };
  

  const confirmReturnRequest = (orderId, itemId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to request a return for this item?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, request return!',
      cancelButtonText: 'No, keep it',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(returnOrder({ orderId, itemId })).then((action) => {
          if (action.meta.requestStatus === 'fulfilled') {
            Swal.fire('Success!', 'Return request submitted successfully.', 'success');
          } else {
            Swal.fire('Error!', 'Failed to submit return request.', 'error');
          }
          dispatch(fetchOrderHistory());
        });
      }
    });
  };
  

  const totalPrice = order && !isNaN(order.totalPrice) ? order.totalPrice : 0;

  // Pagination logic
  const paginatedItems = order?.items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil((order?.items.length || 0) / ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="container my-5">
      <h1 className="text-center mb-4">Order Details</h1>

      {status === 'loading' && <div className="text-center">Loading...</div>}
      {status === 'failed' && <Alert variant="danger">{error}</Alert>}
      {!order && <Alert variant="warning">Order not found!</Alert>}

      {order && (
        <Card>
          <Card.Body>
            <h5 className="card-title">Order ID: {order.id || order._id}</h5>
            <p><strong>Status:</strong> {order.status}</p>
            {order.discountAmount > 0 && (
        <p><strong>Discount Amount:</strong> {currency}{order.discountAmount.toFixed(2)}</p>
      )}
      <p><strong>Final Price:</strong> {currency}{(order.finalPrice || 0).toFixed(2)}</p>
            <p><strong>Total Price:</strong> {currency}{totalPrice.toFixed(2)}</p>
            <p><strong>Delivery Charge:</strong> {currency}{order.deliveryCharge.toFixed(2)}</p>

            <p><strong>Total Quantity:</strong> {order.items.reduce((sum, item) => sum + item.quantity, 0)}</p>

            <hr />
            <Row>
              {order.address && (
                <Col md={6}>
                  <h3>Shipping Address</h3>
                  <p><strong>Name:</strong> {order.address?.fullname}</p>
                  <p><strong>Phone:</strong> {order.address?.phone}</p>
                  <p><strong>Street:</strong> {order.address?.street}</p>
                  <p><strong>City:</strong> {order.address?.city}</p>
                  <p><strong>State:</strong> {order.address?.state}</p>
                  <p><strong>Zip Code:</strong> {order.address?.zip}</p>
                  <p><strong>Country:</strong> {order.address?.country}</p>
                </Col>
              )}
              <Col md={6}>
                <h5>Order Tracking</h5>
                <p>Status: {order.status || 'Pending'}</p>
              </Col>
            </Row>
            <hr />
            <h5>Items:</h5>
            <Table responsive bordered hover>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Actions</th>
                  <th>Tracking Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={item.id || Math.random()}>
                    <td>
                      <Image
                        src={
                          Array.isArray(item.product?.images) && item.product.images.length > 0
                            ? item.product.images[0].url
                            : '/default-image.jpg'
                        }
                        alt={item.product?.name || 'Product Image'}
                        style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                        rounded
                      />
                    </td>
                    <td>{item.product?.name || 'Product not available'}</td>
                    <td>{item.quantity}</td>
                    <td>{currency}{item.price.toFixed(2)}</td>
                    <td>
                    {['DELIVERED'].includes(item.trackingStatus) && (
                        <Button
                          onClick={() => confirmReturnRequest(order._id, item._id)}
                          variant="info"
                          size="sm"
                          className="me-2"
                        >
                          Request Return
                        </Button>
                      )}
                      {['PENDING', 'SHIPPED'].includes((item.trackingStatus || '').toUpperCase()) && (
                        <Button
                          onClick={() => confirmCancelOrder(order._id, item._id)}
                          variant="danger"
                          size="sm"
                          className="me-2"
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                    <td>
                      <p>Tracking Status: {item.trackingStatus || 'PENDING'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

              {/* Download Invoice Button */}
  <DownloadInvoice orderId={order._id} />
            <Pagination className="justify-content-center">
              {[...Array(totalPages)].map((_, index) => (
                <Pagination.Item
                  key={index}
                  active={index + 1 === currentPage}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </Pagination.Item>
              ))}
            </Pagination>
          </Card.Body>
          <Card.Footer className="text-center">
            <Button variant="primary" onClick={handleBack}>
              Back to Orders
            </Button>
          </Card.Footer>
        </Card>
      )}
    </div>
  );
};

export default OrderDetailsPage;
