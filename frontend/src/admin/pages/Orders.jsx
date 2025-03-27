import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchOrders,
  selectOrders,
  selectOrderStatus,
  selectOrderError,
} from '../../redux/slices/adminSlice.js';
import { Button, Table, Spinner, Alert, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { currency } from '../../App';
import Swal from 'sweetalert2';
import axios from 'axios';

const AdminOrderManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const orders = useSelector(selectOrders);
  const status = useSelector(selectOrderStatus);
  const error = useSelector(selectOrderError);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

   // Sort orders by createdAt in descending order
   const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = sortedOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
 

  const handleApproveReturn = async (orderId, itemId) => {
    const confirmResult = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to approve this return?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'No, cancel',
    });

    if (confirmResult.isConfirmed) {
      try {
        const response = await axios.put(
          `http://localhost:4000/admin/orders/${orderId}/items/${itemId}/approve-return`,
          { approvalStatus: 'APPROVED' }, // Send approval status
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
            },
          }
        );

        // Refresh orders after approval
        Swal.fire('Approved!', response.data.message, 'success');
        dispatch(fetchOrders()); // Refresh the orders list from the server
      } catch (error) {
        Swal.fire('Error!', error.response?.data?.message || 'Failed to approve return', 'error');
      }
    }
  };
  
  
  const handleProcessRefund = async (orderId) => {
    const confirmResult = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to process a refund for this order?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, process it!',
      cancelButtonText: 'No, cancel',
    });

    if (confirmResult.isConfirmed) {
      try {
        const response = await axios.post(
          `http://localhost:4000/admin/orders/${orderId}/process-refund`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`, // User token
              AdminAuthorization: `Bearer ${localStorage.getItem('adminToken')}`,
            },
          }
        );

        Swal.fire('Refund Processed!', response.data.message, 'success');
        dispatch(fetchOrders()); // Refresh orders after processing refund
      } catch (error) {
        Swal.fire('Error!', error.response?.data?.message || 'Failed to process refund', 'error');
      }
    }
  };
  
  
  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }
  return (
    <div className="container-fluid py-4">
      <h2 className="text-center mb-4">Admin Order Management</h2>

     

      
  
      <div className="table-responsive">
        <Table striped bordered hover className="text-center">
          <thead className="thead-dark">
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Items</th>
              <th>Total Price</th>
              <th>Status</th>
              <th>Payment Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
          {currentOrders?.map((order, index) => (
    <tr key={order._id}>
      <td>{index + 1}</td>
      <td>{order.user?.name || 'Unknown'}</td>
      <td>
  {order.items?.map((item) => {
    console.log("Item Data:", item); // Debugging: Check item structure
    return (
      <div key={item.product?._id || item._id || Math.random()}>
        <strong>{item.product?.name || 'No Name'}</strong> - {currency}
        {item.price * item.quantity}
      </div>
    );
  })}
</td>

                <td>
                  {/* Calculate total price for the order */}
                  {order.items.reduce(
                    (acc, item) => acc + item.price * item.quantity,
                    0
                  )}
                </td>
                {/* Display the order status in the Status column */}
                <td>
                  <span
                    className={`ms-2 ${
                      order.status === 'DELIVERED'
                        ? 'text-success'
                        : order.status === 'CANCELLED'
                        ? 'text-danger'
                        : 'text-warning'
                    }`}
                  >
                    {order.status}
                  </span>
                </td>

                <td>
                  {/* Display the payment status */}
                  <span
                    className={`ms-2 ${
                      order.paymentStatus === 'Paid'
                        ? 'text-success'
                        : 'text-danger'
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </td>
                <td>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/admin/orders/${order._id}`)}
                  >
                    View Order
                  </Button>
                 
                  {order.items.map((item) => (
  item.trackingStatus === 'RETURN_REQUESTED' && ( // Check for 'RETURN_REQUESTED' in item trackingStatus
    <Button
      key={item._id} // Unique key for the item
      variant="success"
      size="sm"
      className="ms-2"
      onClick={() => handleApproveReturn(order._id, item._id)} // Pass orderId and productId
    >
      Approve Return
    </Button>
  )
))}



{order.items.some(item => item.trackingStatus === 'RETURN_APPROVED') && !order.refundProcessed && (
    <Button
      variant="warning"
      size="sm"
      className="ms-2"
      onClick={() => handleProcessRefund(order._id)}
    >
      Process Refund
    </Button>
  )}

                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div className="d-flex justify-content-center">
        {totalPages > 1 && (
          <Pagination>
            <Pagination.Prev disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} />
            {[...Array(totalPages)].map((_, i) => (
              <Pagination.Item
                key={i}
                active={i + 1 === currentPage}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} />
          </Pagination>
        )}
      </div>
    </div>
  );
};

export default AdminOrderManagement;
