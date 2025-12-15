import User from '../models/User.js';
import Catch from '../models/Catch.js';
import Trip from '../models/Trip.js';

export const getDashboard = async (req, res) => {
    try {
        const [users, totalUsers, totalCatches, totalTrips] = await Promise.all([
            User.find().select('-password').sort({ createdAt: -1 }).limit(50),
            User.countDocuments(),
            Catch.countDocuments(),
            Trip.countDocuments()
        ]);

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            users,
            stats: {
                totalUsers,
                totalCatches,
                totalTrips
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', {
            title: 'Error',
            error: 'Failed to load admin dashboard',
            message: err.message
        });
    }
};

export const toggleUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ msg: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Prevent deleting yourself - use session user id
        if (user._id.toString() === req.session.user.id) {
            return res.status(400).json({ msg: 'Cannot delete your own account' });
        }

        // Delete user's catches and trips
        await Promise.all([
            Catch.deleteMany({ user: user._id }),
            Trip.deleteMany({ creator: user._id }),
            User.findByIdAndDelete(req.params.id)
        ]);

        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

export const getStatistics = async (req, res) => {
    const [totalUsers, totalCatches, totalTrips, recentUsers] = await Promise.all([
        User.countDocuments(),
        Catch.countDocuments(),
        Trip.countDocuments(),
        User.find().sort({ createdAt: -1 }).limit(5).select('-password')
    ]);

    res.render('admin/dashboard', {
        totalUsers,
        totalCatches,
        totalTrips,
        recentUsers
    });
};

export async function getUserCatches(req, res) {
    try {
        const userId = req.params.id;
        const catches = await Catch.find({
            $or: [
                { user: userId },
                { owner: userId },
                { creator: userId },
                { catcher: userId }
            ]
        })
            .select('-__v')
            .sort({ createdAt: -1 });

        return res.json({ success: true, catches });
    } catch (error) {
        console.error('Get user catches error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

export async function getUserTrips(req, res) {
    try {
        const userId = req.params.id;
        const trips = await Trip.find({
            $or: [
                { user: userId },
                { owner: userId },
                { creator: userId }
            ]
        })
            .select('-__v')
            .sort({ startDate: -1, createdAt: -1 });

        return res.json({ success: true, trips });
    } catch (error) {
        console.error('Get user trips error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}