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
  toggleLike,
  renderNewCatchForm,
  renderCatchesIndex,
  renderCatchDetail
} from '../controllers/catchController.js';
import auth from '../middleware/auth.js';
import sessionAuth from '../middleware/sessionAuth.js';

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 5MB limit
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

// @route   GET /catches
// @desc    Render catches index page
// @access  Public
router.get('/', renderCatchesIndex);

// @route   GET /catches/new
// @desc    Render new catch form
// @access  Private
router.get('/new', sessionAuth, renderNewCatchForm);

// @route   GET /api/catches
// @desc    Get all catches (API)
// @access  Public
router.get('/api', getCatches);

// @route   GET /catches/:id
// @desc    Render catch detail page
// @access  Public
router.get('/:id', renderCatchDetail);

// @route   GET /api/catches/:id
// @desc    Get catch by ID (API)
// @access  Public
router.get('/api/:id', getCatchById);

// @route   POST /catches
// @desc    Create a catch
// @access  Private
router.post(
  '/',
  sessionAuth,
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).render('catches/new', {
          title: 'Log a Catch',
          errors: [{ msg: err.message || 'Error uploading file. Please try again.' }]
        });
      }
      next();
    });
  },
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

// @route   POST /catches/:id/comments
// @desc    Add comment to a catch
// @access  Private
router.post(
  '/:id/comments',
  [
    sessionAuth,
    [
      check('text', 'Text is required').not().isEmpty(),
      check('text', 'Comment cannot be longer than 500 characters').isLength({ max: 500 })
    ]
  ],
  addComment
);

// @route   POST /catches/:id/like
// @desc    Like or unlike a catch
// @access  Private
router.post('/:id/like', sessionAuth, toggleLike);

export default router;
