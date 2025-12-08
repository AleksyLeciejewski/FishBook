// File: `routes/auth.js`
import express from 'express';
import { check } from 'express-validator';
import { register, login, getCurrentUser, updateProfile } from '../controllers/authController.js';
import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Render register page with safe defaults so `errors` and form fields are defined in EJS
router.get('/register', (req, res) => {
    return res.render('auth/register', {
        errors: [],
        firstName: '',
        lastName: '',
        username: '',
        email: ''
    });
});

// Render login page with safe defaults
router.get('/login', (req, res) => {
    return res.render('auth/login', {
        errors: [],
        email: ''
    });
});

// POST /auth/register
router.post(
    '/register',
    [
        check('username', 'Username is required and must be 3-30 chars').notEmpty().isLength({ min: 3, max: 30 }),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
    ],
    register
);

// POST /auth/login
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').notEmpty()
    ],
    login
);

// Temporary route to refresh session
router.get('/refresh-session', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Not logged in');
    }

    const user = await User.findById(req.session.user.id).select('-password');
    req.session.user = {
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email
    };
    res.send('Session refreshed.');
});


// Protected user endpoints
router.get('/me', auth, getCurrentUser);
router.put('/me', auth, updateProfile);

export default router;
