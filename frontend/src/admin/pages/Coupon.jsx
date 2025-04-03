import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Form, Button, Row, Col, Card, ListGroup } from 'react-bootstrap';
import { useForm } from 'react-hook-form';  // Import react-hook-form
import { fetchProducts } from '../../redux/slices/productSlice';
import { fetchCategories } from '../../redux/slices/categorySlice';
import axios from 'axios';
import Swal from 'sweetalert2';

const CouponManagement = () => {
  const dispatch = useDispatch();
  const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.mykidzcornor.info'
  : 'http://localhost:5001';

  const { products, loading: productsLoading, error: productsError } = useSelector((state) => state.products);
  const { categories, loading: categoriesLoading, error: categoriesError } = useSelector((state) => state.categories);
  const [coupons, setCoupons] = useState([]);
  const [offers, setOffers] = useState([]);

  const [offerType, setOfferType] = useState('Product');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');


  // Fetch products, categories, and offers on component mount
  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
    fetchCoupons();
    fetchOffers();
  }, [dispatch]);

  const fetchCoupons = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin token not found. Please log in.');
      }
  
      const response = await axios.get(`${API_URL}/admin/coupon`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
  
      if (response.data.success) {
        setCoupons(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch coupons.');
      }
    } catch (error) {
      console.error('Error fetching coupons:', error.response?.data || error.message);
      Swal.fire('Error', error.message || 'Error fetching coupons.', 'error');
    }
  };
  
  // Fetch Offers
  const fetchOffers = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin token not found. Please log in.');
      }
  
      const response = await axios.get(`${API_URL}/admin/offers`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
  
      if (response.data.success) {
        setOffers(response.data.offers || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch offers.');
      }
    } catch (error) {
      console.error('Error fetching offers:', error.response?.data || error.message);
      Swal.fire('Error', error.message || 'Error fetching offers.', 'error');
    }
  };
  
  // Handle Coupon Form Submission
  const handleCouponSubmit = async (data) => {
    // Validate the expiry date
    const today = new Date();
    const expiryDate = new Date(data.expiryDate);
  
    if (expiryDate < today) {
      Swal.fire('Error', 'Expiry date must be in the future.', 'error');
      return;
    }
  
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin token not found. Please log in.');
      }
  
      await axios.post(`${API_URL}/admin/coupon`, {
        code: data.couponCode,
        discount: data.discount,
        expiryDate: data.expiryDate,
        minPurchaseAmount: data.minPurchaseAmount,
      }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
  
      Swal.fire('Success', 'Coupon created successfully!', 'success');
    // Re-fetch coupons to reflect the changes
      couponReset();
    } catch (error) {
      console.error('Error creating coupon:', error.response?.data || error.message);
      Swal.fire('Error', error.response?.data?.message || 'Error creating coupon.', 'error');
    }
  };
  
  // Handle Offer Form Submission
  const handleOfferSubmit = async (data) => {
    try {
          // Validate the expiry date
    const today = new Date();
    const expiryDate = new Date(data.offerExpiryDate);

    if (expiryDate < today) {
      Swal.fire('Error', 'Expiry date must be in the future.', 'error');
      return;
    }
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin token not found. Please log in.');
      }
  
      const offerData = {
        offerType: data.offerType,
        offerCode: data.offerCode,
        offerDescription: data.offerDescription,
        discount: data.offerDiscount,
        expiryDate: expiryDate,
      };
  
      // Add the productId or categoryId depending on the offer type
      if (data.offerType === 'Product') {
        offerData.productId = selectedProduct;
      } else if (data.offerType === 'Category') {
        offerData.categoryId = selectedCategory;
      }
  
      let endpoint = `${API_URL}/admin/offers`;
      if (data.offerType === 'Product') {
        endpoint += '/product';
      } else if (data.offerType === 'Category') {
        endpoint += '/category';
      } else if (data.offerType === 'Referral') {
        endpoint += '/referral';
      }
  
      await axios.post(endpoint, offerData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
  
      offerReset();
      // Re-fetch offers to reflect the changes
      Swal.fire('Success', 'Offer created successfully!', 'success');
    } catch (error) {
      console.error('Error creating offer:', error.response?.data || error.message);
      Swal.fire('Error', error.response?.data?.message || 'Error creating offer.', 'error');
    }
  };
  
  // Handle Delete Offer
  const handleDeleteOffer = async (offerId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This offer will be deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const adminToken = localStorage.getItem('adminToken');
          if (!adminToken) {
            throw new Error('Admin token not found. Please log in.');
          }
  
          await axios.delete(`${API_URL}/admin/offers/${offerId}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
          });
  
          Swal.fire('Deleted!', 'Offer has been deleted.', 'success');
          fetchOffers(); // Re-fetch offers to reflect the changes
        } catch (error) {
          console.error('Error deleting offer:', error.response?.data || error.message);
          Swal.fire('Error', error.response?.data?.message || 'Error deleting offer.', 'error');
        }
      }
    });
  };
  
  // Handle Delete Coupon
  const handleDeleteCoupon = async (couponId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This coupon will be deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const adminToken = localStorage.getItem('adminToken');
          if (!adminToken) {
            throw new Error('Admin token not found. Please log in.');
          }
  
          await axios.delete(`${API_URL}/admin/coupon/${couponId}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
          });
  
          Swal.fire('Deleted!', 'Coupon has been deleted.', 'success');
          fetchCoupons(); // Re-fetch coupons to reflect the changes
        } catch (error) {
          console.error('Error deleting coupon:', error.response?.data || error.message);
          Swal.fire('Error', error.response?.data?.message || 'Error deleting coupon.', 'error');
        }
      }
    });
  };
  
  // Handle Deactivate Coupon
 // Handle Toggle Coupon Status
