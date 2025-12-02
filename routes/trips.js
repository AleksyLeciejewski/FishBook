import express from 'express';
import { check } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  getTrips, 
  getTripById, 
  createTrip, 
  updateTrip, 
  deleteTrip, 
  joinTrip,
  updateParticipantStatus
} from '../controllers/tripController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get directory name for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/trips/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'trip-' + uniqueSuffix + path.extname(file.originalname));
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

// @route   GET /api/trips
// @desc    Get all trips
// @access  Public
router.get('/', getTrips);

// @route   GET /api/trips/:id
// @desc    Get trip by ID
// @access  Public
router.get('/:id', getTripById);

// @route   POST /api/trips
// @desc    Create a trip
// @access  Private
router.post(
  '/',
  [
    auth,
    upload.array('images', 5), // Allow up to 5 images
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description cannot be longer than 2000 characters').optional().isLength({ max: 2000 }),
      check('location', 'Location is required').isObject(),
      check('location.lat', 'Latitude is required and must be a number').isNumeric(),
      check('location.lng', 'Longitude is required and must be a number').isNumeric(),
      check('location.name', 'Location name is required').not().isEmpty(),
      check('startDate', 'Start date is required').isISO8601(),
      check('endDate', 'End date is required').isISO8601(),
      check('maxParticipants', 'Max participants must be a number').optional().isInt({ min: 1 }),
      check('isPublic', 'isPublic must be a boolean').optional().isBoolean(),
      check('tags', 'Tags must be an array').optional().isArray()
    ]
  ],
  createTrip
);

// @route   PUT /api/trips/:id
// @desc    Update a trip
// @access  Private
router.put(
  '/:id',
  [
    auth,
    upload.array('images', 5), // Allow up to 5 images
    [
      check('title', 'Title is required').optional().not().isEmpty(),
      check('description', 'Description cannot be longer than 2000 characters').optional().isLength({ max: 2000 }),
      check('location', 'Location must be an object').optional().isObject(),
      check('location.lat', 'Latitude must be a number').optional().isNumeric(),
      check('location.lng', 'Longitude must be a number').optional().isNumeric(),
      check('location.name', 'Location name is required if location is provided').optional().not().isEmpty(),
      check('startDate', 'Start date must be a valid date').optional().isISO8601(),
      check('endDate', 'End date must be a valid date').optional().isISO8601(),
      check('maxParticipants', 'Max participants must be a number').optional().isInt({ min: 1 }),
      check('isPublic', 'isPublic must be a boolean').optional().isBoolean(),
      check('status', 'Invalid status').optional().isIn(['upcoming', 'in_progress', 'completed', 'cancelled']),
      check('tags', 'Tags must be an array').optional().isArray()
    ]
  ],
  updateTrip
);

// @route   DELETE /api/trips/:id
// @desc    Delete a trip
// @access  Private
router.delete('/:id', auth, deleteTrip);

// @route   POST /api/trips/:id/join
// @desc    Join a trip
// @access  Private
router.post('/:id/join', auth, joinTrip);

// @route   PUT /api/trips/:id/participants
// @desc    Update participant status (for trip creator)
// @access  Private
router.put(
  '/:id/participants',
  [
    auth,
    [
      check('participantId', 'Participant ID is required').not().isEmpty(),
      check('status', 'Status is required and must be one of: pending, confirmed, declined')
        .isIn(['pending', 'confirmed', 'declined'])
    ]
  ],
  updateParticipantStatus
);

export default router;
