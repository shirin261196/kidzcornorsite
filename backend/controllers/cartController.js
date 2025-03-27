import Cart from "../models/cartModel.js";
import Coupon from "../models/couponModel.js";
import Offer from "../models/offerModel.js";
import productModel from "../models/productModel.js";
import Wishlist from "../models/wishlistModel.js";



// Fetch Cart
export const getCart = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const cart = await Cart.findOne({ userId })
      .populate({
        path: "items.product",
        select: "name sizes images price stock category applicableCoupons",
      })
      .populate({
        path: "appliedOffers",
        select: "offerDescription productId discount expiryDate isActive", // Ensure productId is included
      })
      .populate("appliedCoupon")
    
      .exec();

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    console.log("Cart items before filtering:", cart.items);

    // Filter out items that are out of stock
    const validItems = cart.items.filter((item) => {
      if (!item.product) {
        console.warn(`Cart contains a missing product. Item ID: ${item._id}`);
        return false; // Remove null products
      }
    
      const selectedSize = item.product.sizes?.find((s) => s.size === item.size);
      console.log('Item stock during filtering:', selectedSize ? selectedSize.stock : null);
      
      return selectedSize && selectedSize.stock > 0;
    });
    

    // Get current date for offer expiry checks
    const now = new Date();

    // Filter valid offers (active and not expired)
    const validOffers = cart.appliedOffers.filter(
      (offer) => offer.isActive && new Date(offer.expiryDate) > now
    );

    // Map items to apply offers
    cart.items = validItems.map((item) => {
      // Find applicable offers for each product
      const applicableOffers = validOffers.filter(
        (offer) =>
          offer.productId &&
          item.product._id &&
          offer.productId.toString() === item.product._id.toString()
      );

      // Attach the applicable offers to the item
      item.appliedOffers = applicableOffers;

      // Calculate offer discount for the item
      const offerDiscount = applicableOffers.reduce(
        (maxDiscount, offer) => Math.max(maxDiscount, offer.discount || 0),
        0
      );

      // Calculate the item's total price after applying the discount
      item.totalPrice = (item.product.price - offerDiscount) * item.quantity;

      return item;
    });

    // Recalculate total price and total quantity
    cart.totalPrice = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
    cart.totalQuantity = cart.items.reduce((acc, item) => acc + item.quantity, 0);

    // Recalculate final price based on applied coupon and discount amount
    const finalPrice = cart.totalPrice - (cart.discountAmount || 0);

    // Construct the final response object
    const updatedCart = {
      ...cart.toObject(),
      finalPrice,
    };

    // Save the updated cart if necessary
    await cart.save();

    res.status(200).json({ data: updatedCart });
  } catch (error) {
    console.error('Error fetching cart:', error);
    next(error);
  }
};


// Add Item to Cart
export const addItemToCart = async (req, res, next) => {
  let { userId, productId, size, quantity } = req.body;

  console.log('Request to add to cart:', req.body);

  try {
    // Step 1: Handle missing productId (derive it from wishlist or cart if needed)
    if (!productId) {
      const wishlist = await Wishlist.findOne({ userId });
      if (wishlist) {
        console.log('Wishlist items:', wishlist.items);
        const wishlistItem = wishlist.items.find((item) => item.size === size);
        productId = wishlistItem?.productId?.toString(); // Safely access productId
        console.log('Derived productId from wishlist:', productId);
      }

      if (!productId) {
        return res.status(400).json({ message: 'Product ID is missing or invalid' });
      }
    }

    // Step 2: Fetch product details
    const productData = await productModel.findOne({ _id: productId, deleted: false });
    if (!productData) {
      console.log('Product not found for ID:', productId);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Fetched product details:', productData);

    // Step 3: Find or create the user's cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [], totalPrice: 0, totalQuantity: 0 });
    }

    // Step 4: Check if the item already exists in the cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.size === size
    );

   // Calculate discount price inline
  const discountPrice =
  productData.applicableCoupons?.length > 0
    ? productData.price * (1 - Math.max(...productData.applicableCoupons.map((c) => c.discount)) / 100)
    : productData.price;

    if (existingItemIndex > -1) {
      // Update existing item quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        category: productData.category,
        size,
        quantity,
        price: productData.price,
        discountPrice, // Add discountPrice
        stock: productData.stock,
        images: productData.images,
      });
    }

    // Step 5: Update total price, discount, and quantity
    cart.totalPrice = cart.items.reduce((acc, item) => acc + (item.discountPrice || item.price) * item.quantity, 0);
    cart.discountAmount = cart.items.reduce((acc, item) => acc + (item.price - (item.discountPrice || item.price)) * item.quantity, 0);
    cart.finalPrice = Math.max(cart.totalPrice - cart.discountAmount, 0);
    cart.totalQuantity = cart.items.reduce((acc, item) => acc + item.quantity, 0);

    // Step 6: Save the updated cart
    await cart.save();

    // Step 7: Optionally remove the item from the wishlist
    const wishlist = await Wishlist.findOne({ userId });
    if (wishlist) {
      console.log('Wishlist items:', wishlist.items);
      wishlist.items = wishlist.items.filter(
        (item) =>
          item.productId && // Check for valid productId
          (item.productId.toString() !== productId || item.size !== size)
      );
      await wishlist.save();
    }
    
    

    res.json(cart);
  } catch (error) {
    console.error('Error adding item to cart:', error);
    next(error);
  }
};




