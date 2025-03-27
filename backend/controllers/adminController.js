import userModel from "../models/userModel.js";

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find();
        res.json({ success: true, data: users });
    } catch (error) {

        res.status(500).json({ success: 'Failed to fetch users' });
    }
};

// Update a user
export const toggleUserStatus = async (req, res) => {
    const { id } = req.params; // Extract userId from URL parameters

    try {
        const user = await userModel.findById(id); // Find the user by id
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.isBlocked = !user.isBlocked; // Toggle the user block status
        await user.save(); // Save the updated user status

        res.json({ success: true, message: user.isBlocked ? 'User blocked' : 'User unblocked' });
    } catch (error) {
        console.error("Error toggling user status:", error.message);
        res.status(500).json({ success: false, message: "Failed to toggle user status" });
    }
}



