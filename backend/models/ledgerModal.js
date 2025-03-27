import mongoose from 'mongoose';

const ledgerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, // Related Order (if applicable)
  type: { type: String, enum: ["ORDER_PAYMENT", "REFUND", "WALLET_TOPUP"], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  balanceAfterTransaction: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});



const Ledger = mongoose.model("Ledger", ledgerSchema);


export default Ledger;
