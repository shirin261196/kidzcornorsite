import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity must be at least 1"],
          validate: {
            validator: Number.isInteger,
            message: "Quantity must be an integer",
          },
        },
        price: { type: Number }, // Base price of the product
        totalPrice: { type: Number }, // Discounted price after applying offers
        size: { type: String },
        stock: { type: Number }, // Stock information for the product
        images: [{ type: String }], // Storing images as an array
       
      },
    ],
    totalPrice: { type: Number, default: 0 }, // Total price of the cart after applying discounts
    totalQuantity: { type: Number, default: 0 }, // Total quantity of items in the cart
    discountAmount: { type: Number, default: 0 }, // Total discount amount from offers and coupons
    finalPrice: { type: Number, default: 0 }, // Final payable price after all discount
    appliedCoupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon", // Reference to the Coupon model
      default: null,
    },
    appliedOffers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer'
      }
    ],
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    updatedAt: { 
      type: Date, 
      default: Date.now 
    }
  },
  
  {
    timestamps: true,
  }
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
