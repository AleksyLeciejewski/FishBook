import express from 'express';
import { getDashboard, toggleUserRole, deleteUser } from '../controllers/adminController.js';
import User from '../models/User.js';

const router = express.Router();

const requireAdmin = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).render('error', {
            title: 'Unauthorized',
            error: 'Authentication required',
            message: 'Please log in to access this page'
        });
    }

    if (req.session.user.role !== 'admin') {
        return res.status(403).render('error', {
            title: 'Forbidden',
            error: 'Access denied',
            message: 'Admin access required'
        });
    }

    req.user = {
        id: req.session.user.id,
        role: req.session.user.role
    };
    next();
};

router.put('/users/:id/verify', async (req, res) => {
    try {
        const { isVerified } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isVerified },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Verify user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.get('/dashboard', requireAdmin, getDashboard);
router.put('/users/:id/role', requireAdmin, toggleUserRole);
router.delete('/users/:id', requireAdmin, deleteUser);

export default router;
