export const calculateDiscountPrice = (item, coupon) => {
    let discountAmount = 0;
    
    // Check if the coupon is applicable to the product (using applicableCoupons or category)
    if (item.product.applicableCoupons && item.product.applicableCoupons.includes(coupon._id.toString())) {
      // Assuming the coupon provides a fixed discount value or percentage
      if (coupon.discountType === 'percentage') {
        discountAmount = (item.product.price * coupon.discountValue) / 100;
      } else if (coupon.discountType === 'fixed') {
        discountAmount = coupon.discountValue;
      }
  
      // Ensure the discount does not exceed the price of the product
      discountAmount = Math.min(discountAmount, item.product.price);
    }
  
    return discountAmount;
  };
  