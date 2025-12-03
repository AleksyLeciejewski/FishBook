import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const signToken = (userId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not set. Add it to your .env.');
    }
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    return jwt.sign({ id: userId }, secret, { expiresIn });
};

const userSafeFields = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    profilePicture: user.profilePicture,
    bio: user.bio,
    location: user.location,
    isVerified: user.isVerified,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt
});

const isHtmlRequest = (req) => {
    const accept = req.headers.accept || '';
    return accept.includes('text/html');
};

export const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if (isHtmlRequest(req)) {
                return res.status(400).render('auth/register', {
                    errors: errors.array(),
                    firstName: req.body.firstName || '',
                    lastName: req.body.lastName || '',
                    username: req.body.username || '',
                    email: req.body.email || ''
                });
            }
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { username, email, password, firstName, lastName } = req.body;
        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            const errArray = [{ msg: 'Username or email already in use' }];
            if (isHtmlRequest(req)) {
                return res.status(400).render('auth/register', {
                    errors: errArray,
                    firstName: firstName || '',
                    lastName: lastName || '',
                    username: username || '',
                    email: email || ''
                });
            }
            return res.status(400).json({ success: false, message: 'Username or email already in use' });
        }

        const user = new User({ username, email, password, firstName, lastName });
        await user.save();

        // Create session for browser requests
        if (isHtmlRequest(req)) {
            req.session.user = userSafeFields(user);
            return res.redirect('/');
        }

        const token = signToken(user._id);
        return res.status(201).json({ success: true, token, data: userSafeFields(user) });
    } catch (error) {
        console.error('Register error:', error.message || error);
        if (error.message && error.message.includes('JWT_SECRET')) {
            return res.status(500).json({ success: false, message: 'Server misconfiguration: JWT secret missing' });
        }
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if (isHtmlRequest(req)) {
                return res.status(400).render('auth/login', {
                    errors: errors.array(),
                    email: req.body.email || ''
                });
            }
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            const errArray = [{ msg: 'Invalid credentials' }];
            if (isHtmlRequest(req)) {
                return res.status(400).render('auth/login', { errors: errArray, email: email || '' });
            }
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            const errArray = [{ msg: 'Invalid credentials' }];
            if (isHtmlRequest(req)) {
                return res.status(400).render('auth/login', { errors: errArray, email: email || '' });
            }
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Browser form -> create session + redirect
        if (isHtmlRequest(req)) {
            req.session.user = userSafeFields(user);
            return res.redirect('/');
        }

        // API client -> return token + user data
        const token = signToken(user._id);
        return res.status(200).json({ success: true, token, data: userSafeFields(user) });
    } catch (error) {
        console.error('Login error:', error.message || error);
        if (error.message && error.message.includes('JWT_SECRET')) {
            return res.status(500).json({ success: false, message: 'Server misconfiguration: JWT secret missing' });
        }
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -resetPasswordToken -resetPasswordExpires');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { username, email, bio, location } = req.body;
        const updates = { username, email, bio, location };

        if (username) {
            const existing = await User.findOne({ username, _id: { $ne: req.user.id } });
            if (existing) return res.status(400).json({ success: false, message: 'Username already in use' });
        }
        if (email) {
            const existing = await User.findOne({ email, _id: { $ne: req.user.id } });
            if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export default { register, login, getCurrentUser, updateProfile };
