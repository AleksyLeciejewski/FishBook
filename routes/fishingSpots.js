import express from 'express';
import { searchFishingSpots, getAllFishingSpots } from '../controllers/fishingSpotController.js';

const router = express.Router();

// @route   GET /fishing-spots
// @desc    Search fishing spots
// @access  Public
router.get('/', searchFishingSpots);

// @route   GET /fishing-spots/all
// @desc    Get all fishing spots (API endpoint)
// @access  Public
router.get('/all', getAllFishingSpots);

export default router;
