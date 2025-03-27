import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        brand:{ type: String, required: true },
        price: { type: Number, required: true },
        discountPrice: { type: Number, default: null }, 
        category: {
            type: mongoose.Schema.Types.ObjectId, // Reference to Category model
            ref: 'Category', // Specify the model name
            required: true,
        },
        sizes: [
          {
            size: { type: String, required: true },
            stock: { type: Number, required: true }
          }
        ],
        popularity: { type: Number, default: 0 }, // Popularity score, can increase based on views, purchases, etc.
        averageRating: { type: Number, default: 0 }, // Calculated average rating from reviews
      
        bestseller: { type: Boolean, default: false }, // Optional, default is false
        images: [
            {
                url: { type: String, required: true },
                public_id: { type: String, required: true },
            },
        ],
        totalSold: { type: Number, default: 0 },
        deleted: { type: Boolean, default: false },
      
    },
    { timestamps: true } // Adds createdAt and updatedAt automatically
);

// Ensure a single model instance
const productModel = mongoose.models.product || mongoose.model('product', productSchema);

export default productModel;
