import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart, fetchCart, removeFromCart, selectDiscountAmount, selectFinalPrice, setDiscountAmount } from '../../redux/slices/cartSlice';
import { selectCartItems, selectTotalPrice } from '../../redux/slices/cartSlice';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Table, Image, Row, Col, Card } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import Swal from 'sweetalert2';
import 'react-toastify/dist/ReactToastify.css';
import { currency } from '../../App';
import { addAddress, fetchAddresses, selectAddresses, updateAddress } from '../../redux/slices/addressSlice';
import { createOrder, fetchOrderHistory } from '../../redux/slices/orderSlice';
import axios from 'axios';
import { debitWallet } from '../../redux/slices/walletSlice';

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);
  const totalPrice = useSelector(selectTotalPrice);
  const finalPrice = useSelector(selectFinalPrice);
  const addresses = useSelector(selectAddresses);
  const DELIVERY_CHARGE = 50; 
  const discountAmount = useSelector(state => state.cart.discountAmount);
console.log('discountamount',discountAmount)
const walletBalance = useSelector((state) => state.wallet.walletBalance);
const user = useSelector((state) => state.user.user);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Razorpay');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullname: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const userId = localStorage.getItem('userId');
  console.log(userId);

  useEffect(() => {
    if (userId) {
      dispatch(fetchCart(userId));
      dispatch(fetchAddresses(userId));
    }
  }, [dispatch, userId]);

  const handleRemoveItem = (productId, size) => {
    dispatch(removeFromCart({ productId, size, userId })).then(() => {
      dispatch(fetchCart(userId));
    });
    toast.success('Item removed from cart.');
  };

  const handleAddAddress = () => {
    const areFieldsValid = (address) => {
      return Object.values(address).every((field) => field && field.trim());
    };

    if (areFieldsValid(newAddress)) {
      const addressPayload = {
        userId,
        ...newAddress,
      };

      if (isEditing) {
        dispatch(updateAddress({ ...addressPayload, addressId: newAddress._id }));
        toast.success('Address updated successfully!');
      } else {
        dispatch(addAddress(addressPayload));
        toast.success('Address added successfully!');
      }

      setShowAddressForm(false);
      setIsEditing(false);
      setNewAddress({
        fullname: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
      });
    } else {
      toast.error('Please fill all fields');
    }
  };

  const handleEditAddress = (address) => {
    setIsEditing(true);
    setShowAddressForm(true);
    setNewAddress({
      _id: address._id,
      fullname: address.fullname,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
    });
  };
 

  const handlePurchase = async (orderAmount) => {
    const userId = localStorage.getItem('userId');
  
    if (!userId) {
      console.error("User ID is undefined.");
      Swal.fire("Error", "User session expired. Please log in again.", "error");
      return false;
    }
  
    // Check if wallet has enough balance
    if (walletBalance < orderAmount) {
      Swal.fire('Error', 'Insufficient wallet balance.', 'error');
      return false;
    }
  
    try {
      // Deduct amount from wallet
      await dispatch(debitWallet({ userId, amount: orderAmount })).unwrap();
  
      // Return success
      return true;
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Wallet Payment Failed',
        text: error.message || 'Failed to process wallet payment. Please try again.',
      });
      return false;
    }
  };
  
  const handlePlaceOrder = async () => {
    const userId = localStorage.getItem('userId');
    console.log(userId);

    if (!userId) {
        console.error("User ID is undefined.");
        Swal.fire("Error", "User session expired. Please log in again.", "error");
        return;
    }

    try {
        if (!selectedAddress) {
            Swal.fire({
                icon: 'warning',
                title: 'Address Required',
                text: 'Please select an address before placing the order.',
            });
            return;
        }

        const DELIVERY_CHARGE = 50;

        const orderItems = cartItems.map((item) => ({
            product: item.product?._id || item.productId,
            category: item.category,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
        }));

        const address = addresses.find((address) => address._id === selectedAddress);
        const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
        const finalPrice = totalPrice - discountAmount + DELIVERY_CHARGE;

        // console.log("Total Price:", totalPrice);
        // console.log("Discount Amount:", discountAmount);
        // console.log("Delivery Charge:", DELIVERY_CHARGE);
        // console.log("Final Price:", finalPrice);

        // Confirm Before Placing Order for COD
        if (selectedPaymentMethod === 'COD') {
            if (finalPrice > 1000) {
                Swal.fire({
                    icon: 'error',
                    title: 'COD Not Allowed',
                    text: 'Cash on Delivery is not available for orders above ₹1000. Please choose a different payment method.',
                });
                return;
            }

            const confirmation = await Swal.fire({
                title: 'Confirm Order',
                text: `Are you sure you want to place this order via Cash on Delivery (COD)?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Place Order',
                cancelButtonText: 'Cancel',
            });

            if (!confirmation.isConfirmed) return;
        }

        // Confirm Before Placing Order for Wallet Payment
        if (selectedPaymentMethod === 'Wallet') {
            const confirmation = await Swal.fire({
                title: 'Confirm Order',
                text: `Are you sure you want to use your wallet balance to pay ₹${finalPrice} for this order?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, Pay with Wallet',
                cancelButtonText: 'Cancel',
            });

            if (!confirmation.isConfirmed) return;

            const walletSuccess = await handlePurchase(finalPrice);
            if (!walletSuccess) return;

            const response = await dispatch(
                createOrder({
                    userId,
                    items: orderItems,
                    totalPrice,
                    discountAmount,
                    deliveryCharge: DELIVERY_CHARGE,
                    finalPrice,
                    totalQuantity,
                    address,
                    paymentMethod: 'Wallet',
                })
            );

            if (response.payload) {
                Swal.fire({
                    icon: 'success',
                    title: 'Order Placed Successfully',
                    text: `Your order has been placed successfully using Wallet. Total: ₹${finalPrice}`,
                }).then(() => {
                    dispatch(clearCart(userId));
                    navigate('/orders');
                });
            }
            return;
        }

        // Create Order on the Server
        const response = await dispatch(
            createOrder({
                userId,
                items: orderItems,
                totalPrice,
                discountAmount,
                deliveryCharge: DELIVERY_CHARGE,
                finalPrice,
                totalQuantity,
                address,
                paymentMethod: selectedPaymentMethod,
            })
        );

        console.log("Order Response:", response.payload);

        if (!response.payload) {
            throw new Error("Failed to create order.");
        }

        // Handle COD Order
        if (selectedPaymentMethod === 'COD') {
            Swal.fire({
                icon: 'success',
                title: 'Order Placed Successfully',
                text: `Your COD order has been placed successfully. Total: ₹${finalPrice}`,
            }).then(() => {
                dispatch(clearCart(userId));
                navigate('/orders');
            });
            return;
        }

        // Handle Razorpay Order
        if (selectedPaymentMethod === 'Razorpay') {
            const { razorpayOrderId, amount, currency } = response.payload;

            if (!razorpayOrderId) {
                throw new Error('Failed to create Razorpay order: Missing order ID');
            }

            payNow(razorpayOrderId, amount, currency);
        } else {
            console.error('Invalid payment method selected.');
            throw new Error('Invalid payment method.');
        }
    } catch (error) {
        console.error('Error during order placement:', error);
        Swal.fire({
            icon: 'error',
            title: 'Order Failed',
            text: `There was an error processing your order. Please try again. ${error.message}`,
        });
    }
};


  
  const payNow = (razorpayOrderId, amount, currency) => {
    const options = {
      key: 'rzp_test_IfwKL0Uf6Xpv2h',
      amount: amount,  
      currency: currency,
      name: 'KIDZCORNER',
      description: 'Order Payment',
      image: 'https://example.com/your-logo.png',
      order_id: razorpayOrderId,
      handler: function (response) {
        console.log('Payment Success:', response);
        confirmPayment(response, amount / 100);
      },
      prefill: {
        name: 'Customer Name',
        email: 'customer@example.com',
        contact: '9999999999',
      },
      notes: {
        address: selectedAddress,
      },
      modal: {
        ondismiss: function () {
          Swal.fire({
            icon: 'warning',
            title: 'Payment failed',
            text: 'You have canceled the payment.',
            confirmButtonText: "Go to Orders",
          });
          markPaymentAsFailed(razorpayOrderId);
          window.location.href = "/orders";
        },
      },
    };
  
    const razorpay = new window.Razorpay(options);
  
    razorpay.on('payment.failed', function (response) {
      console.error('Payment Failed:', response.error);
      Swal.fire({
        icon: 'error',
        title: 'Payment Failed',
        text: `Reason: ${response.error.description || 'Unknown Error'}`,
      });
      markPaymentAsFailed(razorpayOrderId);
    });
  
    razorpay.open();
  };
  
  const markPaymentAsFailed = async (razorpayOrderId) => {
    try {
      await axios.post('http://localhost:4000/user/orders/payment-failed', { razorpay_order_id: razorpayOrderId, });
      console.log("Order marked as failed.");
    } catch (error) {
      console.error("Error updating failed payment:", error);
    }
  };
  const confirmPayment = async (response, amount) => {
    if (!amount) {
      Swal.fire({
        icon: 'error',
        title: 'Payment Error',
        text: 'Payment amount is not valid.',
      });
      return;
    }
    console.log("🔍 Sending Order ID:", response.razorpay_order_id);

    try {
      const verifyResponse = await axios.post('http://localhost:4000/user/orders/verify-payment', {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
        amount,
      });
  
      if (verifyResponse.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Payment Successful',
          text: `Your payment of ₹${amount} was successful.`,
        }).then(() => {
          dispatch(clearCart(userId));
          navigate('/orders');
        });
      } else {
        throw new Error("Payment verification failed.");
      }
    } catch (error) {
      console.error("Payment Verification Failed:", error);
      Swal.fire({
        icon: 'error',
        title: 'Payment Verification Failed',
        text: 'We could not verify your payment. Please contact support.',
      });
      await markPaymentAsFailed(response.razorpay_order_id); // Await to ensure it completes
    fetchOrderHistory(); // Refresh order status
    }
  };
  
  console.log("UI - Total Price:", totalPrice);
