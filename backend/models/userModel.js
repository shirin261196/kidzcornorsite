import mongoose from "mongoose";

const { Schema } = mongoose;

// Define the address schema first
const addressSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true },
});

const walletTransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ["CREDIT", "DEBIT"], required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
});
// Define the user schema
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    googleId: { type: String, required: false, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    addresses: [addressSchema], // Now this reference works correctly
    isBlocked: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    cartData: { type: Object, default: {} },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    walletBalance: { type: Number, default: 0 },
    walletTransactions: [walletTransactionSchema],
  },
  { timestamps: true }
);

// Export the user model
const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
