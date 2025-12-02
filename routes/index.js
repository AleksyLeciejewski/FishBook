import express from 'express';
import Catch from '../models/Catch.js';
import Trip from '../models/Trip.js';
import { getWeatherData } from '../services/weatherService.js';

const router = express.Router();

// Home page route
router.get('/', async (req, res) => {
    try {
        // Fetch latest catches (limit to 6)
        const latestCatches = await Catch.find({ isPublic: true })
            .sort({ createdAt: -1 })
            .limit(6)
            .populate('user', 'username profilePicture')
            .lean();

        // Fetch upcoming trips (limit to 3)
        const upcomingTrips = await Trip.find({ 
            date: { $gte: new Date() },
            isPublic: true
        })
            .sort({ date: 1 })
            .limit(3)
            .populate('createdBy', 'username profilePicture')
            .lean();

        // Get weather data for a default location (Copenhagen)
        let weather = null;
        try {
            weather = await getWeatherData(55.6761, 12.5683, new Date().toISOString().split('T')[0]);
        } catch (error) {
            console.error('Error fetching weather:', error);
            // Continue without weather data if there's an error
        }

        res.render('index', { 
            title: 'FishBook - Home',
            user: req.session.user || null,
            catches: latestCatches,
            trips: upcomingTrips,
            weather: weather
        });
    } catch (error) {
        console.error('Error rendering home page:', error);
        res.status(500).render('error', { 
            title: 'Error',
            error: 'Error loading the home page',
            message: error.message 
        });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'FishBook API is running' });
});

export default router;
