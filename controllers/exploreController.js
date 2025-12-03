import FishingSpot from '../models/fishingSpots.js';

// @desc    Explore fishing spots
// @route   GET /explore
// @access  Public
export const exploreFishingSpots = async (req, res) => {
    try {
        const { q, type } = req.query;
        const query = {};

        // Add search term to query
        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { 'location.name': { $regex: q, $options: 'i' } }
            ];
        }

        // Add type filter if provided
        if (type) {
            query.type = type;
        }

        const spots = await FishingSpot.find(query)
            .sort({ updatedAt: -1 })
            .lean();
        
        res.render('explore', {
            title: 'Explore Fishing Spots',
            spots,
            searchQuery: q || '',
            selectedType: type || ''
        });
    } catch (error) {
        console.error('Error exploring fishing spots:', error);
        res.status(500).render('error', {
            title: 'Error',
            error: 'Error loading fishing spots',
            message: error.message
        });
    }
};

// @desc    Get all fishing spots as JSON (for AJAX)
// @route   GET /api/explore
// @access  Public
export const getFishingSpotsAPI = async (req, res) => {
    try {
        const { q, type } = req.query;
        const query = {};

        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { 'location.name': { $regex: q, $options: 'i' } }
            ];
        }

        if (type) {
            query.type = type;
        }

        const spots = await FishingSpot.find(query)
            .sort({ updatedAt: -1 })
            .lean();
            
        res.json({ success: true, data: spots });
    } catch (error) {
        console.error('Error getting fishing spots:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error getting fishing spots',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
