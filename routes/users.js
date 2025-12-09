import express from 'express';
import { check } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  renderUserProfile,
  getUserProfile,
  updateProfile,
  getUserCatches,
  getUserTrips,
  toggleFollow,
  getUserFollowers,
  getUserFollowing
} from '../controllers/userController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get directory name for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png)'));
    }
  }
});

// @route   GET /users/:id
// @desc    Render user profile page
// @access  Public
router.get('/:id', renderUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  [
    auth,
    upload.single('profilePicture'),
    [
      check('username', 'Username is required').optional().not().isEmpty(),
      check('email', 'Please include a valid email').optional().isEmail(),
      check('bio', 'Bio cannot be longer than 500 characters').optional().isLength({ max: 500 }),
      check('location', 'Location cannot be longer than 100 characters').optional().isLength({ max: 100 })
    ]
  ],
  updateProfile
);

// @route   GET /api/users/:id/catches
// @desc    Get all catches by a specific user
// @access  Public
router.get('/:id/catches', getUserCatches);

// @route   GET /api/users/:id/trips
// @desc    Get all trips created by a specific user
// @access  Public
router.get('/:id/trips', getUserTrips);

// @route   PUT /api/users/:id/follow
// @desc    Toggle follow/unfollow a user
// @access  Private
router.put('/:id/follow', auth, toggleFollow);

// @route   GET /api/users/:id/followers
// @desc    Get a user's followers
// @access  Public
router.get('/:id/followers', getUserFollowers);

// @route   GET /api/users/:id/following
// @desc    Get users that a user is following
// @access  Public
router.get('/:id/following', getUserFollowing);

export default router;
