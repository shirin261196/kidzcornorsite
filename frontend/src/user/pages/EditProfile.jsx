import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  fetchUserProfile,
  updateUserProfile,
  selectUserProfile,
  selectUserProfileLoading,
  selectUserProfileError,
} from '../../redux/slices/userSlice.js';

const EditProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Selectors to access the Redux state
  const profile = useSelector(selectUserProfile);
  const loading = useSelector(selectUserProfileLoading);
  const error = useSelector(selectUserProfileError);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
  });

  // Fetch profile if not available and initialize form data
  useEffect(() => {
    if (!profile) {
      dispatch(fetchUserProfile());
    } else {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
      });
    }
  }, [dispatch, profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [name]: '', // Clear errors for the current field
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Enter a valid email address';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await dispatch(updateUserProfile(formData)).unwrap();
      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Your profile has been successfully updated!',
        confirmButtonText: 'OK',
      }).then(() => navigate('/profile'));
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.message || 'Something went wrong. Please try again.',
        confirmButtonText: 'OK',
      });
    }
  };

  return (
    <div className="edit-profile container py-5">
      <h2 className="mb-4">Edit Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group mb-3">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
          />
          {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
        </div>
        <div className="form-group mb-3">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
          />
          {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
      {error && <p className="text-danger mt-3">{error}</p>}
    </div>
  );
};

export default EditProfile;
