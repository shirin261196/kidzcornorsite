import express from 'express';
import { creditWallet, debitWallet, getWalletDetails, purchaseUsingWallet } from '../controllers/walletController.js';
import { userAuth } from '../middleware/userAuth.js';

const walletRouter = express.Router();


walletRouter.post('/wallet/credit', creditWallet );
walletRouter.post('/wallet/debit', debitWallet );
walletRouter.post('/wallet/purchase', purchaseUsingWallet );
walletRouter.get('/wallet/details',userAuth,getWalletDetails)


export default walletRouter;
