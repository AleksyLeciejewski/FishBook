import express from 'express';
import { check } from 'express-validator';
import { register, login, getCurrentUser, updateProfile } from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  register
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  login
);

// @route   GET api/auth/me
// @desc    Get user by token
// @access  Private
router.get('/me', auth, getCurrentUser);

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  [
    auth,
    [
      check('bio', 'Bio cannot be longer than 500 characters').isLength({ max: 500 }),
      check('location', 'Location cannot be longer than 100 characters').isLength({ max: 100 })
    ]
  ],
  updateProfile
);

export default router;
