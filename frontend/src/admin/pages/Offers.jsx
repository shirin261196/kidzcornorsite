import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';
import { fetchProducts } from '../../redux/slices/productSlice';
import { fetchCategories } from '../../redux/slices/categorySlice';

const OfferManagement = () => {
  const dispatch = useDispatch();

  // Redux states
  const { products, loading: productsLoading, error: productsError } = useSelector((state) => state.products);
  const { categories, loading: categoriesLoading, error: categoriesError } = useSelector((state) => state.categories);

  const [offers, setOffers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [offerData, setOfferData] = useState({
    _id: '',
    type: '',
    value: '',
    productId: '',
    categoryId: '',
    referrerCode: '',
    expiryDate: '',
  });

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
    fetchOffers();
  }, [dispatch]);

  const fetchOffers = async () => {
    try {
      const response = await axios.get('http://localhost:4000/admin/offers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });
      if (response.data.success) {
        setOffers(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to fetch offers');
    }
  };

  const handleSaveOffer = async () => {
    const sanitizedOfferData = {
      type: offerData.type,
      value: offerData.value,
      expiryDate: offerData.expiryDate,
    };

    if (offerData.type === 'product') {
      sanitizedOfferData.productId = offerData.productId;
    } else if (offerData.type === 'category') {
      sanitizedOfferData.categoryId = offerData.categoryId;
    } else if (offerData.type === 'referrer') {
      sanitizedOfferData.referrerCode = offerData.referrerCode;
    }

    try {
      const response = offerData._id
        ? await axios.put(`http://localhost:4000/admin/offers/${offerData._id}`, sanitizedOfferData, {
            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
          })
        : await axios.post('http://localhost:4000/admin/offers', sanitizedOfferData, {
            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
          });

      if (response.data.success) {
        toast.success('Offer saved successfully');
        setShowModal(false);
        fetchOffers();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to save offer');
    }
  };

  const handleEditOffer = (offer) => {
    setOfferData({
      _id: offer._id,
      type: offer.type,
      value: offer.value,
      productId: offer.productId ? offer.productId._id : '',
      categoryId: offer.categoryId ? offer.categoryId._id : '',
      referrerCode: offer.referrerCode || '',
      expiryDate: offer.expiryDate,
    });
    setShowModal(true);
  };

  const handleDeleteOffer = async (offerId) => {
    try {
      const response = await axios.delete(`http://localhost:4000/admin/offers/${offerId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });
      if (response.data.success) {
        toast.success('Offer deleted successfully');
        fetchOffers();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to delete offer');
    }
  };

  return (
    <div className="container">
      <h2>Offer Management</h2>
      <Button onClick={() => setShowModal(true)}>Add Offer</Button>

      <Table striped bordered>
        <thead>
          <tr>
            <th>#</th>
            <th>Type</th>
            <th>Name</th>
            <th>Value</th>
            <th>Expiry</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer, index) => {
            const productName = offer.productId ? offer.productId.name : 'N/A';
            const categoryName = offer.categoryId ? offer.categoryId.name : 'N/A';

            return (
              <tr key={offer._id}>
                <td>{index + 1}</td>
                <td>{offer.type}</td>
                <td>{offer.type === 'product' ? productName : offer.type === 'category' ? categoryName : 'N/A'}</td>
                <td>{offer.value}</td>
                <td>{new Date(offer.expiryDate).toLocaleDateString()}</td>
                <td>
                  <Button variant="warning" onClick={() => handleEditOffer(offer)}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDeleteOffer(offer._id)}>Delete</Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {/* Add/Edit Offer Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{offerData._id ? 'Edit' : 'Add'} Offer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Type</Form.Label>
              <Form.Control
                as="select"
                value={offerData.type}
                onChange={(e) => setOfferData({ ...offerData, type: e.target.value })}
              >
                <option value="">Select Type</option>
                <option value="product">Product</option>
                <option value="category">Category</option>
                <option value="referrer">Referrer</option>
              </Form.Control>
            </Form.Group>
            {offerData.type === 'product' && (
              <Form.Group>
                <Form.Label>Product</Form.Label>
                <Form.Control
                  as="select"
                  value={offerData.productId}
                  onChange={(e) => setOfferData({ ...offerData, productId: e.target.value })}
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            )}
            {offerData.type === 'category' && (
              <Form.Group>
                <Form.Label>Category</Form.Label>
                <Form.Control
                  as="select"
                  value={offerData.categoryId}
                  onChange={(e) => setOfferData({ ...offerData, categoryId: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            )}
            <Form.Group>
              <Form.Label>Value</Form.Label>
              <Form.Control
                type="number"
                value={offerData.value}
                onChange={(e) => setOfferData({ ...offerData, value: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Expiry Date</Form.Label>
              <Form.Control
                type="date"
                value={offerData.expiryDate}
                onChange={(e) => setOfferData({ ...offerData, expiryDate: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveOffer}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OfferManagement;
