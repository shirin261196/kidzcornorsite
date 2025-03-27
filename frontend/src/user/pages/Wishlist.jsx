import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectWishlistItems, removeFromWishlist, setWishlist} from '../../redux/slices/wishlistSlice.js';
import { addToCart } from '../../redux/slices/cartSlice'; // Assuming you have a cart slice
import { Link } from 'react-router-dom';
import { currency } from '../../App';
import { selectUserId } from '../../redux/slices/authSlice';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const WishlistPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wishlist = useSelector(selectWishlistItems);
  const userId = useSelector(selectUserId);

  // State for tracking selected size
  const [selectedSize, setSelectedSize] = useState(null);

  // Sync the wishlist to localStorage whenever it changes
  useEffect(() => {
    if (wishlist.length > 0) {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist]);
  useEffect(() => {
    console.log("Wishlist items:", wishlist);
  }, [wishlist]);
  

  // Load the wishlist from localStorage on initial load
  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      const parsedWishlist = JSON.parse(savedWishlist);
      dispatch(setWishlist(parsedWishlist));
    }
  }, [dispatch]);

  const handleRemoveFromWishlist = (product) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to remove this product from your wishlist?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(removeFromWishlist({ userId, productId: product.productId }));
        toast.success('Product removed from wishlist');
      }
    });
  };
  

  const handleAddToCart = (product) => {
    if (!product || !product.productId) {
      console.error('Invalid product object:', product);
      return;
    }
  
    // Ensure a size is selected
    if (!selectedSize) {
      toast.error('Please select a size.');
      return;
    }
  
    console.log('Adding Product to Cart:', product);
    console.log('productId', product.productId);
  
    const images = product.images?.length > 0 
      ? product.images 
      : ['https://via.placeholder.com/150'];
  
    const size = selectedSize || 'default';
  
    dispatch(
      addToCart({
        userId,
        productId: product.productId,
        size,
        quantity: 1,
        images,
        stock: product.stock || 0,
        discountPrice: product.discountPrice || product.price,
      })
    )
      .then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          // Remove the product from the wishlist after successfully adding it to the cart
          dispatch(removeFromWishlist({ userId, productId: product.productId }));
          toast.success('Product added to cart and removed from wishlist!');
        } else {
          toast.error('Failed to add product to cart.');
        }
      });
  
    Swal.fire({
      title: 'Success!',
      text: 'Product added to cart!',
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: 'Go to Cart',
      cancelButtonText: 'Continue Shopping',
    }).then((result) => {
      if (result.isConfirmed) navigate('/cart');
    });
  };
  

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">Your Wishlist</h1>
      {wishlist.length === 0 ? (
        <div className="text-center">
          <p>Your wishlist is empty.</p>
        </div>
      ) : (
        <div className="row">
          {wishlist.map((product) => (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4" key={product._id}>
              <div className="card shadow-sm h-100">
              <img
          src={product.images?.[0]?.url || 'https://via.placeholder.com/150'}
          alt={product.name || 'Product Image'}
          className="img-fluid"
        />




                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text">{currency}{product.price}</p>

                  {/* Display Sizes and Stock */}
                  <div>
                    <h3>Select Size</h3>
                    <div className="sizes d-flex flex-wrap gap-2">
                      {product.sizes && product.sizes.length > 0 ? (
                        product.sizes.map(({ size, stock }) => (
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

                  <div className="mt-auto d-flex justify-content-between">
                    <Link to={`/product/${product.productId}`} className="btn btn-primary btn-sm">
                      View Details
                    </Link>
                    <button
                      onClick={() => handleRemoveFromWishlist(product)}
                      className="btn btn-danger btn-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    className="btn btn-success btn-sm mt-2"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
