import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { cancelOrder, fetchOrderHistory, selectOrderError, selectOrderHistory, selectOrderStatus } from '../../redux/slices/orderSlice.js';
import { currency } from '../../App.jsx';
import { useNavigate } from 'react-router-dom';
import { Pagination } from 'react-bootstrap';
import { handlePaymentFailure, retryPayment } from '../../redux/slices/orderSlice.js';
import Swal from 'sweetalert2';
import axios from 'axios';


const UserOrderPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const orders = useSelector(selectOrderHistory);
  const status = useSelector(selectOrderStatus);
  const error = useSelector(selectOrderError);

  const userId = localStorage.getItem('userId'); 

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10; // Number of orders to display per page

  useEffect(() => {
    if (userId) {
      dispatch(fetchOrderHistory(userId));
    }
  }, [dispatch, userId]);

  const handleViewDetails = (orderId) => {
    navigate(`/orders/${orderId}`);
  };
  const markPaymentAsFailed = async (razorpayOrderId) => {
    try {
      const response = await axios.post('http://localhost:4000/user/orders/payment-failed', {
        razorpay_order_id: razorpayOrderId, // Match backend expectation
      });
      console.log("Order marked as failed:", response.data);
      return response.data.success;
    } catch (error) {
      console.error("Error updating failed payment:", error);
      throw error; // Propagate error to caller
    }
  };
  const retryPayment = async (orderId) => {
    const confirmRetry = await Swal.fire({
      title: "Retry Payment?",
      text: "Are you sure you want to retry the payment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Retry",
    });
  
    if (!confirmRetry.isConfirmed) {
      return; // User canceled retry
    }
    try {
      const { data } = await axios.post("http://localhost:4000/user/retry-payment", { orderId });
  
      if (!data.success) {
        Swal.fire({
          icon: "error",
          title: "Payment Failed",
          text: "Failed to initiate retry payment.",
        });
        return;
      }
  
      const options = {
        key: "rzp_test_IfwKL0Uf6Xpv2h",
        amount: data.order.finalPrice * 100,
        currency: "INR",
        name: "KIDZCORNER",
        description: "Order Payment",
        order_id: data.newOrderId,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post("http://localhost:4000/user/orders/verify-payment", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: data.order.finalPrice * 100, // Include amount for consistency
            });
  
            if (verifyRes.data.success) {
              Swal.fire({
                icon: "success",
                title: "Payment Successful",
                text: "Your payment has been verified successfully!",
              });
              fetchOrderHistory();
            } else {
              throw new Error("Payment verification failed.");
            }
          } catch (error) {
            console.error("Verification Error:", error);
            Swal.fire({
              icon: "error",
              title: "Verification Failed",
              text: "Payment verification failed. Please try again.",
            });
            await markPaymentAsFailed(response.razorpay_order_id);
            fetchOrderHistory();
          }
        },
        modal: {
          ondismiss: async () => {
            Swal.fire({
              icon: "warning",
              title: "Payment Cancelled",
              text: "You cancelled the payment. Please retry if needed.",
            });
            await markPaymentAsFailed(data.newOrderId);
            fetchOrderHistory();
          },
        },
        prefill: {
          name: "Rehan",
          email: "rehan@example.com",
          contact: "9876543210",
        },
        theme: { color: "#3399cc" },
      };
  
      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", async (response) => {
        Swal.fire({
          icon: "error",
          title: "Payment Failed",
          text: "Payment failed due to an issue. Please retry.",
        });
        await markPaymentAsFailed(data.newOrderId);
        fetchOrderHistory();
      });
  
      rzp1.open();
    } catch (error) {
      console.error("Error retrying payment:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while retrying payment.",
      });
    }
  };
  // Sort orders by date in descending order
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Pagination calculations
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = sortedOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(sortedOrders.length / ordersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container my-5">
      <h1 className="text-center mb-4">My Orders</h1>

      {status === 'loading' && <div className="text-center">Loading...</div>}
      {status === 'failed' && <div className="alert alert-danger text-center">{error}</div>}

      {orders.length === 0 && status !== 'loading' && (
        <div className="text-center">No orders found!</div>
      )}

<ul className="list-group">
  {currentOrders.length > 0 &&
    currentOrders.map((order) => (
      <li
        key={order.id || order._id}
        className="list-group-item d-flex justify-content-between align-items-start"
      >
        <div>
          <h5>Order ID: {order.id || order._id}</h5>
          <p>
            <strong>Status:</strong> {order.status}
          </p>
          <p>
          <strong>Payment Status:</strong> {order.paymentStatus}{' '}
          {order.paymentStatus === 'Failed' && (
  <button onClick={() => retryPayment(order._id)} className="btn btn-warning">
    Retry Payment
  </button>
)}

</p>
          <p>
            <strong>Payment Method:</strong> {order.paymentMethod}
          </p>
          <p>
            <strong>Total Price:</strong> {currency}
            {order.totalPrice && !isNaN(order.totalPrice) ? order.totalPrice.toFixed(2) : 'N/A'}
          </p>
                <p><strong>Final Price:</strong> {currency}{(order.finalPrice || 0).toFixed(2)}</p>
          <p>
            <strong>Order Date:</strong>{' '}
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
          <p>
            <strong>Items:</strong>
          </p>
          <ul>
  {order.items?.length > 0 ? (
    order.items.map((item) => (
      <li key={item._id || Math.random()}>
        {item.product
          ? `${item.product.name} - ${item.quantity} x ${currency}${item.price && !isNaN(item.price) ? item.price.toFixed(2) : 'N/A'}`
          : 'Product no longer available'}
        {item.size && ` (Size: ${item.size})`}
      </li>
    ))
  ) : (
    <li>No items found.</li>
  )}
</ul>

        </div>
        <div>
          <button
            className="btn btn-info btn-sm"
            onClick={() => handleViewDetails(order._id)}
          >
            View Details
          </button>
        </div>
      </li>
    ))}
</ul>


      {/* Pagination */}
      {sortedOrders.length > ordersPerPage && (
        <Pagination className="justify-content-center mt-4">
          <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
          <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
          {[...Array(totalPages).keys()].map((num) => (
            <Pagination.Item
              key={num + 1}
              active={currentPage === num + 1}
              onClick={() => paginate(num + 1)}
            >
              {num + 1}
            </Pagination.Item>
          ))}
          <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
          <Pagination.Last onClick={() => paginate(totalPages)} disabled={currentPage === totalPages} />
        </Pagination>
      )}
    </div>
  );
};

export default UserOrderPage;
