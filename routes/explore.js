import express from 'express';
import { exploreFishingSpots, getFishingSpotsAPI } from '../controllers/exploreController.js';

const router = express.Router();

// @route   GET /
// @desc    Explore fishing spots page
// @access  Public
router.get('/', (req, res) => {
    console.log('GET /explore route hit');
    exploreFishingSpots(req, res);
});

// @route   GET /api
// @desc    Get fishing spots data (for AJAX)
// @access  Public
router.get('/api', (req, res) => {
    console.log('GET /explore/api route hit');
    getFishingSpotsAPI(req, res);
});

// Debug route to check if router is working
router.get('/test', (req, res) => {
    console.log('GET /explore/test route hit');
    res.send('Explore test route is working!');
});

export default router;
