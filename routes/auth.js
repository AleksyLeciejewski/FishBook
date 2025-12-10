import express from 'express';
import { check } from 'express-validator';
import { register, login, getCurrentUser, updateProfile } from '../controllers/authController.js';
import auth from '../middleware/auth.js';

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

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/auth/login');
    });
});

// POST /auth/logout - for form submissions
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/auth/login');
    });
});



// Protected user endpoints
router.get('/me', auth, getCurrentUser);
router.put('/me', auth, updateProfile);

export default router;
