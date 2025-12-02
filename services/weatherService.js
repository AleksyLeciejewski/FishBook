import axios from 'axios';

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Open Meteo API configuration
const OPEN_METEO_URL = process.env.OPEN_METEO_URL || 'https://api.open-meteo.com/v1/forecast';

/**
 * Get weather data from Open Meteo API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {Promise<Object>} - Weather data
 */
export const getWeatherData = async (lat, lng, date) => {
    try {
        // Convert date to Date object
        const targetDate = new Date(date);
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Format dates for API
        const formatDate = (date) => date.toISOString().split('T')[0];
        
        // For historical data, we can only go back to 1940-01-01
        // For forecast, we can only go up to 14 days in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // If the target date is in the future, limit to 14 days ahead
        const maxFutureDate = new Date(today);
        maxFutureDate.setDate(today.getDate() + 14);
        
        // If the target date is in the past, limit to 1940-01-01
        const minPastDate = new Date('1940-01-01');
        
        // Adjust target date if it's outside the allowed range
        let adjustedDate = new Date(targetDate);
        if (adjustedDate > maxFutureDate) {
            console.warn(`Date ${formatDate(adjustedDate)} is too far in the future, using ${formatDate(maxFutureDate)} instead`);
            adjustedDate = new Date(maxFutureDate);
        } else if (adjustedDate < minPastDate) {
            console.warn(`Date ${formatDate(adjustedDate)} is too far in the past, using ${formatDate(minPastDate)} instead`);
            adjustedDate = new Date(minPastDate);
        }
        
        // For the API request, we'll use a 3-day window centered on the target date
        // but we'll adjust if we're near the boundaries
        let startDate = new Date(adjustedDate);
        startDate.setDate(adjustedDate.getDate() - 1);
        
        let endDate = new Date(adjustedDate);
        endDate.setDate(adjustedDate.getDate() + 1);
        
        // Ensure we don't go beyond the allowed date range
        if (startDate < minPastDate) startDate = new Date(minPastDate);
        if (endDate > maxFutureDate) endDate = new Date(maxFutureDate);
        
        console.log('Fetching weather data from:', OPEN_METEO_URL);
        console.log('Params:', {
            latitude: lat,
            longitude: lng,
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
            hourly: 'temperature_2m,relativehumidity_2m,weathercode,windspeed_10m,winddirection_10m',
            timezone: timezone,
            models: 'best_match'
        });

        // Make API request
        const response = await axios.get(OPEN_METEO_URL, {
            params: {
                latitude: lat,
                longitude: lng,
                start_date: formatDate(startDate),
                end_date: formatDate(endDate),
                hourly: 'temperature_2m,relativehumidity_2m,weathercode,windspeed_10m,winddirection_10m',
                timezone: timezone,
                models: 'best_match'
            }
        });

        // Process the response to find the closest hourly data to the target time
        const { hourly } = response.data;
        const targetTime = targetDate.toISOString();
        
        // Find the closest time in the hourly data
        let closestIndex = 0;
        let smallestDiff = Infinity;
        
        hourly.time.forEach((time, index) => {
            const diff = Math.abs(new Date(time) - targetDate);
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestIndex = index;
            }
        });

        // Map weather code to condition
        const getWeatherCondition = (code) => {
            // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
            if (code === null) return 'unknown';
            if (code <= 1) return 'sunny';
            if (code <= 3) return 'partly-cloudy';
            if (code <= 48) return 'foggy';
            if (code <= 67 || (code >= 80 && code <= 82)) return 'rainy';
            if (code === 95 || (code >= 96 && code <= 99)) return 'stormy';
            return 'cloudy';
        };

        // Map wind direction in degrees to cardinal direction
        const getWindDirection = (degrees) => {
            if (degrees === null) return '';
            const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                              'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
            const index = Math.round((degrees %= 360) < 0 ? degrees + 360 : degrees / 22.5) % 16;
            return directions[index];
        };

        // Get the weather data for the closest time
        const weatherData = {
            temperature: hourly.temperature_2m[closestIndex],
            condition: getWeatherCondition(hourly.weathercode[closestIndex]),
            windSpeed: hourly.windspeed_10m[closestIndex],
            windDirection: getWindDirection(hourly.winddirection_10m[closestIndex]),
            humidity: hourly.relativehumidity_2m[closestIndex],
            timestamp: hourly.time[closestIndex]
        };

        return weatherData;
    } catch (error) {
        console.error('Error fetching weather data:', error.message);
        if (error.response) {
            // The request was made and the server responded with a status code
            console.error('Response data:', error.response.data);
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            throw new Error(`Weather API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request);
            throw new Error('No response from weather service');
        } else {
            // Something happened in setting up the request
            console.error('Request setup error:', error.message);
            throw new Error(`Failed to fetch weather data: ${error.message}`);
        }
    }
};

/**
 * Get weather data for a specific location and date
 * @param {Object} location - Location object with lat and lng properties
 * @param {string} date - Date string in YYYY-MM-DD format
 * @param {string} time - Time string in HH:MM format (optional)
 * @returns {Promise<Object>} - Formatted weather data
 */
export const getLocationWeather = async (location, date, time = '12:00') => {
    if (!location || !location.lat || !location.lng || !date) {
        throw new Error('Location and date are required');
    }

    // Combine date and time into a single ISO string
    const dateTimeString = `${date}T${time}:00`;
    const weatherData = await getWeatherData(location.lat, location.lng, dateTimeString);
    
    return {
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        windSpeed: weatherData.windSpeed,
        windDirection: weatherData.windDirection,
        humidity: weatherData.humidity,
        timestamp: weatherData.timestamp
    };
};