console.log("UI - Discount Amount:", discountAmount);
console.log("UI - Delivery Charge:", DELIVERY_CHARGE);
console.log("UI - Final Price:", finalPrice);


  return (
    <div className="container py-5">
      <ToastContainer />
      <h2 className="mb-4">Checkout</h2>
      <Row>
        <Col md={8} sm={12} className="mb-4">
          <Table bordered responsive>
            <thead>
              <tr>
                <th>Product</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item, index) => (
                <tr key={`${item.productId}-${item.size || index}`}>
                  <td>
                    <Image
                      src={item.product?.images?.[0]?.url || '/default-image.jpg'}
                      alt={item.product.name}
                      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      fluid
                    />
                  </td>
                  <td>{item.product.name || 'No Name Available'}</td>
                  <td>{item.quantity}</td>
                  <td>{currency}{(item.price * item.quantity).toFixed(2)}</td>
                  <td>
                    <Button
                      variant="danger"
                      onClick={() => handleRemoveItem(item.product?._id, item.size)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>

        <Col md={4} sm={12}>
          <h4>Address</h4>
          <Form.Select
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
          >
            <option>Select Address</option>
            {addresses.map((address) => (
              <option key={address._id} value={address._id}>
                {`${address.fullname}, ${address.street}, ${address.city}, ${address.state}, ${address.zip}, ${address.country}`}
              </option>
            ))}
          </Form.Select>

          <div className="mt-3">
            {addresses.map((address) => (
              <div key={`${address._id}-details`} className="mb-3">
                <div className="d-flex justify-content-between">
                  <div>
                    <strong>{address.fullname}</strong>
                    <p className="mb-0">
                      {`${address.street}, ${address.city}, ${address.state}, ${address.zip}, ${address.country}`}
                    </p>
                    <p>{address.phone}</p>
                  </div>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => handleEditAddress(address)}
                  >
                    Edit
                  </Button>
                </div>
                <hr />
              </div>
            ))}
          </div>

          <Button
            variant="link"
            onClick={() => setShowAddressForm((prev) => !prev)}
            className="my-3"
          >
            {showAddressForm ? 'Cancel' : 'Add Address'}
          </Button>

          {showAddressForm && (
            <Form>
              {['fullname', 'phone', 'street', 'city', 'state', 'zip', 'country'].map((field) => (
                <Form.Group key={field} className="mb-2">
                  <Form.Control
                    type="text"
                    placeholder={field}
                    value={newAddress[field]}
                    onChange={(e) => setNewAddress({ ...newAddress, [field]: e.target.value })}
                  />
                </Form.Group>
              ))}
              <Button onClick={handleAddAddress} className="mt-2">
                {isEditing ? 'Update Address' : 'Save Address'}
              </Button>
            </Form>
          )}
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={4} sm={12} className="offset-md-8">
          <Card>
            <Card.Body>
              <Card.Title>Order Summary</Card.Title>
              <Card.Text>
                <div className="list-summary">
                  <ul className="list-unstyled">
                    {cartItems.map((item, index) => (
                      <li key={`${item.productId || item.product?._id}-${item.size || 'N/A'}-${index}`} className="d-flex justify-content-between">
                        <span>{item.product.name} ({item.size || 'N/A'}) x {item.quantity}</span>
                        <span>{currency}{(item.quantity * item.price).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <hr />
                  <div className="d-flex justify-content-between">
                    <strong>Subtotal</strong>
                    <span>{currency}{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between">
  <strong>Shipping</strong>
  <span>{currency}{DELIVERY_CHARGE.toFixed(2)}</span> 
</div>
                  <div className="d-flex justify-content-between">
  <strong>Discount</strong>
  <span>-{currency}{discountAmount.toFixed(2)}</span>
</div>
                  <hr />
                  <div className="d-flex justify-content-between">
                    <strong>Total</strong>
                    <span>{currency}{finalPrice.toFixed(2)}</span>
                  </div>
                  <div className="text-center mt-3">
                    <Row className="mt-4">
                      <Col md={8}>
                        <h4>Payment Method</h4>
                        <Form.Group>
                          <Form.Check
                            type="radio"
                            id="razorpay"
                            name="paymentMethod"
                            value="Razorpay"
                            label="Razorpay"
                            checked={selectedPaymentMethod === 'Razorpay'}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          />
                          <Form.Check
                            type="radio"
                            id="cod"
                            name="paymentMethod"
                            value="COD"
                            label="Cash on Delivery"
                            checked={selectedPaymentMethod === 'COD'}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          />
                          <Form.Check
  type="radio"
  id="wallet"
  name="paymentMethod"
  value="Wallet"
  label="Wallet"
  checked={selectedPaymentMethod === 'Wallet'}
  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
/>

                        </Form.Group>
                      </Col>
                    </Row>
                    <Button
                      onClick={handlePlaceOrder}
                      variant="success"
                      className="w-100"
                      disabled={!cartItems.length || !selectedAddress}
                    >
                      Pay Now
                    </Button>
                  </div>
                </div>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Checkout;
