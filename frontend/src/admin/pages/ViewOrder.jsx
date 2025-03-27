import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders, selectOrders, updateTrackingStatus, approveReturnRequest } from '../../redux/slices/adminSlice.js';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Table, Alert, Dropdown, Row, Col } from 'react-bootstrap';
import { currency } from '../../App.jsx';
import Swal from 'sweetalert2'; // Import SweetAlert

const ViewOrder = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const orders = useSelector(selectOrders);

  // Find the specific order by ID
  const order = orders.find((o) => o._id === orderId);

  useEffect(() => {
    if (!orders.length) {
      dispatch(fetchOrders()); // Fetch orders if not already loaded
    }
  }, [dispatch, orders]);

  const handleTrackingStatusUpdate = async (productId, trackingStatus) => {
    try {
      await dispatch(updateTrackingStatus({ orderId, productId, trackingStatus }));
      dispatch(fetchOrders()); // Refresh orders after status update
    } catch (error) {
      console.error('Error updating tracking status:', error);
    }
  };

  const handleCancelOrder = (productId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to cancel this order?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'No, keep it',
    }).then((result) => {
      if (result.isConfirmed) {
        handleTrackingStatusUpdate(productId, 'CANCELLED'); // Change the status to 'CANCELLED'
        Swal.fire('Cancelled!', 'The order has been cancelled.', 'success');
      }
    });
  };



  // Determine order status based on tracking statuses
  const getOrderStatus = () => {
    const trackingStatuses = order.items.map((item) => item.trackingStatus);

    if (trackingStatuses.every((status) => status === 'DELIVERED')) return 'DELIVERED';
    if (trackingStatuses.every((status) => status === 'CANCELLED')) return 'CANCELLED';
    return 'PENDING';
  };

  if (!order) {
    return <Alert variant="danger">Order not found.</Alert>;
  }

  return (
    <div className="container my-4">
      <h2>Order Details</h2>
      <p><strong>Order ID:</strong> {order._id}</p>
      <p><strong>User:</strong> {order.user?.name || 'Unknown'}</p>
      <p><strong>Total Price:</strong> {currency}{order.totalPrice}</p>
                  {order.discountAmount > 0 && (
              <p><strong>Discount Amount:</strong> {currency}{order.discountAmount.toFixed(2)}</p>
            )}
            <p><strong>Final Price:</strong> {currency}{(order.finalPrice || 0).toFixed(2)}</p>
      <p><strong>Total Quantity:</strong> {order.items.reduce((sum, item) => sum + item.quantity, 0)}</p>

      <p><strong>Order Status:</strong> {getOrderStatus()}</p>

 {/* Add Payment Status and Method */}
 <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
 <p>
  <strong>Payment Method:</strong> {order.paymentMethod || 'N/A'}
</p>
  

      <h3>Shipping Address</h3>
      <p><strong>Name:</strong> {order.address?.fullname}</p>
      <p><strong>Phone:</strong> {order.address?.phone}</p>
      <p><strong>Street:</strong> {order.address?.street}</p>
      <p><strong>City:</strong> {order.address?.city}</p>
      <p><strong>State:</strong> {order.address?.state}</p>
      <p><strong>Zip Code:</strong> {order.address?.zip}</p>
      <p><strong>Country:</strong> {order.address?.country}</p>

      <h3>Order Items</h3>
      <Table striped bordered hover responsive>
  <thead>
    <tr>
      <th>Product</th>
      <th>Image</th>
      <th>Quantity</th>
      <th>Price</th>
      <th>Total</th>
      <th>Tracking Status</th>
      <th>Actions</th>
      <th>Change Status</th>
    </tr>
  </thead>
  <tbody>
    {order.items.map((item) => (
      <tr key={item.product._id}>
        <td>{item.product.name}</td>
        <td>
          {item.product.images && item.product.images.length > 0 ? (
            <img
              src={item.product.images[0].url}
              alt={item.product.name}
              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
            />
          ) : (
            <span>No image available</span>
          )}
        </td>
        <td>{item.quantity}</td>
        <td>{currency}{item.price}</td>
        <td>{currency}{item.price * item.quantity}</td>
        <td>{item.trackingStatus}</td>
        <td>
  {item.trackingStatus !== 'CANCELLED' && item.trackingStatus !== 'DELIVERED' && (
    <Button
      variant="danger"
      size="sm"
      className="ms-2"
      onClick={() => handleCancelOrder(item.product._id)}
    >
      Cancel Order
    </Button>
          )}
   
   
        </td>
        <td>
        {item.trackingStatus !== 'CANCELLED' && item.trackingStatus !== 'DELIVERED' && (
            <Dropdown className="d-inline ms-2">
              <Dropdown.Toggle size="sm" variant="info">Change</Dropdown.Toggle>
              <Dropdown.Menu>
                {['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                  <Dropdown.Item
                    key={status}
                    onClick={() => handleTrackingStatusUpdate(item.product._id, status)}
                  >
                    {status}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          )}
        </td>
        <td>
                <Button
                  variant="link"
                  onClick={() => navigate(`/admin/orders/${order._id}/products/${item.product._id}`)}
                >
                  View Details
                </Button>
              </td>
      </tr>
    ))}
  </tbody>
</Table>


      <Button variant="secondary" onClick={() => window.history.back()}>
        Go Back
      </Button>
    </div>
  );
};

export default ViewOrder;
