// controllers/userController.js
import User from '../models/User.js';
import Catch from '../models/Catch.js';
import Trip from '../models/Trip.js';
import { validationResult } from 'express-validator';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'profile-pictures');
import fs from 'fs-extra';

// Create uploads directory if it doesn't exist
fs.ensureDirSync(uploadDir);

// @desc    Render user profile page
// @route   GET /users/:id
// @access  Public
export const renderUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -resetPasswordToken -resetPasswordExpire')
            .populate('followers.user', 'username profilePicture')
            .populate('following.user', 'username profilePicture');

        if (!user) {
            return res.status(404).render('404', {
                title: 'User Not Found'
            });
        }

        // Get user's catches with stats
        const catches = await Catch.find({ user: req.params.id, isPublic: true })
            .sort({ dateCaught: -1 })
            .limit(6)
            .populate('user', 'username profilePicture');

        // Calculate fishing stats
        const allCatches = await Catch.find({ user: req.params.id, isPublic: true });
        const totalCatches = allCatches.length;
        const totalWeight = allCatches.reduce((sum, c) => sum + (c.weight || 0), 0);
        const biggestCatch = allCatches.length > 0 
            ? allCatches.reduce((max, c) => c.weight > max.weight ? c : max, allCatches[0])
            : null;
        
        // Species diversity
        const speciesSet = new Set(allCatches.map(c => c.species));
        const speciesCount = speciesSet.size;

        // Get user's trips
        const trips = await Trip.find({
            $or: [
                { createdBy: req.params.id, isPublic: true },
                { 'participants.user': req.params.id }
            ]
        })
            .sort({ startDate: -1 })
            .limit(4)
            .populate('createdBy', 'username profilePicture');

        res.render('users/profile', {
            title: `${user.username}'s Profile`,
            profileUser: user,
            catches,
            trips,
            stats: {
                totalCatches,
                totalWeight: totalWeight.toFixed(2),
                biggestCatch,
                speciesCount,
                followers: user.followers.length,
                following: user.following.length
            }
        });
    } catch (error) {
        console.error('Render user profile error:', error);
        res.status(500).render('error', {
            title: 'Error',
            error: 'Error loading profile',
            message: error.message
        });
    }
};

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -resetPasswordToken -resetPasswordExpire')
            .populate('followers.user', 'username profilePicture')
            .populate('following.user', 'username profilePicture');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
