import Trip from '../models/Trip.js';
import { validationResult } from 'express-validator';

export const getTrips = async (req, res) => {
    try {
        const { status, location, startDate, endDate, isPublic, page = 1, limit = 10 } = req.query;
        const query = {};
        
        if (status) query.status = status;
        if (isPublic) query.isPublic = isPublic === 'true';
        
        // Date range filter
        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) query.startDate.$gte = new Date(startDate);
            if (endDate) query.startDate.$lte = new Date(endDate);
        }
        
        // Location search (simplified - would use geospatial query in production)
        if (location) {
            query['location.name'] = new RegExp(location, 'i');
        }

        const trips = await Trip.find(query)
            .populate('createdBy', 'username profilePicture')
            .sort({ startDate: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Trip.countDocuments(query);

        res.json({
            trips,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const getTripById = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id)
            .populate('createdBy', 'username profilePicture')
            .populate('participants.user', 'username profilePicture');
            
        if (!trip) {
            return res.status(404).json({ msg: 'Trip not found' });
        }

        res.json(trip);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Trip not found' });
        }
        res.status(500).send('Server Error');
    }
};

export const createTrip = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { 
            title, 
            description, 
            location, 
            startDate, 
            endDate, 
            maxParticipants, 
            isPublic = true,
            tags = [] 
        } = req.body;
        
        const newTrip = new Trip({
            title,
            description,
            location: {
                type: 'Point',
                coordinates: [location.lng, location.lat],
                name: location.name
            },
            startDate,
            endDate,
            maxParticipants: maxParticipants || 10,
            isPublic,
            createdBy: req.user.id,
            participants: [{
                user: req.user.id,
                status: 'confirmed'
            }],
            tags: Array.isArray(tags) ? tags : [tags],
            status: 'upcoming'
        });

        await newTrip.save();
        
        // Populate the createdBy field for the response
        await newTrip.populate('createdBy', 'username profilePicture');
        
        res.status(201).json(newTrip);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const updateTrip = async (req, res) => {
    try {
        const { 
            title, 
            description, 
            location, 
            startDate, 
            endDate, 
            maxParticipants, 
            isPublic,
            status,
            tags
        } = req.body;
        
        let trip = await Trip.findById(req.params.id);
        
        if (!trip) {
            return res.status(404).json({ msg: 'Trip not found' });
        }
        
        // Check if user is the creator
        if (trip.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Update fields
        if (title) trip.title = title;
        if (description) trip.description = description;
        if (location) {
            trip.location = {
                type: 'Point',
                coordinates: [location.lng, location.lat],
                name: location.name
            };
        }
        if (startDate) trip.startDate = startDate;
        if (endDate) trip.endDate = endDate;
        if (maxParticipants) trip.maxParticipants = maxParticipants;
        if (typeof isPublic !== 'undefined') trip.isPublic = isPublic;
        if (status) trip.status = status;
        if (tags) trip.tags = Array.isArray(tags) ? tags : [tags];
        
        // Handle image updates if any
        if (req.files && req.files.length > 0) {
            // In a real app, you'd handle file uploads here
            trip.images = req.files.map(file => file.path);
        }

        await trip.save();
        
        // Populate fields for the response
        await trip.populate('createdBy', 'username profilePicture');
        await trip.populate('participants.user', 'username profilePicture');
        
        res.json(trip);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const deleteTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        
        if (!trip) {
            return res.status(404).json({ msg: 'Trip not found' });
        }
        
        // Check if user is the creator or admin
        if (trip.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await trip.remove();
        res.json({ msg: 'Trip removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Trip not found' });
        }
        res.status(500).send('Server Error');
    }
};

export const joinTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        
        if (!trip) {
            return res.status(404).json({ msg: 'Trip not found' });
        }
        
        // Check if trip is public or user is invited
        if (!trip.isPublic) {
            return res.status(403).json({ msg: 'This is a private trip' });
        }
        
        // Check if already a participant
        const isParticipant = trip.participants.some(
            p => p.user.toString() === req.user.id
        );
        
        if (isParticipant) {
            return res.status(400).json({ msg: 'Already a participant of this trip' });
        }
        
        // Check if there's space
        if (trip.participants.length >= trip.maxParticipants) {
            return res.status(400).json({ msg: 'Trip is full' });
        }
        
        // Add user as a participant
        trip.participants.push({
            user: req.user.id,
            status: 'pending'
        });
        
        await trip.save();
        
        // Populate fields for the response
        await trip.populate('participants.user', 'username profilePicture');
        
        res.json(trip.participants);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const updateParticipantStatus = async (req, res) => {
    try {
        const { participantId, status } = req.body;
        
        if (!['pending', 'confirmed', 'declined'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid status' });
        }
        
        const trip = await Trip.findById(req.params.id);
        
        if (!trip) {
            return res.status(404).json({ msg: 'Trip not found' });
        }
        
        // Check if user is the trip creator
        if (trip.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized to update participant status' });
        }
        
        // Find and update participant status
        const participantIndex = trip.participants.findIndex(
            p => p._id.toString() === participantId
        );
        
        if (participantIndex === -1) {
            return res.status(404).json({ msg: 'Participant not found in this trip' });
        }
        
        trip.participants[participantIndex].status = status;
        
        await trip.save();
        
        // Populate fields for the response
        await trip.populate('participants.user', 'username profilePicture');
        
        res.json(trip.participants);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
