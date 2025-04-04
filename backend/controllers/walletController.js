import Ledger from "../models/ledgerModal.js";
import userModel from "../models/userModel.js";

export const creditWallet = async (req, res, next) => {
  const { userId, amount, description = "Wallet credit" } = req.body;

  try {
    // Find user by ID
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Add the amount to the user's wallet balance
    user.walletBalance += amount;

    // Log the transaction in wallet history
    user.walletTransactions.push({
      type: "CREDIT",
      amount,
      description,
    });

    // Create a Ledger Entry for this transaction
    await Ledger.create({
      user: user._id,
      type: "WALLET_TOPUP",
      amount,
      description,
      balanceAfterTransaction: user.walletBalance, // Store updated balance
    });

    // Save the user document
    await user.save();

    res.status(200).json({
      message: "Wallet credited successfully",
      balance: user.walletBalance,
      transactions: user.walletTransactions.slice(0, 10), 
    });
  } catch (error) {
    next(error);
  }
};
  
  

export const debitWallet = async (req, res, next) => {
  const { userId, amount,description = "Wallet debit" } = req.body;

  try {
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.walletBalance < amount) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    // Deduct from wallet balance
    user.walletBalance -= amount;

    // Log transaction
    const transaction = {
      type: "DEBIT",
      amount,
      description,
      date: new Date(),
    };

    // Log transaction
    user.walletTransactions.unshift(transaction);

    // Create a Ledger Entry for this transaction
    await Ledger.create({
      user: user._id,
      type: "ORDER_PAYMENT",
      amount,
      description: "Wallet payment for purchase",
      balanceAfterTransaction: user.walletBalance,
    });

    await user.save();
    res.status(200).json({success:true,
      message: "Wallet debited successfully",
      walletBalance: user.walletBalance,
      transactions: user.walletTransactions.slice(0, 10),
      transactionId: transaction.date.getTime().toString(),
    });
  } catch (err) {
    next(err);
  }
};

  
  export const purchaseUsingWallet = async (req, res, next) => {
    try {
      const { userId, totalAmount } = req.body; // Assuming user ID and total amount come from request body
  
      // Perform wallet debit
      const user = await debitWallet(userId, totalAmount, "Purchase using wallet");
  
      res.status(200).json({ success:true,
        message: "Purchase successful",
        walletBalance: user.walletBalance,
        transactions: user.walletTransactions,
      });
    } catch (error) {
      next(error);
    }
  };

  export const refundWallet = async (req, res, next) => {
    try {
      const { userId, refundAmount } = req.body;
  
      // Find user
      const user = await userModel.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      // Credit refund amount
      user.walletBalance += refundAmount;
  
      // Log transaction in user's history
      user.walletTransactions.unshift({
        type: "CREDIT",
        amount: refundAmount,
        description: "Refund for order cancellation",
        date: new Date(),
      });
  
      // Create a Ledger Entry for the refund
      await Ledger.create({
        user: user._id,
        type: "REFUND",
        amount: refundAmount,
        description: "Refund for order cancellation",
        balanceAfterTransaction: user.walletBalance,
      });
  
      await user.save();
  
      res.status(200).json({
        message: "Refund successful",
        walletBalance: user.walletBalance,
        transactions: user.walletTransactions.slice(0, 10),
      });
    } catch (error) {
      next(error);
    }
  };
  
  
  export const getWalletDetails = async (req, res,next) => {
    try {
     
      console.log("Authenticated User:", req.user); 
      const userId = req.user.id;
   // Assuming user ID is stored in req.user
      const { page = 1, limit = 10 } = req.query; // Pagination params
  
      const user = await userModel.findById(userId).select("walletBalance walletTransactions");
      if (!user) return res.status(404).json({ message: "User not found" });
  
      // Paginate wallet transactions (latest first)
      const transactions = user.walletTransactions
        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by latest first
        .slice((page - 1) * limit, page * limit);
  
      res.status(200).json({
        success:true,
        walletBalance: user.walletBalance,
        transactions,
      });
    } catch (error) {
      console.error("Error fetching wallet details:", error);
      next(error)
    }
  };
  


  
