import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShopContext } from '../../context/ShopContext';
import { assets } from '../../assets/assets';
import '../../styles/product.css';
import Relatedproducts from '../components/Relatedproducts';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart } from '../../redux/slices/cartSlice';
import { fetchProducts } from '../../redux/slices/productSlice';
import { useNavigate } from 'react-router-dom';
import { selectUser, selectUserId } from '../../redux/slices/authSlice';
import Swal from 'sweetalert2';

import { fetchWishlist, addToWishlist, removeFromWishlist, selectWishlistItems } from '../../redux/slices/wishlistSlice.js';
const Product = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);
  const { currency } = useContext(ShopContext);

  const user = useSelector(selectUser);
  const userId = useSelector(selectUserId);

  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState('');
  const [discountPrice, setDiscountPrice] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [selectedSize, setSelectedSize] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const wishlistItems = useSelector(selectWishlistItems);


  const navigate = useNavigate();

  // Debug Redux state
  console.log('Raw state.auth:', useSelector((state) => state.auth));
  console.log('Redux User:', user); // Should log the full user object with _id
  console.log('User ID in Product component:', userId);

  // Fetch products using Redux on component mount
  useEffect(() => {
    if (products.length === 0) {
      dispatch(fetchProducts());
    }
    if (userId) {
      dispatch(fetchWishlist(userId));
    }
  }, [dispatch, products, userId]);

  // Fetch product data when the component is mounted
  useEffect(() => {
    if (products?.length > 0) {
      const foundProduct = products.find((item) => item._id === id);
      if (foundProduct) {
        setProductData(foundProduct);
        setImage(foundProduct.images?.[0]?.url || 'https://via.placeholder.com/150');
      } else {
        setErrorMessage('Product not found.');
        toast.error('Product not found.');
      }
    }
  }, [id, products]);



  // Toggle wishlist status
  const handleWishlist = () => {
    const isInWishlist = wishlistItems.some((item) => item.productId === productData._id);
  
    // Validate selectedSize
    if (!selectedSize) {
      toast.error('Please select a size.');
      return;
    }
  
    // Find the size data
    const sizeData = productData.sizes.find((size) => size.size === selectedSize);
    if (!sizeData) {
      toast.error('Selected size is not available.');
      return;
    }
  
    // Toggle wishlist state
    if (isInWishlist) {
      toast.error('Product is already in Wishlist');
      return;
    }
      dispatch(
        addToWishlist({
          userId,
          productId: productData._id,
          name: productData.name,
          price: productData.price,
          sizes: productData.sizes, // Include sizes
          images: productData.images.map(img => ({
            url: img.url, // Extract URL
            public_id: img.public_id, // Extract public_id
          })),
        })
      );
      toast.success('Added to Wishlist');
    }
  

  

  // Add to cart logic with SweetAlert
  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Please select a size.');
      return;
    }
    console.log('Adding to cart with userId:', userId);
    const sizeData = productData.sizes.find((size) => size.size === selectedSize);

    if (!sizeData || sizeData.stock <= 0) {
      toast.error('Selected size is out of stock.');
      return;
    }
    const productId = productData._id
    console.log('productID',productId)
const images = productData.images?.length > 0 ? productData.images : [{ url: 'https://via.placeholder.com/150', public_id: 'placeholder' }];
dispatch(
  addToCart({
    userId,
    productId: productData._id,
    name: productData.name,
    category: productData.category,
    size: selectedSize,
    price: productData.price,
    stock: sizeData.stock,
    images,
    quantity: 1,
  })
);
console.log('Images:', productData.images);

   
    Swal.fire({
      title: 'Success!',
      text: 'Product added to cart!',
      icon: 'success',
      confirmButtonText: 'Go to Cart',
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/cart');
      }
    });
  };

  if (loading) return <div>Loading product...</div>;
  if (errorMessage) return <div>{errorMessage}</div>;

  return productData ? (
    <div className="container py-4">
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Home</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/collection">Products</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {productData.name}
          </li>
        </ol>
      </nav>

      <div className="row">
        {/* Left Column: Thumbnails */}
        <div className="col-2 d-flex flex-column gap-3">
          {Array.isArray(productData.images) && productData.images.length > 0 ? (
            productData.images.map((imgObj, index) => (
              <img
                src={imgObj.url}
                key={index}
                alt={`Thumbnail ${index}`}
                className="img-thumbnail"
                onClick={() => setImage(imgObj.url)}
                style={{ cursor: 'pointer' }}
              />
            ))
          ) : (
            <p>No images available</p>
          )}
        </div>

        {/* Center Column: Main Image */}
        <div className="col-5 text-center">
          <div className="image-zoom-container">
            <img
              src={image}
              alt="Selected Product"
              className="img-fluid border zoom-image"
              style={{ maxHeight: '500px', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Right Column: Product Information */}
        <div className="col-5">
          <h1 className="fw-bold fs-3">{productData.name}</h1>
          
          <div className="d-flex align-items-center gap-1 mt-2">
            {Array(5)
              .fill(0)
              .map((_, idx) => (
                <img
                  key={idx}
                  src={idx < 4 ? assets.star_icon : assets.star_dull_icon}
                  alt=""
                  className="me-1"
                  style={{ width: '20px' }}
                />
              ))}
            <p className="ms-2 mb-0">Reviews(122)</p>
          </div>
          <h6 className="mt-4 fs-3">{productData.brand}</h6>

          <p className="mt-4 fs-2 fw-bold text-danger">
            {currency}{discountPrice || productData.price}
          </p>
          <p className="fs-6 text-muted">
            Original Price: <del>{currency}{productData.price}</del>
          </p>
          <p className="mt-3">{productData.description}</p>

          {/* Display Sizes and Stock */}
          <div>
            <h3>Select Size</h3>
            <div className="sizes d-flex flex-wrap gap-2">
              {productData.sizes && productData.sizes.length > 0 ? (
                productData.sizes.map(({ size, stock }) => (
                  <button
                    key={size}
                    className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                    disabled={stock <= 0}
                  >
                    {size} ({stock > 0 ? `${stock} in stock` : 'Out of stock'})
                  </button>
                ))
              ) : (
                <p className="text-danger">No sizes available</p>
              )}
            </div>
          </div>

    

          {/* Error Message */}
          {errorMessage && (
            <div className="alert alert-danger mt-3" role="alert">
              {errorMessage}
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            className="btn btn-primary w-100 py-2 my-2"
            onClick={handleAddToCart}
            disabled={!selectedSize || productData.sizes.find(size => size.size === selectedSize)?.stock <= 0}
          >
            Add to Cart
          </button>

            {/* Wishlist Button */}
      
            <button
            className={`btn w-100 py-2 my-2 ${
              wishlistItems.some((item) => item.productId === productData._id) ? 'btn-success' : 'btn-outline-success'
            }`}
            onClick={handleWishlist}
          >
            {wishlistItems.some((item) => item.productId === productData._id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
          </button>
        </div>
      </div>
          {/* Related Products */}
          <Relatedproducts category={productData.category._id}/>
      
    </div>
  ) : (
    <div>Product not found</div>
  );
};

export default Product;