export const updateProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { username, email, bio, location } = req.body;
        const profileData = { username, email, bio, location };

        // Check if user exists
        let user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if user is authorized
        if (user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized to update this profile' });
        }

        // Handle profile picture upload
        if (req.files && req.files.profilePicture) {
            const file = req.files.profilePicture;
            const fileName = `user-${Date.now()}${path.extname(file.name)}`;
            const filePath = path.join(uploadDir, fileName);
            
            // Save file to uploads directory
            await file.mv(filePath);
            
            // Delete old profile picture if it exists
            if (user.profilePicture && user.profilePicture.url) {
                const oldFilePath = path.join(__dirname, '..', 'public', user.profilePicture.url);
                if (fs.existsSync(oldFilePath)) {
                    await fs.unlink(oldFilePath);
                }
            }

            profileData.profilePicture = {
                url: `/uploads/profile-pictures/${fileName}`
            };
        }

        // Update user
        user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: profileData },
            { new: true, runValidators: true }
        ).select('-password -resetPasswordToken -resetPasswordExpire');

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get user catches
// @route   GET /api/users/:id/catches
// @access  Public
export const getUserCatches = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [catches, total] = await Promise.all([
            Catch.find({ user: req.params.id, isPublic: true })
                .sort({ dateCaught: -1 })
                .skip(skip)
                .limit(limit)
                .populate('user', 'username profilePicture'),
            Catch.countDocuments({ user: req.params.id, isPublic: true })
        ]);

        res.status(200).json({
            success: true,
            count: catches.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: catches
        });
    } catch (error) {
        console.error('Get user catches error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get user trips
// @route   GET /api/users/:id/trips
// @access  Public
export const getUserTrips = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [trips, total] = await Promise.all([
            Trip.find({
                $or: [
                    { creator: req.params.id, isPublic: true },
                    { 'participants.user': req.params.id }
                ]
            })
                .sort({ startDate: -1 })
                .skip(skip)
                .limit(limit)
                .populate('creator', 'username profilePicture')
                .populate('participants.user', 'username profilePicture'),
            Trip.countDocuments({
                $or: [
                    { creator: req.params.id, isPublic: true },
                    { 'participants.user': req.params.id }
                ]
            })
        ]);

        res.status(200).json({
            success: true,
            count: trips.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: trips
        });
    } catch (error) {
        console.error('Get user trips error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Follow/Unfollow user
// @route   PUT /api/users/:id/follow
// @access  Private
export const toggleFollow = async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
        }

        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToFollow || !currentUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if already following
        const isFollowing = currentUser.following.some(
            follow => follow.user.toString() === req.params.id
        );

        if (isFollowing) {
            // Unfollow
            currentUser.following = currentUser.following.filter(
                follow => follow.user.toString() !== req.params.id
            );
            userToFollow.followers = userToFollow.followers.filter(
                follower => follower.user.toString() !== req.user.id
            );
            await Promise.all([currentUser.save(), userToFollow.save()]);
            res.status(200).json({ success: true, message: 'User unfollowed', isFollowing: false });
        } else {
            // Follow
            currentUser.following.unshift({ user: req.params.id });
            userToFollow.followers.unshift({ user: req.user.id });
            await Promise.all([currentUser.save(), userToFollow.save()]);
            res.status(200).json({ success: true, message: 'User followed', isFollowing: true });
        }
    } catch (error) {
        console.error('Toggle follow error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get user followers
// @route   GET /api/users/:id/followers
// @access  Public
export const getUserFollowers = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('followers')
            .populate('followers.user', 'username profilePicture');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, count: user.followers.length, data: user.followers });
    } catch (error) {
        console.error('Get user followers error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get user following
// @route   GET /api/users/:id/following
// @access  Public
export const getUserFollowing = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('following')
            .populate('following.user', 'username profilePicture');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, count: user.following.length, data: user.following });
    } catch (error) {
        console.error('Get user following error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
export const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (!q) {
            return res.status(400).json({ success: false, message: 'Search query is required' });
        }

        const query = {
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ]
        };

        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password -resetPasswordToken -resetPasswordExpire')
                .skip(skip)
                .limit(limit),
            User.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: users
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete user account
// @route   DELETE /api/users/:id
// @access  Private
export const deleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if user is authorized
        if (user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this account' });
        }

        // Delete user's profile picture if it exists
        if (user.profilePicture && user.profilePicture.url) {
            const filePath = path.join(__dirname, '..', 'public', user.profilePicture.url);
            if (fs.existsSync(filePath)) {
                await fs.unlink(filePath);
            }
        }

        // Delete user's catches and their images
        const userCatches = await Catch.find({ user: user._id });
        await Promise.all(
            userCatches.map(async (catchItem) => {
                if (catchItem.image && catchItem.image.url) {
                    const filePath = path.join(__dirname, '..', 'public', catchItem.image.url);
                    if (fs.existsSync(filePath)) {
                        await fs.unlink(filePath);
                    }
                }
                return catchItem.remove();
            })
        );

        // Remove user from trips they're participating in
        await Trip.updateMany(
            { 'participants.user': user._id },
            { $pull: { participants: { user: user._id } } }
        );

        // Remove user from followers/following
        await User.updateMany(
            { 'followers.user': user._id },
            { $pull: { followers: { user: user._id } } }
        );
        await User.updateMany(
            { 'following.user': user._id },
            { $pull: { following: { user: user._id } } }
        );

        // Delete user
        await user.remove();

        res.status(200).json({ success: true, message: 'User account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export default {
    renderUserProfile,
    getUserProfile,
    updateProfile,
    getUserCatches,
    getUserTrips,
    toggleFollow,
    getUserFollowers,
    getUserFollowing,
    searchUsers,
    deleteAccount
};