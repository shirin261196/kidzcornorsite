import productModel from '../models/productModel.js';
import pkg from 'cloudinary';
import mongoose from 'mongoose'
const { v2: cloudinary } = pkg;
import { body, validationResult } from 'express-validator';
import Cart from '../models/cartModel.js';
import Order from '../models/orderModel.js';

export const getAllProducts = async (req, res, next) => {
  try {
    // Populate the 'category' field with category details
    const products = await productModel.find({ deleted: false }).populate('category'); // This will populate category

    res.json(products); // Send the products as a JSON response
  } catch (error) {
    next(error);
  }
};


// Add Product
export const addProduct = async (req, res,next) => {
  try {
    const { name, description,brand, category, price,stock,newestArrival,popularity,averageRating, bestseller, sizes } = req.body;
    const date = req.body.date || Date.now();
    const parsedSizes = Array.isArray(sizes) ? sizes : JSON.parse(sizes);

    const files = [
      req.files?.image1?.[0],
      req.files?.image2?.[0],
      req.files?.image3?.[0],
    ].filter(Boolean);

    if (files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const imageUploads = await Promise.all(
      files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path);
        return { url: result.secure_url, public_id: result.public_id };
      })
    );

    const product = new productModel({
      name,
      description,
      brand,
      category,
      popularity,averageRating,newestArrival,
      price,
      stock,
      date,
      sizes: parsedSizes,
      bestseller: bestseller === 'true',
      isDeleted: false,
      images: imageUploads,
    });

    await product.save();
    res.status(201).json({ success:true,message: 'Product added successfully', product });
  } catch (error) {
    next(error);
  }
};

// List Products
export const listProducts = async (req, res, next) => {
  try {
    // Populate the 'category' field with category details
    const products = await productModel.find().populate('category'); // This will populate category

    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

// Get Single Product
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate the id format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    // Populate the 'category' field with category details
    const product = await productModel.findById(id).populate('category');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};


// Remove Product
// Soft Delete Product
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await productModel.findByIdAndUpdate(
      id,
      { deleted: true },
      { new: true } // Return the updated product
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Remove the product from all carts
    await Cart.updateMany(
      { 'items.product': id },
      { $pull: { items: { product: id } } }
    );

    res.json({ success: true, message: 'Product soft deleted and removed from all carts' });
  } catch (error) {
    next(error);
  }
};


// restore products
export const restoreProduct = async(req,res,next) =>{
  try {
    const product = await productModel.findByIdAndUpdate(
      req.params.id,
      { deleted: false },
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product restored successfully' });
  } catch (err) {
    next(err);
  }
}
// Update Product
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, brand, stock, category, sizes } = req.body;

    // Parse sizes if sent as a string (e.g., from formData)
    const parsedSizes = Array.isArray(sizes) ? sizes : JSON.parse(sizes || "[]");

    // Prepare update fields for non-array properties
    const updateFields = { name, price, brand,category };

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      const imageUploads = await Promise.all(
        req.files.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path);
          return { url: result.secure_url, public_id: result.public_id };
        })
      );
      updateFields.images = imageUploads;
    }

    // Find the product
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Update sizes if provided
    if (Array.isArray(parsedSizes) && parsedSizes.length > 0) {
      parsedSizes.forEach((sizeUpdate) => {
        const sizeToUpdate = product.sizes.find((size) => size.size === sizeUpdate.size);

        if (sizeToUpdate) {
          sizeToUpdate.stock = sizeUpdate.stock; // Update existing size stock
        } else {
          // Add new size if it doesn't exist
          product.sizes.push({ size: sizeUpdate.size, stock: sizeUpdate.stock });
        }
      });

      // Mark sizes array as modified
      product.markModified('sizes');
    }

    // Update overall stock if provided
    if (stock !== undefined) {
      product.stock = stock;
    }

    // Update other fields in the product
    Object.keys(updateFields).forEach((key) => {
      if (updateFields[key] !== undefined) {
        product[key] = updateFields[key];
      }
    });

    // Save the modified product
    const updatedProduct = await product.save();

    res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      files: req.files,
    });
    next(error);
  }
};



export const deleteImage = async (req, res,next) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    // Delete image from Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.destroy(public_id);
    cloudinary.uploader.destroy('lturnbaomuwlndkfrgm3', (error, result) => {
      if (error) {
        console.error('Cloudinary error:', error);
      } else {
        console.log('Cloudinary result:', result);
      }
    });
    if (cloudinaryResponse.result !== 'ok') {
      return res.status(500).json({ message: 'Error removing image from Cloudinary' });
    }

    // Optionally remove image reference from product document in MongoDB
    await productModel.updateOne(
      { 'images.public_id': public_id },
      { $pull: { images: { public_id } } }
    );

    res.status(200).json({ message: 'Image removed successfully' });
  } catch (error) {
    next(error);
  }
};

// Update stock for a specific product size
export const updateStock = async (req, res,next) => {
  const { size, stock } = req.body;
  const { id } = req.params;

  try {
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const sizeToUpdate = product.sizes.find((s) => s.size === size);

    if (!sizeToUpdate) {
      return res.status(404).json({ success: false, message: 'Size not found' });
    }

    sizeToUpdate.stock = stock; // Update the stock
        // Mark the sizes array as modified
        product.markModified('sizes');

    await product.save();

    return res.status(200).json({ success: true, message: 'Stock updated successfully' });
  } catch (error) {
   next(error)
  }
};

export const bestSeller = async (req, res,next) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } }, // Split items array
      {
        $group: {
          _id: "$items.product", // Group by product ID
          totalSold: { $sum: "$items.quantity" }, // Sum the quantity sold
        },
      },
      { $sort: { totalSold: -1 } }, // Sort by total sold (descending)
      { $limit: 10 }, // Get top 10 products
      {
        $lookup: {
          from: "products", // Reference the products collection
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" }, // Unwrap product details
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: "$productDetails.name",
          price: "$productDetails.price", // Include price
          stock: "$productDetails.stock", // Include stock
          sizes: "$productDetails.sizes", // Include sizes
          images: "$productDetails.images", // Include images
          totalSold: 1,
        },
      },
    ]);

    res.json({ success: true,topProducts });
  } catch (error) {
   next(error)
  }
};

export const bestCategory = async (req, res, next) => {
  try {
    const topCategories = await Order.aggregate([
      { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } }, // Split items array
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" }, // Unwrap product details
      {
        $group: {
          _id: "$productDetails.category", // Group by category
          totalSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "categories", // Lookup category details
          localField: "_id",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },// Ensure categoryInfo is not an array
      {
        $project: {
          _id: 0,
          categoryId: "$_id",
          categoryName: "$categoryInfo.name", // Get category name
          categoryImage: "$categoryInfo.image", // ✅ Get category image
          totalSold: 1,
        },
      },
    ]);

    res.json({ success: true,topCategories });
  } catch (error) {
    next(error);
  }
};


export const bestBrand = async (req, res,next) => {
  try {
    const topBrands = await Order.aggregate([
      { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.brand", // Group by brand
          totalSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          brand: "$_id",
          totalSold: 1,
        },
      },
    ]);

    res.json({ success: true,topBrands });
  } catch (error) {
    next(error)
  }
};

