import express from 'express';
import { addAddress,deleteAddress,editAddress,fetchAllAddress,getUserProfile,updateUserProfile} from '../controllers/userController.js';
import { userAuth } from '../middleware/userAuth.js';




const addressRouter = express.Router();

addressRouter.post("/address",userAuth, addAddress);

addressRouter.get('/address',userAuth,fetchAllAddress)
addressRouter.delete('/address/:addressId', userAuth,deleteAddress);
addressRouter.put('/address/:addressId', userAuth,editAddress);
addressRouter.get('/profile', userAuth,getUserProfile);
addressRouter.put('/profile', userAuth,updateUserProfile);
export default addressRouter;

