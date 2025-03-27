import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCart,
  updateCartItemQty,
  removeFromCart,
  clearCart,
  addToCart,
  selectCartItems,
  setDiscountAmount
} from '../../redux/slices/cartSlice.js';
import { selectUserId } from '../../redux/slices/authSlice';
import { currency } from '../../App.jsx';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userId = useSelector(selectUserId);
  const items = useSelector(selectCartItems) || []; // Ensure it's an empty array if undefined
  const cart = useSelector(state => state.cart.cart) || {}; // Ensure it's an empty object if undefined
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);

  const discountAmount = cart?.discountAmount || 0;

  const [couponCode, setCouponCode] = useState('');  // State for the coupon code
  const [couponDiscount, setCouponDiscount] = useState(0); // Store the coupon discount
  const [couponApplied, setCouponApplied] = useState(false); // Whether the coupon is applied
  const [offerDiscount, setOfferDiscount] = useState(0); // Store the offer discount
  const [offerApplied, setOfferApplied] = useState(false); // Whether the offer is applied
  


  const MAX_QUANTITY_PER_PRODUCT = 5;

  const totalPrice = items.reduce((total, item) => {
    const price = item.discountPrice ?? item.price ?? 0;
    const quantity = item.quantity ?? 0;
    return total + price * quantity;
  }, 0);
  const appliedCoupon = couponApplied && couponDiscount > 0;
  const appliedOffer = offerApplied && offerDiscount > 0;
  const isCouponAppliedFirst = appliedCoupon && !appliedOffer;
  const finalPrice = Math.max(
    totalPrice - (appliedCoupon ? couponDiscount : 0) - (appliedOffer ? offerDiscount : 0),
    0 // Ensure no negative final price
  );
  



  useEffect(() => {
    if (userId) {
      dispatch(fetchCart(userId))
      
        .then((response) => {
          if (Array.isArray(response.payload.items)) {
            console.log("Cart Data:", response.payload); 
            // Remove items with 0 stock
            const itemsWithZeroStock = response.payload.items.filter((item) => {
              const stock = item.product?.sizes?.find((s) => s.size === item.size)?.stock;
              return stock === 0;
            });

            if (itemsWithZeroStock.length > 0) {
              itemsWithZeroStock.forEach((item) => {
                dispatch(removeFromCart({ userId, productId: item.product._id, size: item.size }));
              });
              toast.info('Some items were removed due to insufficient stock.');
            }
          }
        })
        .catch((error) => {
          console.error('Error fetching cart:', error);
        });
    }
  }, [dispatch, userId]);

  useEffect(() => {
    const fetchOffers = async () => {
      const token = localStorage.getItem('adminToken');
      try {
        const response = await axios.get('http://localhost:4000/admin/offers', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOffers(response.data.offers);
      } catch (error) {
        console.error('Failed to fetch offers:', error);
      }
    };
  
    fetchOffers();
  }, []); // Include token in the dependency array if it can change
  



const handleApplyOffer = async () => {
  if (appliedCoupon) {
    toast.error("You cannot apply both a coupon and an offer at the same time.");
    return;
  }
  if (!selectedOffer) {
    toast.error("Please select an offer.");
    return;
  }


  try {
    const response = await axios.post(
      'http://localhost:4000/user/cart/apply-offer',
      { userId, offerId: selectedOffer },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, // Pass user token for auth
        },
      }
    );
    if (response.data.success) {
      // Assuming the updated cart is returned in the response
      const updatedCart = response.data.cart;
      setOfferDiscount(updatedCart.discountAmount);
      dispatch(setDiscountAmount(updatedCart.discountAmount));  // Dispatch to Redux

      setOfferApplied(true);

      dispatch(fetchCart(userId)); // Update the cart in the global state
      toast.success('Offer applied successfully!');
    } else {
      toast.error(response.data.message || "No applicable offers found.");
    }
  } catch (error) {
    console.error('Error applying offer:', error);
    toast.error('Could not apply offer. Please try again.');
  }
};

  

  const handleCouponApply = () => {
    if (appliedOffer) {
      toast.error("You cannot apply both coupon and offer discounts simultaneously.");
      return;
    }
    // Assuming you have some API to validate and apply the coupon
    if (!couponCode) {
      toast.error('Please enter a coupon code.');
      return;
    }
console.log('couponcode',couponCode);
    // Example of coupon validation logic (replace with your real logic)
    axios.post('http://localhost:4000/user/cart/apply-coupon', { userId, couponCode })
    .then(response => {
      console.log('Response:', response.data);
   
      // Check for success condition
      if (response.data.success) {
        dispatch(fetchCart(userId));
        setCouponDiscount(response.data.cart.discountAmount); // Set the discount from the API response
        dispatch(setDiscountAmount(response.data.cart.discountAmount));  // Dispatch to Redux
        setCouponApplied(true);

        toast.success(response.data.message || 'Coupon applied successfully!');
      } else {
        toast.error(response.data.message || 'Invalid coupon code.');
      }
    })
    .catch(error => {
      console.error("Error applying coupon:", error);

      // Ensure error.response exists
      if (error.response) {
        console.log("Error Response Data:", error.response.data);

        const errorMessage = error.response.data?.message || "Failed to apply the coupon. Please try again.";

        // Show toast error for minimum purchase issue
        if (errorMessage.toLowerCase().includes("minimum purchase amount")) {
          toast.error(errorMessage);
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error("Server error. Please try again.");
      }
    });
};
  const handleRemoveOffer = async () => {
    try {
      const response = await axios.post(
        "http://localhost:4000/user/cart/remove-offer",
        { userId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
  
      if (response.data.success) {
        // Reset offer-related state
        setOfferDiscount(0);
        setOfferApplied(false);
        dispatch(fetchCart(userId)); // Refresh the cart in the global state
        toast.success("Offer removed successfully!");
      }
    } catch (error) {
      console.error("Error removing offer:", error);
      toast.error("Failed to remove offer. Please try again.");
    }
  };
  const handleRemoveCoupon = async () => {
  try {
    const response = await axios.post(
      "http://localhost:4000/user/cart/remove-coupon",
      { userId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.data.success) {
      // Reset coupon-related state
      setCouponDiscount(0);
      setCouponApplied(false);
      dispatch(fetchCart(userId)); // Refresh the cart in the global state
      toast.success("Coupon removed successfully!");
    }
  } catch (error) {
    console.error("Error removing coupon:", error);
    toast.error("Failed to remove coupon. Please try again.");
  }
};


  const handleQuantityChange = (productId, size, newQuantity) => {
    const productStock = items.find(
      (item) => item.product?._id === productId && item.size === size
    )?.product?.sizes?.find((s) => s.size === size)?.stock;

    if (Number.isInteger(newQuantity) && newQuantity > 0) {
      if (newQuantity > productStock) {
        Swal.fire({
          icon: 'warning',
          title: 'Insufficient Stock',
          text: 'The quantity exceeds the available stock.',
        });
        return;
      }

      if (newQuantity > MAX_QUANTITY_PER_PRODUCT) {
        Swal.fire({
          icon: 'warning',
          title: 'Quantity Limit Reached',
          text: `You can only add up to ${MAX_QUANTITY_PER_PRODUCT} units of a product.`,
        });
        return;
      }

      dispatch(updateCartItemQty({ userId, productId, size, quantity: newQuantity }))
        .then(() => {
          dispatch(fetchCart(userId));
          toast.success('Cart updated successfully!');
        })
        .catch((error) => {
          console.error('Error updating cart item:', error);
          toast.error('Failed to update the cart.');
        });
    } else {
      toast.error('Invalid quantity value!');
    }
  };

  const handleRemoveItem = (productId, size) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this item from the cart?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove it!',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(removeFromCart({ userId, productId, size }))
          .then(() => {
            dispatch(fetchCart(userId));
            toast.success('Item removed from the cart!');
          })
          .catch((error) => {
            console.error('Error removing cart item:', error);
            toast.error('Failed to remove the item.');
          });
      }
    });
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Cart is Empty',
        text: 'Please add some items to your cart before proceeding to checkout.',
      });
      return;
    }

    navigate('/checkout');
  };

  const handleClearCart = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will remove all items from your cart.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, clear it!',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(clearCart(userId))
        .unwrap()
        .then(() => {
          dispatch(fetchCart(userId));
          toast.success('Cart cleared successfully!');
        })
        .catch((error) => {
          console.error('Error clearing cart:', error);
          toast.error('Failed to clear the cart.');
        });
      
      }
    });
  };

  return (
    <div className="container my-5">
      <h2>Your Shopping Cart</h2>
      <div className="row">
        <div className="col-md-8">
          {items.length > 0 ? (
            items
              .filter(item => item.product && item.product._id && item.product.sizes.some(s => s.stock > 0)) // Filter out out-of-stock products
              .map((item) => {
                const stock = item.product?.sizes?.find((s) => s.size === item.size)?.stock ?? 'N/A';
                return (
                  <div key={`${item.product._id}-${item.size}`} className="cart-item mb-3 p-3 border rounded shadow-sm">
                    <div className="row">
                      <div className="col-3">
                        <img
                          src={item.product?.images?.[0]?.url || '/default-image.jpg'}
                          alt={item.product?.name || 'Product Image'}
                          className="img-fluid"
                        />
                      </div>
                      <div className="col-6">
                        <h5>{item.product?.name}</h5>
                        <p>Size: {item.size}</p>
                        <p>Stock: {stock}</p>
                        <p>
                          Price: {currency}
                          {item.discountPrice?.toFixed(2) || item.price.toFixed(2)}
                        </p>
                        <p>Quantity: {item.quantity}</p>
                        {cart.appliedOffers?.length > 0 ? (
                          <div>
                            <h6>Applied Offers:</h6>
                            {cart.appliedOffers.map((offer) => (
                              <div key={offer._id} className="badge bg-success text-wrap me-2">
                                {offer.offerDescription} - {offer.discount}% off
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted">No offers applied</p>
                        )}
                      </div>
                      <div className="col-3 text-center">
                        <div>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleQuantityChange(item.product._id, item.size, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="mx-2">{item.quantity}</span>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleQuantityChange(item.product._id, item.size, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="btn btn-danger mt-2"
                          onClick={() => handleRemoveItem(item.product._id, item.size)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
          ) : (
            <p>Your cart is empty.</p>
          )}
        </div>
  
        <div className="col-md-4">
          <div className="cart-summary p-3 border rounded shadow-sm">
            <h5>Cart Summary</h5>
            <hr />
            <p>Subtotal: {currency}{totalPrice.toFixed(2)}</p>
  
            {/* Display only the applied discount based on priority */}
            {appliedCoupon && appliedOffer ? (
              <>
                {isCouponAppliedFirst ? (
                  <p>Coupon Discount: -{currency}{couponDiscount.toFixed(2)}</p>
                ) : (
                  <p>Offer Discount: -{currency}{offerDiscount.toFixed(2)}</p>
                )}
              </>
            ) : appliedCoupon ? (
              <p>Coupon Discount: -{currency}{couponDiscount.toFixed(2)}</p>
            ) : appliedOffer ? (
              <p>Offer Discount: -{currency}{offerDiscount.toFixed(2)}</p>
            ) : null}
  
            <p>Total: {currency}{finalPrice.toFixed(2)}</p>
          </div>
  
          {appliedOffer && (
    <button className="btn btn-danger w-100 mt-2" onClick={handleRemoveOffer}>
      Remove Offer
    </button>
  )}

  {/* Remove Coupon Button */}
  {appliedCoupon && (
    <button className="btn btn-danger w-100 mt-2" onClick={handleRemoveCoupon}>
      Remove Coupon
    </button>
  )}
          <div className="mb-3">
            <h5>Available Offers</h5>
            <div className="d-flex flex-wrap">
              {offers.map((offer) => (
                <div
                  key={offer._id}
                  className={`offer-card p-3 m-2 border rounded ${
                    selectedOffer === offer._id ? 'border-success' : 'border-secondary'
                  }`}
                  style={{
                    width: '18rem',
                    cursor: 'pointer',
                    background: selectedOffer === offer._id ? '#e9f7e9' : '#f8f9fa',
                  }}
                  onClick={() => setSelectedOffer(offer._id)}
                >
                  <h6>{offer.offerDescription}</h6>
                  <p>
                    <strong>Discount:</strong> {offer.discount}% off
                  </p>
                  <p>
                    <strong>Expiry:</strong> {new Date(offer.expiryDate).toLocaleDateString()}
                  </p>
                  {selectedOffer === offer._id && <p className="text-success">Selected</p>}
                </div>
              ))}
            </div>
            <button
              className="btn btn-success mt-2 w-100"
              onClick={handleApplyOffer}
              disabled={!selectedOffer}
            >
              Apply Offer
            </button>
          </div>
  
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter Coupon Code"
            />
            <button className="btn btn-info w-100 mt-2" onClick={handleCouponApply}>
              Apply Coupon
            </button>
          </div>
  
          <button className="btn btn-warning" onClick={handleClearCart}>
            Clear Cart
          </button>
  
          <button className="btn btn-primary w-100 mt-3" onClick={handleCheckout}>
            Checkout
          </button>
        </div>
      </div>
      <button className="btn btn-primary mt-3" onClick={() => navigate('/')}>
        Continue Shopping
      </button>
    </div>
  );
  
}
export default CartPage;
