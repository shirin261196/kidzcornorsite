import Category from "../models/categoryModel.js";
import Offer from "../models/offerModel.js";


export const createProductOffer = async (req, res, next) => {
  const { productId, discount, offerDescription ,offerCode,expiryDate} = req.body;

  try {
    const offer = new Offer({
      productId,
      offerCode,
      discount,
      offerType: 'product',
      offerDescription,
      expiryDate,
    });
    await offer.save();
    res.status(201).json({ message: 'Product offer created successfully', offer });
  } catch (error) {
    next(error);
  }
  };
  
  export const createCategoryOffer = async (req, res, next) => {
    const { offerCode, expiryDate, categoryId, discount, offerDescription } = req.body;
  
    try {
      // Validate that the categoryId corresponds to an existing category
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({ message: 'Invalid category selected.' });
      }
  
      // Create and save the offer
      const offer = new Offer({
        offerCode,
        categoryId,
        discount,
        offerType: 'Category', // Ensure 'Category' matches schema (case-sensitive)
        offerDescription,
        expiryDate,
      });
  
      await offer.save();
      res.status(201).json({ message: 'Category offer created successfully', offer });
    } catch (error) {
      console.error('Error creating category offer:', error);
      next(error); // Pass error to error handling middleware
    }
  };

    export const createReferrerOffer = async (req, res, next) => {
      const { referralCode, discount, offerDescription } = req.body;

      try {
        const offer = new Offer({
          referralCode,
          discount,
          offerType: 'referral',
          offerDescription,
        });
        await offer.save();
        res.status(201).json({ message: 'Referral offer created successfully', offer });
      } catch (error) {
        next(error);
      }
      };
// Example of populating product or category
export const getOffers = async (req, res, next) => {
  try {
    const offers = await Offer.find({
      isActive: true,
      expiryDate: { $gte: new Date() },
    });
    res.status(200).json({ offers });
  } catch (error) {
    next(error);
  }
  };
  
  
  
  export const updateOffer = async (req, res,next) => {
    try {
      const { id } = req.params;
      const offer = await Offer.findByIdAndUpdate(id, req.body, { new: true });
      res.status(200).json({ success: true, data: offer });
    } catch (error) {
      next(error)
    }
  };
  
  export const deleteOffer = async (req, res,next) => {
    try {
      const { id } = req.params;
      await Offer.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: 'Offer deleted' });
    } catch (error) {
     next(error)
    }
  };