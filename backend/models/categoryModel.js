import mongoose from 'mongoose';


const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true, // Ensure category names are unique
            trim: true, // Remove leading/trailing spaces
        },
        description: {
            type: String,
            default: '', // Default to empty string if not provided
            trim: true,
            
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt
);

// Add an index for optimized queries
categorySchema.index({ name: 1, isDeleted: 1 });

const Category = mongoose.model('Category', categorySchema);

export default Category;