// Update Item Quantity
export const updateItemQuantity = async (req, res, next) => {
  const { userId, productId, size, quantity } = req.body;

  try {
    // Find the user's cart and populate the items with product data
    const cart = await Cart.findOne({ userId }).populate('items.product');
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    // Log to verify the cart and the request
    console.log('Cart:', cart);
    console.log('Looking for product ID:', productId, 'and size:', size);

    // Find the item in the cart by matching the productId and size
    const itemIndex = cart.items.findIndex(item => 
      item.product._id.toString() === productId && item.size === size
    );

    // If item not found, log and return error
    if (itemIndex === -1) {
      console.log('Item not found at index:', itemIndex);
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Update the quantity
    cart.items[itemIndex].quantity = quantity;

    // Recalculate the total price and quantity
    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );
    cart.discountAmount = cart.items.reduce(
      (acc, item) =>
        acc + item.product.price * item.quantity * (item.product.discount || 0) / 100,
      0
    );
    cart.finalPrice = Math.max(cart.totalPrice - cart.discountAmount, 0);
    cart.totalQuantity = cart.items.reduce((acc, item) => acc + item.quantity, 0);

    // Save the updated cart
    await cart.save();

    res.json(cart);
  } catch (error) {
    next(error);
  }
};


// Remove Item from Cart
export const removeItemFromCart = async (req, res, next) => {
  const { userId, productId } = req.params; // Destructure productId and userId from URL
  const { size } = req.body; // Get size from the request body

  try {
    const cart = await Cart.findOne({ userId }).populate('items.product');
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    // Ensure productId is an ObjectId for proper comparison
    const productObjectId = productId && productId.match(/^[0-9a-fA-F]{24}$/) ? productId : null;

    if (!productObjectId) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    // Find the index of the item based on productId and size
    const itemIndex = cart.items.findIndex(
      (item) => item.product._id.toString() === productObjectId && item.size === size
    );

    if (itemIndex === -1) return res.status(404).json({ message: 'Item not found in cart' });

    // Remove the item from the cart
    cart.items.splice(itemIndex, 1);

    // Update the total price and total quantity of the cart
    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );
    cart.discountAmount = cart.items.reduce(
      (acc, item) =>
        acc + item.product.price * item.quantity * (item.product.discount || 0) / 100,
      0
    );
    cart.finalPrice = Math.max(cart.totalPrice - cart.discountAmount, 0);
    cart.totalQuantity = cart.items.reduce((acc, item) => acc + item.quantity, 0);

    // Save the updated cart
    await cart.save();

    res.json(cart);
  } catch (error) {
    next(error);
  }
};



// Clear Cart
export const clearCart = async (req, res, next) => {
  const { userId } = req.params;

  try {
    // Find the user's cart and remove all items
    const result = await Cart.updateOne(
      { userId },
      { $set: { items: [] } } // Clear all items in the cart
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Cart not found or already empty.' });
    }

    res.status(200).json({ message: 'Cart cleared successfully.' });
  } catch (error) {
   next(error)
  }
};


