import express from 'express';
import { getDashboard, toggleUserRole, deleteUser, getUserCatches, getUserTrips } from '../controllers/adminController.js';
import User from '../models/User.js';
import isAdmin from '../middleware/isAdmin.js';

const router = express.Router();

router.get('/dashboard', isAdmin, getDashboard);
router.put('/users/:id/role', isAdmin, toggleUserRole);

// new route to fetch a user's catches
router.get('/users/:id/catches', isAdmin, getUserCatches);

// optional: ensure trips route exists (if implemented)
router.get('/users/:id/trips', isAdmin, getUserTrips);

router.put('/users/:id/verify', isAdmin, async (req, res) => {
    try {
        const { isVerified } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { isVerified }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ success: true, user });
    } catch (error) {
        console.error('Verify user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.delete('/users/:id', isAdmin, deleteUser);

export default router;