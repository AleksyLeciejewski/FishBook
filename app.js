const express = require('express');

let FishingSpot;
try {
    FishingSpot = require('./models/FishingSpots');
} catch (e) {
    try {
        FishingSpot = require('./models/FishingSpot');
    } catch (e2) {
        FishingSpot = null;
    }
}

const app = express();
app.use(express.json());

app.get('/fishing-spots', async (req, res) => {
    try {
        if (!FishingSpot) return res.status(500).json({ error: 'FishingSpot model not found' });
        const { type } = req.query;
        const filter = type ? { type } : {};
        const spots = await FishingSpot.find(filter).lean();
        res.json(spots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = app;
