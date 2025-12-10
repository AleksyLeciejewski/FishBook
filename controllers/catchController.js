// javascript
import Draft from '../models/Draft.js';
import Catch from '../models/Catch.js';
import { validationResult } from 'express-validator';
import { getLocationWeather } from '../services/weatherService.js';
import path from 'path';
import fs from 'fs';

export const renderCatchesIndex = async (req, res) => {
    try {
        const { species, minWeight, maxWeight, location, userId, page = 1, limit = 12 } = req.query;
        const query = { isPublic: true };

        if (species) query.species = new RegExp(species, 'i');
        if (minWeight || maxWeight) {
            query.weight = {};
            if (minWeight) query.weight.$gte = Number(minWeight);
            if (maxWeight) query.weight.$lte = Number(maxWeight);
        }
        if (userId) query.user = userId;
        if (location) query['location.name'] = new RegExp(location, 'i');

        const catches = await Catch.find(query)
            .populate('user', 'username profilePicture')
            .sort({ dateCaught: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const count = await Catch.countDocuments(query);

        // --- Drafts: robust session user extraction + debug logs ---
        let drafts = [];
        const sessionUser = req.session && req.session.user;
        // Accept multiple shapes: {_id}, {id}, or direct string
        const sessionUserId = sessionUser && (sessionUser._id || sessionUser.id || sessionUser);

        console.log('renderCatchesIndex: sessionUser=', JSON.stringify(sessionUser || null));
        console.log('renderCatchesIndex: resolved sessionUserId=', sessionUserId);

        if (sessionUserId) {
            drafts = await Draft.find({ user: sessionUserId, type: 'catch' })
                .sort({ updatedAt: -1 })
                .lean();
        }

        console.log('renderCatchesIndex: drafts count =', Array.isArray(drafts) ? drafts.length : 0);

        res.render('catches/index', {
            title: 'All Catches',
            catches,
            drafts,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page, 10),
            species: species || '',
            minWeight: minWeight || '',
            maxWeight: maxWeight || '',
            location: location || '',
            userId: userId || '',
            search: req.query.search || '',
            queryString: '',
            topAnglers: [],
            recentActivity: []
        });
    } catch (err) {
        console.error('Error in renderCatchesIndex:', err);
        res.status(500).render('error', {
            title: 'Error',
            error: 'Error loading catches',
            message: err.message
        });
    }
};

export const renderNewCatchForm = async (req, res) => {
    try {
        let catchItem = undefined;
        let draftId = '';
        const draftIdQuery = req.query.draftId;

        if (draftIdQuery) {
            try {
                const found = await Draft.findById(draftIdQuery).lean();
                // ensure draft exists, belongs to current user and is a 'catch'
                if (found && req.user && found.user.toString() === req.user.id && found.type === 'catch') {
                    catchItem = found.data || {};
                    draftId = found._id ? found._id.toString() : '';
                }
            } catch (e) {
                console.error('Error loading draft for new catch:', e.message);
            }
        }

        res.render('catches/new', {
            title: 'Log a Catch',
            errors: null,
            catchItem,
            draftId
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).render('error', {
            title: 'Error',
            error: 'Error loading form',
            message: err.message
        });
    }
};

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

        if (location) {
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

export const renderCatchDetail = async (req, res) => {
    try {
        const catchItem = await Catch.findById(req.params.id)
            .populate('user', 'username profilePicture')
            .populate('comments.user', 'username profilePicture');

        if (!catchItem) {
            return res.status(404).render('error', {
                title: 'Error',
                error: 'Catch not found',
                message: 'The catch you are looking for does not exist.'
            });
        }

        res.render('catches/show', {
            title: `${catchItem.species} - FishBook`,
            catchItem
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).render('error', {
            title: 'Error',
            error: 'Error loading catch',
            message: err.message
        });
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
        const {
            species,
            weight,
            length,
            locationName,
            latitude,
            longitude,
            description,
            isPublic,
            dateCaught,
            timeCaught,
            bait,
            tackle,
            weatherTemp,
            weatherCondition,
            weatherWindSpeed,
            weatherWindDirection
        } = req.body;

        if (!species || !weight || !locationName || !latitude || !longitude || !dateCaught) {
            return res.status(400).render('catches/new', {
                title: 'Log a Catch',
                errors: [{ msg: 'Please fill in all required fields (species, weight, location, date)' }]
            });
        }

        if (!req.file) {
            return res.status(400).render('catches/new', {
                title: 'Log a Catch',
                errors: [{ msg: 'Please upload an image of your catch' }]
            });
        }

        const imagePath = req.file.path.replace(/\\/g, '/').replace('public/', '');

        const catchData = {
            user: req.user._id || req.user.id,
            species,
            weight: parseFloat(weight),
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
                name: locationName
            },
            image: imagePath,
            description: description || '',
            isPublic: isPublic === 'on' || isPublic === true,
            dateCaught: new Date(dateCaught)
        };

        if (length) catchData.length = parseFloat(length);
        if (bait) catchData.bait = bait;
        if (tackle) catchData.tackle = tackle;

        if (weatherTemp || weatherCondition || weatherWindSpeed || weatherWindDirection) {
            catchData.weather = {};
            if (weatherTemp) catchData.weather.temperature = parseFloat(weatherTemp);
            if (weatherCondition) catchData.weather.condition = weatherCondition;
            if (weatherWindSpeed) catchData.weather.windSpeed = parseFloat(weatherWindSpeed);
            if (weatherWindDirection) catchData.weather.windDirection = weatherWindDirection;
        }

        const newCatch = new Catch(catchData);
        await newCatch.save();

        res.redirect('/catches');
    } catch (err) {
        console.error('Error creating catch:', err);

        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkErr) {
                console.error('Error deleting file:', unlinkErr);
            }
        }

        res.status(500).render('catches/new', {
            title: 'Log a Catch',
            errors: [{ msg: 'Error saving catch: ' + err.message }]
        });
    }
};

export const updateCatch = async (req, res) => {
    try {
        const { species, weight, length, location, description, isPublic } = req.body;

        let catchItem = await Catch.findById(req.params.id);

        if (!catchItem) {
            return res.status(404).json({ msg: 'Catch not found' });
        }

        if (catchItem.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

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

        if (req.file) {
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

        if (catchItem.user.toString() !== req.user.id && !req.user.isAdmin) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

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

        const userId = req.user._id || req.user.id;
        const newComment = {
            user: userId,
            text
        };

        catchItem.comments.unshift(newComment);
        await catchItem.save();

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
        
        const userId = req.user._id || req.user.id;

        // Check if the catch has already been liked by this user
        const isLiked = catchItem.likes.some(
            like => like.toString() === userId.toString()
        );
        
        if (isLiked) {
            catchItem.likes = catchItem.likes.filter(like => like.toString() !== userId.toString());
        } else {
            catchItem.likes.unshift(userId);
        }

        await catchItem.save();

        res.json({ likes: catchItem.likes });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