const handleToggleCoupon = async (couponId, isActive) => {
  console.log(`Attempting to ${isActive ? 'deactivate' : 'activate'} coupon with ID:`, couponId);
  
  Swal.fire({
    title: 'Are you sure?',
    text: `This coupon will be ${isActive ? 'deactivated' : 'activated'}!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: `Yes, ${isActive ? 'deactivate' : 'activate'} it!`,
    cancelButtonText: 'Cancel',
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
          throw new Error('Admin token not found. Please log in.');
        }

        await axios.put(`${API_URL}/admin/coupon/deactivate/${couponId}`, {}, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        Swal.fire(
          isActive ? 'Deactivated!' : 'Activated!',
          `Coupon has been ${isActive ? 'deactivated' : 'activated'}.`,
          'success'
        );

        fetchCoupons(); // Refresh coupon list
      } catch (error) {
        console.error('Error updating coupon:', error.response?.data || error.message);
        Swal.fire('Error', error.response?.data?.message || 'Error updating coupon.', 'error');
      }
    }
  });
};

  // React Hook Form initialization for Coupon Form

const { register: couponRegister, handleSubmit: couponHandleSubmit, formState: couponFormState, reset: couponReset } = useForm();


// React Hook Form initialization for Offer Form
const { register: offerRegister, handleSubmit: offerHandleSubmit, formState: offerFormState, reset: offerReset } = useForm();


  return (
    <Container className="my-4">
      <Row>
        {/* Coupon Form */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>Create Coupon</Card.Header>
            <Card.Body>
              <Form onSubmit={couponHandleSubmit(handleCouponSubmit)}>
                <Form.Group controlId="couponCode">
                  <Form.Label>Coupon Code</Form.Label>
                  <Form.Control
                    type="text"
                    {...couponRegister('couponCode', { required: 'Coupon code is required' })}
                    isInvalid={couponFormState.errors.couponCode}
                  />
                  <Form.Control.Feedback type="invalid">
                    {couponFormState.errors.couponCode?.message}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId="discount">
                  <Form.Label>Discount (%)</Form.Label>
                  <Form.Control
                    type="number"
                    {...couponRegister('discount', { required: 'Discount is required' })}
                    isInvalid={couponFormState.errors.discount}
                  />
                  <Form.Control.Feedback type="invalid">
                    {couponFormState.errors.discount?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group controlId="minPurchaseAmount">
  <Form.Label>Minimum Purchase Amount</Form.Label>
  <Form.Control
    type="number"
    {...couponRegister('minPurchaseAmount', { 
      required: 'Minimum purchase amount is required', 
      min: { value: 1, message: 'Amount should be greater than 0' } 
    })}
    isInvalid={couponFormState.errors.minPurchaseAmount}
  />
  <Form.Control.Feedback type="invalid">
    {couponFormState.errors.minPurchaseAmount?.message}
  </Form.Control.Feedback>
</Form.Group>

                <Form.Group controlId="expiryDate">
                  <Form.Label>Expiry Date</Form.Label>
                  <Form.Control
                    type="date"
                    {...couponRegister('expiryDate', { required: 'Expiry date is required' })}
                    isInvalid={couponFormState.errors.expiryDate}
                  />
                  <Form.Control.Feedback type="invalid">
                    {couponFormState.errors.expiryDate?.message}
                  </Form.Control.Feedback>
                </Form.Group>
                <Button variant="primary" type="submit" className="w-100">Create Coupon</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Existing Coupons */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>Existing Coupons</Card.Header>
            <Card.Body>
              {coupons.length === 0 ? (
                <p>No coupons available</p>
              ) : (
                <ListGroup>
                  {coupons.map((coupon) => (
                    <ListGroup.Item key={coupon._id || coupon.id}>
     <strong>Code:</strong> {coupon.code} | 
    <strong>Discount:</strong> {coupon.discount}% | 
    <strong>Min Purchase:</strong> ₹{coupon.minPurchaseAmount} | 
    <strong>Expires on:</strong> {new Date(coupon.expiryDate).toLocaleDateString()}
                      <Button
                        variant="danger"
                        size="sm"
                        className="ml-2"
                        onClick={() => handleDeleteCoupon(coupon._id || coupon.id)}
                      >
                        Delete
                      </Button>
                      <button 
  onClick={() => handleToggleCoupon(coupon._id, coupon.isActive)} 
  className={`btn ${coupon.isActive ? 'btn-danger' : 'btn-success'}`}
>
  {coupon.isActive ? 'Deactivate' : 'Activate'}
</button>

                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Offer Form */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>Create Offer</Card.Header>
            <Card.Body>
              <Form onSubmit={offerHandleSubmit(handleOfferSubmit)}>
                <Form.Group controlId="offerType">
                  <Form.Label>Offer Type</Form.Label>
                  <Form.Control
                    as="select"
                    {...offerRegister('offerType')}
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value)}
                  >
                    <option value="Product">Product</option>
                    <option value="Category">Category</option>
                    <option value="Referral">Referral</option>
                  </Form.Control>
                </Form.Group>

                <Form.Group controlId="offerCode">
                  <Form.Label>Offer Code</Form.Label>
                  <Form.Control
                    type="text"
                    {...offerRegister('offerCode', { required: 'Offer code is required' })}
                    isInvalid={offerFormState.errors.offerCode}
                  />
                  <Form.Control.Feedback type="invalid">
                    {offerFormState.errors.offerCode?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group controlId="offerDescription">
                  <Form.Label>Offer Description</Form.Label>
                  <Form.Control
                    type="text"
                    {...offerRegister('offerDescription', { required: 'Description is required' })}
                    isInvalid={offerFormState.errors.offerDescription}
                  />
                  <Form.Control.Feedback type="invalid">
                    {offerFormState.errors.offerDescription?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group controlId="offerDiscount">
                  <Form.Label>Discount (%)</Form.Label>
                  <Form.Control
                    type="number"
                    {...offerRegister('offerDiscount', { required: 'Discount is required' })}
                    isInvalid={offerFormState.errors.offerDiscount}
                  />
                  <Form.Control.Feedback type="invalid">
                    {offerFormState.errors.offerDiscount?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group controlId="offerExpiryDate">
                  <Form.Label>Expiry Date</Form.Label>
                  <Form.Control
                    type="date"
                    {...offerRegister('offerExpiryDate', { required: 'Expiry date is required' })}
                    isInvalid={offerFormState.errors.offerExpiryDate}
                  />
                  <Form.Control.Feedback type="invalid">
                    {offerFormState.errors.offerExpiryDate?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Display product or category selector based on offer type */}
                {offerType === 'Product' && (
                  <Form.Group controlId="productSelect">
                    <Form.Label>Select Product</Form.Label>
                    <Form.Control
                      as="select"
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      value={selectedProduct}
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                )}
                {offerType === 'Category' && (
                  <Form.Group controlId="categorySelect">
                    <Form.Label>Select Category</Form.Label>
                    <Form.Control
                      as="select"
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      value={selectedCategory}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                )}

                <Button variant="primary" type="submit" className="w-100">Create Offer</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Existing Offers */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>Existing Offers</Card.Header>
            <Card.Body>
              {offers.length === 0 ? (
                <p>No offers available</p>
              ) : (
                <ListGroup>
                  {offers.map((offer) => (
                    <ListGroup.Item key={offer._id}>
                      <strong>Code:</strong> {offer.offerCode} | <strong>Discount:</strong> {offer.discount}% |{' '}
                      <strong>Expires on:</strong> {new Date(offer.expiryDate).toLocaleDateString()}
                      <Button
                        variant="danger"
                        size="sm"
                        className="ml-2"
                        onClick={() => handleDeleteOffer(offer._id)}
                      >
                        Delete
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CouponManagement;
