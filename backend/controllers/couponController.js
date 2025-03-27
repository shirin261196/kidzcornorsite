import Coupon from "../models/couponModel.js";
import Product from "../models/productModel.js";

// Create a new coupon
export const createCoupon = async (req, res, next) => {
  const { code, discount, minPurchaseAmount,  expiryDate } = req.body;

  try {
       // Validate that the expiry date is in the future
       if (new Date(expiryDate) < new Date()) {
        return res.status(400).json({ message: 'Expiry date must be in the future' });
      }
      
    const coupon = new Coupon({ code, discount, minPurchaseAmount, expiryDate });
    await coupon.save();
    res.status(201).json({ message: 'Coupon created successfully', coupon });
  } catch (error) {
    next(error);
  }
  };
  

// Get all coupons
export const getCoupons = async (req, res,next) => {
  try {
    const coupons = await Coupon.find();
 

    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    next(error)
  }
};

// Delete a coupon
export const deleteCoupon = async (req, res,next) => {
  try {
    const { couponId } = req.params;
    const coupon = await Coupon.findByIdAndDelete(couponId);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error)
  }
};

// Apply coupon to a product
export const applyCoupon = async (req, res, next) => {
    try {
      const { productId, couponCode } = req.body;
  
      const product = await Product.findById(productId).populate('applicableCoupons');
      const coupon = await Coupon.findOne({ code: couponCode });
  
      if (!product || !coupon) {
        return res.status(404).json({ success: false, message: 'Invalid product or coupon' });
      }
  
      // If you want to apply the coupon to all products, skip product validation
      const isApplicable = product.applicableCoupons.some((appCoupon) => appCoupon.equals(coupon._id));
      if (!isApplicable) {
        // If you want the coupon to be added to the product's applicableCoupons
        product.applicableCoupons.push(coupon._id);
        await product.save();
      }
  
      // Check if the coupon is active and not expired
      if (!coupon.isActive || new Date(coupon.expiryDate) < new Date()) {
        return res.status(400).json({ success: false, message: 'Coupon is expired or inactive' });
      }
  
      const discountedPrice = product.price - product.price * (coupon.discount / 100);
  
      res.json({
        success: true,
        discount: coupon.discount,
        discountedPrice,
      });
    } catch (error) {
      next(error);
    }
  };
  

export const updateCoupon = async (req, res,next) => {
    try {
      const { id } = req.params;
      const updatedCoupon = req.body;
  
      // Find the coupon by ID and update it
      const coupon = await Coupon.findByIdAndUpdate(id, updatedCoupon, { new: true });
  
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
      }
  
      res.status(200).json({ success: true, data: coupon });
    } catch (error) {
     next(error)
    }
  };
  
  export const deactivateCoupon = async (req, res,next) => {
    const { couponId } = req.params;

    try {
      const coupon = await Coupon.findById(couponId);
      if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
  
      coupon.isActive = false; // Mark coupon as inactive
      await coupon.save();
  
      res.status(200).json({ message: 'Coupon deactivated successfully', coupon });
    } catch (error) {
      next(error);
    }
  }