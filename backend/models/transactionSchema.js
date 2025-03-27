import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  }, { timestamps: true });
  
  const Transaction = mongoose.model('Transaction', transactionSchema);
  
  export default Transaction;
  