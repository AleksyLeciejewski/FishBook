import Catch from '../models/Catch.js';
import { validationResult } from 'express-validator';
import { getLocationWeather } from '../services/weatherService.js';

export const getCatches = async (req, res) => {
    try {
        const { species, minWeight, maxWeight, location, userId, page = 1, limit = 10 } = req.query;
        const query = { isPublic: true };
        
        if (species) query.species = new RegExp(species, 'i');
        if (minWeight || maxWeight) {
            query.weight = {};
            if (minWeight) query.weight.$gte = Number(minWeight);
            if (maxWeight) query.weight.$lte = Number(maxWeight);
        }
        if (userId) query.user = userId;
        
        // Handle location-based search (simplified - would need geospatial query in production)
        if (location) {
            // This is a simplified version - in production, you'd use MongoDB's geospatial queries
            query['location.name'] = new RegExp(location, 'i');
        }

        const catches = await Catch.find(query)
            .populate('user', 'username profilePicture')
            .sort({ dateCaught: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Catch.countDocuments(query);

        res.json({
            catches,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const getCatchById = async (req, res) => {
    try {
        const catchItem = await Catch.findById(req.params.id)
            .populate('user', 'username profilePicture')
            .populate('comments.user', 'username profilePicture');
            
        if (!catchItem) {
            return res.status(404).json({ msg: 'Catch not found' });
        }

        res.json(catchItem);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Catch not found' });
        }
        res.status(500).send('Server Error');
    }
};

export const createCatch = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { 
            species, 
            weight, 
            length, 
            location, 
            description, 
            isPublic = true,
            dateCaught = new Date().toISOString().split('T')[0],
            timeCaught = '12:00'
        } = req.body;
        
        // In a real app, you'd process the image upload here
        const image = req.file ? req.file.path : '';

        // Prepare catch data
        const catchData = {
            user: req.user.id,
            species,
            weight,
            length,
            location: {
                type: 'Point',
                coordinates: [location.lng, location.lat],
                name: location.name
            },
            image,
            description,
            isPublic,
            dateCaught
        };

        try {
            // Get weather data for the catch location and time
            const weather = await getLocationWeather(
                { lat: location.lat, lng: location.lng },
                dateCaught,
                timeCaught
            );
            
            // Add weather data to catch
            catchData.weather = {
                temperature: weather.temperature,
                condition: weather.condition,
                windSpeed: weather.windSpeed,
                windDirection: weather.windDirection,
                humidity: weather.humidity,
                timestamp: weather.timestamp
            };
        } catch (weatherError) {
            console.error('Error fetching weather data:', weatherError);
            // Continue without weather data if there's an error
        }

        const newCatch = new Catch(catchData);

        await newCatch.save();
        res.json(newCatch);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const updateCatch = async (req, res) => {
    try {
        const { species, weight, length, location, description, isPublic } = req.body;
        
        let catchItem = await Catch.findById(req.params.id);
        
        if (!catchItem) {
            return res.status(404).json({ msg: 'Catch not found' });
        }
        
        // Check user ownership
        if (catchItem.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Update fields
        if (species) catchItem.species = species;
        if (weight) catchItem.weight = weight;
        if (length) catchItem.length = length;
        if (description) catchItem.description = description;
        if (typeof isPublic !== 'undefined') catchItem.isPublic = isPublic;
        if (location) {
            catchItem.location = {
                type: 'Point',
                coordinates: [location.lng, location.lat],
                name: location.name
            };
        }
        
        // Handle image update if a new image is uploaded
        if (req.file) {
            // In a real app, you'd delete the old image from storage
            catchItem.image = req.file.path;
        }

        await catchItem.save();
        res.json(catchItem);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const deleteCatch = async (req, res) => {
    try {
        const catchItem = await Catch.findById(req.params.id);
        
        if (!catchItem) {
            return res.status(404).json({ msg: 'Catch not found' });
        }
        
        // Check user ownership or admin
        if (catchItem.user.toString() !== req.user.id && !req.user.isAdmin) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // In a real app, you'd delete the associated image from storage
        
        await catchItem.remove();
        res.json({ msg: 'Catch removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Catch not found' });
        }
        res.status(500).send('Server Error');
    }
};

export const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        
        const catchItem = await Catch.findById(req.params.id);
        
        if (!catchItem) {
            return res.status(404).json({ msg: 'Catch not found' });
        }
        
        const newComment = {
            user: req.user.id,
            text
        };
        
        catchItem.comments.unshift(newComment);
        await catchItem.save();
        
        // Populate the user info in the response
        await catchItem.populate('comments.user', 'username profilePicture');
        
        res.json(catchItem.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const toggleLike = async (req, res) => {
    try {
        const catchItem = await Catch.findById(req.params.id);
        
        if (!catchItem) {
            return res.status(404).json({ msg: 'Catch not found' });
        }
        
        // Check if the catch has already been liked by this user
        const isLiked = catchItem.likes.some(
            like => like.toString() === req.user.id
        );
        
        if (isLiked) {
            // Remove like
            catchItem.likes = catchItem.likes.filter(
                like => like.toString() !== req.user.id
            );
        } else {
            // Add like
            catchItem.likes.unshift(req.user.id);
        }
        
        await catchItem.save();
        
        res.json({ likes: catchItem.likes });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
