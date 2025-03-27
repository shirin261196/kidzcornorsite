
import Category from '../models/categoryModel.js';

// Add Category
export const addCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        // Check if a category with the same name already exists
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${name}$`, "i") },
        });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists',
            });
        }

        // Create a new category
        const newCategory = new Category({ name, description });
        await newCategory.save();

        res.json({
            success: true,
            message: 'Category added successfully',
            data: newCategory,
        });
    } catch (error) {
        next(error); // Forward error to the middleware
    }
};

// Get All Categories
export const getAllCategories = async (req, res, next) => {
    try {
        const category = await Category.find();
        res.status(200).json({ success: true, data: category });
    } catch (error) {
        next(error);
    }
};

export const getActiveCategories = async(req,res,next)=>{
    try {
        const categories = await Category.find({ isDeleted: false });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching categories' });
        next(error)
    }
}


// Edit Category
export const editCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        // Check if a category with the same name exists (excluding the current category)
        const existingCategory = await Category.findOne({
            _id: { $ne: id }, // Exclude the current category by ID
            name: { $regex: new RegExp(`^${name}$`, "i") }, // Case-insensitive name match
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists',
            });
        }

        // Update the category
        const category = await Category.findByIdAndUpdate(
            id,
            { name, description },
            { new: true } // Return the updated document
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category,
        });
    } catch (error) {
        next(error);
    }
};


// Soft Delete Category
export const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await Category.findByIdAndUpdate(
            id,
            { isDeleted: true }, // Update the `isDeleted` field
            { new: true }        // Return the updated document
        );
        

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        res.json({
            success: true,
            message: 'Category soft-deleted successfully',
            data: category,  // Return updated category
        });
    } catch (error) {
        next(error);
    }
};

export const restoreCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        const category = await Category.findByIdAndUpdate(
            id,
            { isDeleted: false }, // Restore category
            { new: true } // Return updated document
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        res.json({
            success: true,
            message: 'Category restored successfully',
            data: category,
        });
    } catch (error) {
        next(error);
    }
}

