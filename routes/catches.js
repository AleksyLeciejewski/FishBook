import express from 'express';
import { check } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  getCatches, 
  getCatchById, 
  createCatch, 
  updateCatch, 
  deleteCatch,
  addComment,
  toggleLike
} from '../controllers/catchController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get directory name for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/catches/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'catch-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
    }
  }
});

// @route   GET /api/catches
// @desc    Get all catches
// @access  Public
router.get('/', getCatches);

// @route   GET /api/catches/:id
// @desc    Get catch by ID
// @access  Public
router.get('/:id', getCatchById);

// @route   POST /api/catches
// @desc    Create a catch
// @access  Private
router.post(
  '/',
  [
    auth,
    upload.single('image'),
    [
      check('species', 'Species is required').not().isEmpty(),
      check('weight', 'Weight is required and must be a number').isNumeric(),
      check('location', 'Location is required').isObject(),
      check('location.lat', 'Latitude is required and must be a number').isNumeric(),
      check('location.lng', 'Longitude is required and must be a number').isNumeric(),
      check('location.name', 'Location name is required').not().isEmpty()
    ]
  ],
  createCatch
);

// @route   PUT /api/catches/:id
// @desc    Update a catch
// @access  Private
router.put(
  '/:id',
  [
    auth,
    upload.single('image'),
    [
      check('species', 'Species is required').optional().not().isEmpty(),
      check('weight', 'Weight must be a number').optional().isNumeric(),
      check('length', 'Length must be a number').optional().isNumeric(),
      check('location', 'Location must be an object').optional().isObject()
    ]
  ],
  updateCatch
);

// @route   DELETE /api/catches/:id
// @desc    Delete a catch
// @access  Private
router.delete('/:id', auth, deleteCatch);

// @route   POST /api/catches/:id/comments
// @desc    Add comment to a catch
// @access  Private
router.post(
  '/:id/comments',
  [
    auth,
    [
      check('text', 'Text is required').not().isEmpty(),
      check('text', 'Comment cannot be longer than 500 characters').isLength({ max: 500 })
    ]
  ],
  addComment
);

// @route   POST /api/catches/:id/like
// @desc    Like or unlike a catch
// @access  Private
router.post('/:id/like', auth, toggleLike);

export default router;
