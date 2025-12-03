import mongoose from 'mongoose';

const CoordinatesSchema = new mongoose.Schema({
    lat: { type: Number },
    lng: { type: Number }
}, { _id: false });

const FishingSpotSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ['gratis', 'betalings', 'privat'] },
    description: { type: String, default: '' },
    location: CoordinatesSchema
}, { timestamps: true });

FishingSpotSchema.index({ type: 1 });

const FishingSpot = mongoose.models.FishingSpot || mongoose.model('FishingSpot', FishingSpotSchema);

export default FishingSpot;
