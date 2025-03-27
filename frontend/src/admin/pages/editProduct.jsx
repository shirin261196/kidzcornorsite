import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { fetchProducts } from '../../redux/slices/productSlice';
import { useDispatch } from 'react-redux';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [product, setProduct] = useState({
    name: '',
    price: '',
    stock: '',
    brand:'',
    category: '',
    description: '',
    sizes: [],
    bestseller: false,
    images: [],
  });

  const [categories, setCategories] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imageURLs, setImageURLs] = useState([]);
  const [cropIndex, setCropIndex] = useState(null);
  const cropperRef = useRef(null);
  const cropperRefs = useRef([]); // Make sure this is initialized
  const [sizes, setSizes] = useState([{ size: '', stock: 0 }]);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/admin/products/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        });
        const data = response.data.product;
        console.log('Fetched Product Data:', data);
        setProduct({
          ...data,
          sizes: data.sizes || [{ size: '', stock: 0 }],
          images: data.images || [],
        });

        setValue('name', data.name);
        setValue('price', data.price);
        setValue('brand',data.brand);
        setValue('stock', data.stock);
        setValue('category', data.category ? data.category._id : ''); 
        setValue('description', data.description);
        setSizes(data.sizes || [{ size: '', stock: 0 }]);
        setValue('bestseller', data.bestseller || false);
      } catch (error) {
        toast.error('Failed to load product details');
      }
    };
    fetchProduct();
  }, [id, setValue]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:4000/admin/category', {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        });

        if (response.data && Array.isArray(response.data.data)) {
          setCategories(response.data.data);
        } else {
          throw new Error('Invalid category data format');
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]);
        toast.error('Failed to fetch categories.');
      }
    };

    fetchCategories();
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const fileURLs = files.map((file) => URL.createObjectURL(file));

    setImageFiles((prev) => [...prev, ...files]);
    setImageURLs((prev) => [...prev, ...fileURLs]);
  };

  const openCropper = (index) => {
    if (cropperRef.current) {
      cropperRef.current.destroy();
    }

    setCropIndex(index);

    const cropperImageContainer = document.querySelectorAll('.uploaded-images img')[index];
    if (!cropperImageContainer) {
      console.error('Unable to find the image element for cropping.');
      return;
    }

    cropperRef.current = new Cropper(cropperImageContainer, {
      aspectRatio: 1,
      viewMode: 2,
      autoCropArea: 0.8,
    });
  };

  const handleCrop = () => {
    if (cropperRef.current) {
      const croppedCanvas = cropperRef.current.getCroppedCanvas();
      croppedCanvas.toBlob((blob) => {
        const croppedFile = new File([blob], `cropped_${imageFiles[cropIndex].name}`, { type: imageFiles[cropIndex].type });
        const updatedFiles = [...imageFiles];
        updatedFiles[cropIndex] = croppedFile;
        setImageFiles(updatedFiles);

        const updatedURLs = [...imageURLs];
        updatedURLs[cropIndex] = URL.createObjectURL(croppedFile);
        setImageURLs(updatedURLs);

        cropperRef.current.destroy();
        cropperRef.current = null;
        setCropIndex(null);
      });
    }
  };

  const handleRemoveImage = (index) => {
    const imageToRemove = product.images[index];
  
    if (imageToRemove?.public_id) {
      // Remove image from the cloud storage if it's an existing one
      axios
        .post(
          'http://localhost:4000/admin/products/delete-image',
          { public_id: imageToRemove.public_id },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
          }
        )
        .then(() => {
          toast.success('Image removed successfully');
          // Update the local state by removing the image from the list
          const updatedImages = [...product.images];
          updatedImages.splice(index, 1);
          setProduct({ ...product, images: updatedImages });
        })
        .catch((err) => {
          console.error('Error removing image:', err);
          toast.error('Failed to remove image');
        });
    } else {
      // Remove image from local preview (newly uploaded)
      const updatedFiles = imageFiles.filter((_, i) => i !== index);
      const updatedURLs = imageURLs.filter((_, i) => i !== index);
      setImageFiles(updatedFiles);
      setImageURLs(updatedURLs);
      toast.success('Image removed');
    }
  };

  const handleSizeChange = (index, field, value) => {
    setSizes((prevSizes) => {
      const updatedSizes = [...prevSizes];
      updatedSizes[index] = { 
        ...updatedSizes[index], 
        [field]: field === 'stock' ? (value === '' ? '' : parseInt(value, 10) || 0) : value 
      };
      return updatedSizes;
    });
  };
  
  
  
  

  const addSizeField = () => {
    setSizes([...sizes, { size: '', stock: 0 }]);
  };

  const removeSizeField = (index) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
  
    // Append existing images (if any) to the FormData
    product.images.forEach((img) => formData.append('existingImages', img.public_id));
  
    // Append new images to FormData
    imageFiles.forEach((file) => formData.append('images', file));
    formData.append('sizes', JSON.stringify(sizes));  // Make sure sizes are updated correctly
  console.log(sizes)
    // Append other product data
    Object.keys(data).forEach((key) => {
      formData.append(key, Array.isArray(data[key]) ? JSON.stringify(data[key]) : data[key]);
    });
  
    try {
      const response = await axios.put(`http://localhost:4000/admin/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
  
      if (response.data.success) {
        toast.success('Product updated successfully.');
  
        // Update the local product state with the new image data from response
        const updatedProduct = response.data.product;
        setProduct({
          ...updatedProduct,
          sizes: updatedProduct.sizes || [{ size: '', stock: 0 }],
          images: updatedProduct.images || [],
        });
        dispatch(fetchProducts()); 
        navigate('/admin/products/list');
      } else {
        toast.error(response.data.message);
      }
    } catch {
      toast.error('Failed to update product.');
    }
  };
  
  

  const allImages = [
    ...product.images.map(img => ({ url: img.url, public_id: img.public_id })), // Assuming `product.images` has `url` and `public_id`
    ...imageURLs.map(url => ({ url, public_id: null })) // Newly uploaded images (no public_id)
  ];

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Edit Product</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input type="text" className="form-control" {...register('name', { required: 'Name is required' })} />
          {errors.name && <p className="text-danger">{errors.name.message}</p>}
        </div>

        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea className="form-control" {...register('description', { required: 'Description is required' })} />
          {errors.description && <p className="text-danger">{errors.description.message}</p>}
        </div>


        <div className="mb-3">
          <label className="form-label">Brand</label>
          <input type="text" className="form-control" {...register('brand', { required: 'Brand is required' })} />
          {errors.brand && <p className="text-danger">{errors.brand.message}</p>}
        </div>

        <div className="mb-3">
          <label className="form-label">Price</label>
          <input type="number" className="form-control" {...register('price', { required: 'Price is required' })} />
          {errors.price && <p className="text-danger">{errors.price.message}</p>}
        </div>

        <div>
  <h3>Sizes and Stock</h3>
  {sizes.map((size, index) => (
    <div key={index} className="d-flex gap-3 mb-3">
      <input
        type="text"
        placeholder="Size"
        value={size.size || ''}
        onChange={(e) => handleSizeChange(index, 'size', e.target.value)}
      />
      <input
        type="number"
        placeholder="Stock"
        value={size.stock === '' ? '' : size.stock}
        onChange={(e) => handleSizeChange(index, 'stock', e.target.value)}
      />
      <button
        type="button"
        className="btn btn-danger"
        onClick={() => removeSizeField(index)}
      >
        Remove
      </button>
    </div>
  ))}
  <button type="button" className="btn btn-secondary" onClick={addSizeField}>
    Add Size
  </button>


        </div>

        <div className="col-md-6">
          <label>Category</label>
          <select className="form-select" {...register('category', { required: 'Category is required' })}>
            <option value="">Select Category</option>
            {Array.isArray(categories) && categories.map((category) => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>
          {errors.category && <small className="text-danger">{errors.category.message}</small>}
        </div>

        <div className="mb-3 form-check">
          <input type="checkbox" className="form-check-input" {...register('bestseller')} />
          <label className="form-check-label">BestSeller</label>
        </div>

        {/* Existing Images */}
        <div className="mb-4">
          <h4>Existing Images</h4>
          <div className="d-flex flex-wrap">
            {allImages.map((img, index) => (
              <div key={index} className="position-relative">
               <img
  src={img.url}
  alt={`Existing Image ${index + 1}`} 
  className="img-thumbnail"
  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
/>

                <button
                  type="button"
                  className="btn btn-danger btn-sm position-absolute top-0 end-0"
                  onClick={() => handleRemoveImage(index)}
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Upload New Images */}
        <div className="mb-3">
          <input
            type="file"
            className="form-control"
            multiple
            onChange={handleImageChange}
          />
        </div>

        {/* Crop Options after Uploading New Images */}
        <div className="d-flex flex-wrap gap-3 mt-3">
            {imageURLs.map((imageURL, index) => (
              <div key={index} className="position-relative">
                <img
                  ref={(el) => (cropperRefs.current[index] = el)}
                  src={imageURL}
                  alt={`Preview ${index + 1}`}
                  className="img-fluid border"
                  style={{ maxWidth: '200px', maxHeight: '200px' }}
                />
                <button
                  type="button"
                  className="btn btn-primary mt-2"
                  onClick={() => handleCrop(index)}
                >
                  Crop Image {index + 1}
                </button>
                <button
                  type="button"
                  className="btn btn-danger mt-2 ms-2"
                  onClick={() => handleRemoveImage(index)}
                >
                  X
                </button>
              </div>
            ))}
          </div>

        {/* Submit Button */}
        <div className="text-center mt-4">
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </div>

      </form>
    </div>
  );
};

export default EditProduct; 