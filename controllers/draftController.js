import Draft from '../models/Draft.js';
import { validationResult } from 'express-validator';

const deepMerge = (target = {}, source = {}) => {
    if (typeof target !== 'object' || target === null) return source;
    if (typeof source !== 'object' || source === null) return source;

    const result = Array.isArray(target) ? [...target] : { ...target };

    for (const key of Object.keys(source)) {
        const sVal = source[key];
        const tVal = result[key];

        if (Array.isArray(sVal)) {
            result[key] = [...sVal];
        } else if (typeof sVal === 'object' && sVal !== null) {
            result[key] = deepMerge(tVal, sVal);
        } else {
            result[key] = sVal;
        }
    }

    return result;
};


const normalizeLocation = (data = {}) => {
    if (typeof data !== 'object' || data === null) return data;

    // If separate lat/lng fields provided (common from form inputs)
    if ((data.latitude !== undefined || data.lat !== undefined) &&
        (data.longitude !== undefined || data.lng !== undefined)) {
        const lat = parseFloat((data.latitude ?? data.lat));
        const lng = parseFloat((data.longitude ?? data.lng));
        const name = data.locationName ?? data.location_name ?? (data.location && data.location.name) ?? '';

        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            data.location = {
                type: 'Point',
                coordinates: [lng, lat],
                name: name || ''
            };
        }

        // remove individual fields to avoid confusion in stored draft.data
        delete data.latitude;
        delete data.longitude;
        delete data.lat;
        delete data.lng;
        delete data.locationName;
        delete data.location_name;
    } else if (data.location && typeof data.location === 'object') {
        const loc = data.location;

        // If location provided as { lat, lng, name }
        if ((loc.lat !== undefined || loc.latitude !== undefined) &&
            (loc.lng !== undefined || loc.longitude !== undefined)) {
            const lat = parseFloat(loc.lat ?? loc.latitude);
            const lng = parseFloat(loc.lng ?? loc.longitude);
            const name = loc.name ?? '';

            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                data.location = {
                    type: 'Point',
                    coordinates: [lng, lat],
                    name
                };
            }
        }

        // If location provided with coordinates array (maybe [lng, lat] or [lat, lng])
        else if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
            // Assume stored as [lng, lat] (GeoJSON)
            const lng = parseFloat(loc.coordinates[0]);
            const lat = parseFloat(loc.coordinates[1]);
            const name = loc.name ?? '';

            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                data.location = {
                    type: 'Point',
                    coordinates: [lng, lat],
                    name
                };
            }
        }
    }

    return data;
};

export const createOrUpdateDraft = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { id, type } = req.body;
        let { data } = req.body;

        // Parse JSON string payloads
        if (typeof data === 'string') {
            try {
                data = data ? JSON.parse(data) : {};
            } catch (e) {
                console.warn('Draft data JSON parse failed, treating as raw string');
            }
        }

        // Ensure data is an object
        const parsedData = (data && typeof data === 'object') ? { ...data } : {};

        // Normalize location fields into canonical shape
        normalizeLocation(parsedData);

        if (id) {
            const draft = await Draft.findById(id);
            if (!draft) return res.status(404).json({ msg: 'Draft not found' });
            if (draft.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

            // Preserve existing type if omitted
            draft.type = type || draft.type;

            // Merge incoming data into existing draft.data (preserve unspecified fields)
            draft.data = deepMerge(draft.data || {}, parsedData);

            await draft.save();
            return res.json(draft);
        }

        // Create new draft
        const newDraft = new Draft({
            user: req.user.id,
            type,
            data: parsedData || {}
        });

        await newDraft.save();
        res.status(201).json(newDraft);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const getDrafts = async (req, res) => {
    try {
        const { type } = req.query;
        const query = { user: req.user.id };
        if (type) query.type = type;

        const drafts = await Draft.find(query).sort({ updatedAt: -1 });
        res.json(drafts);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const getDraftById = async (req, res) => {
    try {
        const draft = await Draft.findById(req.params.id);
        if (!draft) return res.status(404).json({ msg: 'Draft not found' });
        if (draft.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });
        res.json(draft);
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Draft not found' });
        res.status(500).send('Server Error');
    }
};

export const deleteDraft = async (req, res) => {
    try {
        const draft = await Draft.findById(req.params.id);
        if (!draft) return res.status(404).json({ msg: 'Draft not found' });
        if (draft.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        await Draft.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Draft removed' });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Draft not found' });
        res.status(500).send('Server Error');
    }
};
