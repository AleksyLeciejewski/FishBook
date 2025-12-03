import FishingSpot from '../models/fishingSpots.js';

// @desc    Search fishing spots
// @route   GET /fishing-spots
// @access  Public
export const searchFishingSpots = async (req, res) => {
    try {
        const { q, type } = req.query;
        const query = {};

        // Add search term to query
        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ];
        }

        // Add type filter if provided
        if (type) {
            query.type = type;
        }

        const spots = await FishingSpot.find(query).lean();
        
        if (req.accepts('json')) {
            return res.json({ success: true, data: spots });
        }

        res.render('spots/index', {
            title: 'Find Fishing Spots',
            spots,
            searchQuery: q || '',
            selectedType: type || ''
        });
    } catch (error) {
        console.error('Error searching fishing spots:', error);
        if (req.accepts('json')) {
            return res.status(500).json({ success: false, message: 'Error searching fishing spots' });
        }
        res.status(500).render('error', {
            title: 'Error',
            error: 'Error searching fishing spots',
            message: error.message
        });
    }
};

// @desc    Get all fishing spots
// @route   GET /fishing-spots/all
// @access  Public
export const getAllFishingSpots = async (req, res) => {
    try {
        const spots = await FishingSpot.find({}).lean();
        res.json({ success: true, data: spots });
    } catch (error) {
        console.error('Error getting fishing spots:', error);
        res.status(500).json({ success: false, message: 'Error getting fishing spots' });
    }
};
