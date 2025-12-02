import express from 'express';
import { getLocationWeather } from '../services/weatherService.js';

const router = express.Router();

/**
 * @route   GET /api/weather
 * @desc    Get weather data for a specific location and date
 * @access  Public
 * @query   {number} lat - Latitude
 * @query   {number} lng - Longitude
 * @query   {string} date - Date in YYYY-MM-DD format
 * @query   {string} [time=12:00] - Time in HH:MM format (optional, defaults to 12:00)
 */
router.get('/', async (req, res) => {
    try {
        const { lat, lng, date, time = '12:00' } = req.query;

        if (!lat || !lng || !date) {
            return res.status(400).json({ 
                success: false, 
                error: 'Latitude, longitude, and date are required' 
            });
        }

        const weatherData = await getLocationWeather(
            { lat: parseFloat(lat), lng: parseFloat(lng) },
            date,
            time
        );

        res.json({
            success: true,
            data: weatherData
        });
    } catch (error) {
        console.error('Weather API Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch weather data',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;
