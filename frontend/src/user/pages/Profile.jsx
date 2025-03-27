import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserProfile, selectUserProfile } from '../../redux/slices/userSlice';
import { fetchAddresses, addAddress, updateAddress, deleteAddress, selectAddresses } from '../../redux/slices/addressSlice';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, ListGroup, Button, Form, Modal, Pagination } from 'react-bootstrap';
import { selectUser } from '../../redux/slices/authSlice';
import Swal from 'sweetalert2';
import { fetchWalletBalance, selectWalletBalance } from '../../redux/slices/orderSlice';
import { creditWallet, debitWallet } from '../../redux/slices/walletSlice';
import axios from 'axios';
import WalletHistory from '../components/WalletHistory.jsx';

const UserProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userProfile = useSelector(selectUserProfile);
  const addresses = useSelector(selectAddresses);
  const user = useSelector(selectUser);

const [transactionAmount, setTransactionAmount] = useState(0);

  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of addresses per page
  const [activeTab, setActiveTab] = useState('profile');
  const [showModal, setShowModal] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const walletBalance = useSelector(selectWalletBalance);
  const [addressForm, setAddressForm] = useState({
    _id: '',
    fullname: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: '',
    zip: '',
  });

  useEffect(() => {
    dispatch(fetchUserProfile(user.id));
    dispatch(fetchAddresses());
  }, [dispatch, user.id]);

  useEffect(() => {
    dispatch(fetchWalletBalance());
  }, [dispatch]); // Re-fetch when walletBalance changes
  
  const handleWalletAction = (action) => {
    if (!transactionAmount || transactionAmount <= 0) {
      Swal.fire('Invalid amount', 'Please enter a valid amount.', 'error');
      return;
    }
  
    if (action === 'credit') {
      dispatch(creditWallet({ userId: user.id, amount: transactionAmount }))
        .unwrap()
        .then(() => {
          Swal.fire('Success', 'Wallet credited successfully.', 'success');
          setTransactionAmount(0);
        })
        .catch((error) => {
          Swal.fire('Error', error.message, 'error');
        });
    } else if (action === 'debit') {
      if (transactionAmount > walletBalance) {
        Swal.fire('Error', 'Insufficient wallet balance.', 'error');
        return;
      }
  
      // Store transaction details in localStorage or Redux
      localStorage.setItem(
        "walletPayment",
        JSON.stringify({ userId: user.id, amount: transactionAmount })
      );
  
      // Navigate to checkout page
      navigate('/checkout', {
        state: { 
          paymentMethod: "Wallet", 
          amount: transactionAmount 
        }
      });
    }
  };
  
  
  const handleRazorpayPayment = async () => {
    if (!transactionAmount || transactionAmount <= 0) {
      Swal.fire('Invalid amount', 'Please enter a valid amount.', 'error');
      return;
    }

    try {
      const requestBody = {
        amount: transactionAmount,  // ✅ Make sure this is a valid number
        userId: user.id,  // ✅ Make sure this exists
      };


  console.log("Sending Request:", requestBody);

      // Call backend to create a Razorpay order
      const response = await axios.post('http://localhost:4000/wallet/create-order', {
        amount: transactionAmount,
        userId: user.id
      }, {
        headers: { 'Content-Type': 'application/json' }  // ✅ Ensure JSON headers
      });
      

      const orderData = await response.data

      if (!orderData.success) {
        throw new Error(orderData.message || 'Payment initiation failed');
      }

      const options = {
        key: 'rzp_test_IfwKL0Uf6Xpv2h', // Replace with your Razorpay Key ID
        amount: orderData.amount,
        currency: 'INR',
        name: 'KIDZCORNER',
        description: 'Add Money to Wallet',
        order_id: orderData.order.id,
        handler: async (response) => {
          // Call backend to verify payment
          const verifyResponse = await axios.post('http://localhost:4000/wallet/verify-payment', {
            ...response,
            userId: user.id,
            amount: transactionAmount
          }, {
            headers: { 'Content-Type': 'application/json' },
          });
          const verifyData = await verifyResponse.data;
          if (verifyData.success) {
            dispatch(creditWallet({ userId: user.id, amount: transactionAmount }));
            Swal.fire('Success', 'Wallet credited successfully.', 'success');
            setTransactionAmount(0);
          } else {
            Swal.fire('Error', 'Payment verification failed.', 'error');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone || '',
        },
        theme: { color: '#3399cc' },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  const handleTabChange = (tab) => setActiveTab(tab);
  const handleTab = (tab) => {
    if (tab === "orders") {
      navigate("/orders");
    }
  };

  const handleLogout = () => navigate('/login');

  const handleModalClose = () => {
    setShowModal(false);
    setAddressForm({
      _id: '',
      fullname: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      country: '',
      zip: '',
    });
  };

  const handleModalShow = (address = {}) => {
    setAddressForm(address);
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = () => {
    const addressData = { ...addressForm, userId: user.id };
    if (!addressForm.fullname || !addressForm.phone || !addressForm.street || 
      !addressForm.city || !addressForm.state || !addressForm.zip || !addressForm.country) {
    alert('All fields are required');
    return;
  }
    if (addressForm._id) {
      dispatch(updateAddress({ addressId: addressForm._id, ...addressForm }));
    } else {
      dispatch(addAddress(addressData));
    }
    handleModalClose();
  };

  const handleDeleteAddress = (addressId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this address? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteAddress({ addressId }));
        Swal.fire('Deleted!', 'The address has been deleted.', 'success');
      }
    });
  };

  // Pagination Logic
  const totalPages = Math.ceil(addresses.length / itemsPerPage);
  const currentAddresses = addresses.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };


  return (
    <Container className="my-5">
      <Row>
        {/* Sidebar */}
        <Col xs={3} className="bg-light p-3">
          <ListGroup>
            <ListGroup.Item
              action
              active={activeTab === 'profile'}
              onClick={() => handleTabChange('profile')}
            >
              Profile Settings
            </ListGroup.Item>
            <ListGroup.Item
              action
              active={activeTab === 'orders'}
              onClick={() => handleTab('orders')}
            >
              Orders
            </ListGroup.Item>
            <ListGroup.Item
              action
              active={activeTab === 'addresses'}
              onClick={() => handleTabChange('addresses')}
            >
              Manage Addresses
            </ListGroup.Item>
            <ListGroup.Item action onClick={() => navigate('/forgot-password')}>
              Reset Password
            </ListGroup.Item>
            <ListGroup.Item
  action
  active={activeTab === 'wallet'}
  onClick={() => handleTabChange('wallet')}
>
  Wallet
</ListGroup.Item>

            <ListGroup.Item action onClick={handleLogout}>
              Logout
            </ListGroup.Item>
          </ListGroup>
        </Col>

        {/* Content */}
        <Col xs={9}>
          {activeTab === 'profile' && (
            <div>
              <h2>Profile Settings</h2>
              <div className="d-flex">
                <img
                  src={userProfile?.avatarUrl}
                  alt="Profile"
                  className="profile-avatar me-3"
                  style={{ width: '100px', height: '100px', borderRadius: '50%' }}
                />
                <div>
                  <p>Name: {user?.name}</p>
                  <p>Email: {user?.email}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2>Your Orders</h2>
              {/* Render orders */}
            </div>
          )}
{activeTab === 'wallet' && (
  <div>
    <h2>Wallet</h2>
    <p>Your wallet balance: ₹{walletBalance || 0}</p>
    
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>Transaction Amount</Form.Label>
        <Form.Control
          type="number"
          value={transactionAmount}
          onChange={(e) => setTransactionAmount(parseFloat(e.target.value))}
        />
      </Form.Group>
      
      <Button variant="success" onClick={handleRazorpayPayment} className="me-2">
        Add Money via Razorpay
      </Button>
      
      <Button
        variant="danger"
        onClick={() => handleWalletAction('debit')}
        disabled={walletBalance < transactionAmount}
      >
        Spend Money
      </Button>
    </Form>
<WalletHistory/>
  
  </div>
)}



          {activeTab === 'addresses' && (
            <div>
              <h2>Manage Addresses</h2>
              <Button className="mb-3" onClick={() => handleModalShow()}>
                Add Address
              </Button>
              <ListGroup>
                {(Array.isArray(currentAddresses) ? currentAddresses : []).map((address) => (
                  <ListGroup.Item key={address._id} className="d-flex justify-content-between">
                    <div>
                      <p>
                        {address.fullname}, {address.phone}
                      </p>
                      <p>
                        {address.street}, {address.city}
                      </p>
                      <p>
                        {address.state} - {address.zip}
                      </p>
                    </div>
                    <div>
                      <Button variant="primary" className="me-2" onClick={() => handleModalShow(address)}>
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => handleDeleteAddress(address._id)}>
                        Delete
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              {/* Pagination Controls */}
              <Pagination>
                <Pagination.Prev
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                />
                {[...Array(totalPages)].map((_, index) => (
                  <Pagination.Item
                    key={index}
                    active={index + 1 === currentPage}
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                />
              </Pagination>
            </div>
          )}
        </Col>
      </Row>

      {/* Address Modal */}
      <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>{addressForm._id ? 'Edit Address' : 'Add Address'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                name="fullname"
                value={addressForm.fullname}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={addressForm.phone}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Street</Form.Label>
              <Form.Control
                type="text"
                name="street"
                value={addressForm.street}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
              <Form.Control
                type="text"
                name="city"
                value={addressForm.city}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>State</Form.Label>
              <Form.Control
                type="text"
                name="state"
                value={addressForm.state}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Zip Code</Form.Label>
              <Form.Control
                type="text"
                name="zip"
                value={addressForm.zip}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Country</Form.Label>
              <Form.Control
                type="text"
                name="country"
                value={addressForm.country}
                onChange={handleFormChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleFormSubmit}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserProfile;