// Apply Offer to Cart
export const applyOfferToCart = async (req, res, next) => {

    try {
      const { userId,offerId} = req.body;
      console.log("Request Payload:", req.body);

  
      // Fetch the user's cart
      const cart = await Cart.findOne({ userId }).populate("items.product");
  
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }
      console.log("Applying offer:", offerId);
    
      
      // Fetch active offers
      const offers = await Offer.find({
        isActive: true,
        expiryDate: { $gte: new Date() },
      });
  
      if (!offers.length) {
        return res.status(200).json({
          message: "No active offers available",
          discountAmount: 0,
          finalPrice: cart.totalPrice,
        });
      }
  
      // Variables to track discount and applied offers
      let discountAmount = 0;
      const appliedOffers = [];
      let offerApplied = false; 
  
      // Calculate discount for each item in the cart
      for (const item of cart.items) {
        console.log("Cart Item Product ID:", item.product._id);
        console.log("Cart Item Category ID:", item.product.category?._id);
        // Check for product-specific offers
        const productOffer = offers.find(
          (offer) =>
            offer.offerType === "Product" &&
            String(offer.productId) === String(item.product._id) &&
            (!offerId || String(offer._id) === String(offerId)) // Prioritize selected offerId
        );
        
  
        if (productOffer) {
          const itemDiscount =
            (productOffer.discount / 100) * item.price * item.quantity;
          discountAmount += itemDiscount;
          appliedOffers.push(productOffer._id);
          offerApplied = true;
        }
      
        // Check for category-specific offers (if categories exist on the product)
        const categoryOffer = offers.find(
          (offer) =>
            offer.offerType === "Category" &&
            String(offer.categoryId) === String(item.product.category?._id) // Adjust if categoryId exists in product
        );
  
        if (categoryOffer) {
          const itemDiscount =
            (categoryOffer.discount / 100) * item.price * item.quantity;
          discountAmount += itemDiscount;
          appliedOffers.push(categoryOffer._id);
          offerApplied = true;
        }
      }
  
      if (!offerApplied) {
        return res.status(200).json({
          success: false,
          message: "No applicable offers found for the items in your cart.",
          discountAmount: 0,
          finalPrice: cart.totalPrice,
        });
      }
      // Update cart with calculated values
      const finalPrice = cart.totalPrice - discountAmount;
  
      cart.discountAmount = discountAmount;
      cart.finalPrice = finalPrice;
      cart.appliedOffers = appliedOffers;
  
      // Save the updated cart
      await cart.save();
      console.log("Updated Cart:", cart);
  
      res.status(200).json({ success: true,
        message: "Offers applied successfully",
       cart
      });
    } catch (error) {
   next(error)
    }
  };
  


// Apply Coupon to Cart
export const applyCouponToCart = async (req, res, next) => {
  console.log('Request body:', req.body);
  const { userId, couponCode } = req.body;

  // Log the incoming request
  console.log('Received couponCode:', couponCode);
  console.log('Request body:', req.body);

  try {
    const cart = await Cart.findOne({ userId }).populate('items.product');

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const coupon = await Coupon.findOne({ 
      code: couponCode, 
      isActive: true, 
      expiryDate: { $gte: new Date() } // Ensure expiryDate is in the future
    });
    console.log('Current Date:', new Date());


    if (!coupon) return res.status(404).json({ message: "Coupon not valid or expired" });

      // Check if the coupon is already applied
      if (cart.appliedCoupon && cart.appliedCoupon.toString() === coupon._id.toString()) {
        return res.status(400).json({ message: "Coupon already applied" });
      }
  
      // Calculate the total price and discount
      const totalPrice = cart.items.reduce((total, item) => {
        return total + (item.price || 0) * (item.quantity || 1);
      }, 0);
  
          // Validate the minPurchaseAmount condition
    if (totalPrice < coupon.minPurchaseAmount) {
      return res.status(400).json({
        message: `The minimum purchase amount to use this coupon is ${coupon.minPurchaseAmount}`,
      });
    }
      const discountAmount = (totalPrice * coupon.discount) / 100; // Ensure discount doesn't exceed total price
      const finalPrice = Math.max(totalPrice - discountAmount, 0);
  
      // Update the cart with discount and final price
      cart.appliedCoupon = coupon._id;
      cart.discountAmount = discountAmount;
      cart.finalPrice = finalPrice;
      cart.totalPrice = totalPrice;
    console.log('Cart totalPrice:', cart.totalPrice);
    console.log('Cart discountAmount:', cart.discountAmount);
    console.log('Final Price:', cart.finalPrice);

    await cart.save();
    res.status(200).json({ success: true, message: 'Coupon applied successfully', cart });

  } catch (error) {
    next(error);
  }
};

export const removeOffer = async (req, res, next) => {
  try {
    const { userId } = req.body;

    // Fetch the user's cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Reset discount-related fields
    cart.discountAmount = 0;
    cart.finalPrice = cart.totalPrice; // Reset to original total price
    cart.appliedOffers = [];

    // Save the updated cart
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Offer removed successfully",
      cart,
    });
  } catch (error) {
    next(error);
  }
};

export const removeCoupon= async (req, res, next) => {
  try {
    const { userId } = req.body;

    // Fetch the user's cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Reset coupon-related fields
    cart.discountAmount = 0;
    cart.finalPrice = cart.totalPrice; // Reset to original total price
    cart.appliedCoupon = null;

    // Save the updated cart
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Coupon removed successfully",
      cart,
    });
  } catch (error) {
    next(error);
  }
};



// Remove Offer or Coupon
export const removeDiscount = async (req, res, next) => {
  const { userId, type } = req.body;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    if (type === "offer") {
      cart.appliedOffer = null;
    } else if (type === "coupon") {
      cart.appliedCoupon = null;
    }

    // Recalculate total price and discount
    cart.discountAmount = 0;
    cart.items.forEach((item) => {
      item.discountPrice = item.price;
    });
    cart.finalPrice = cart.totalPrice;

    await cart.save();
    res.status(200).json({ message: "Discount removed successfully", cart });
  } catch (error) {
    next(error);
  }
};