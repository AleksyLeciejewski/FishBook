import mongoose from 'mongoose';

const catchSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    species: {
        type: String,
        required: true,
        trim: true
    },
    weight: {
        type: Number,
        required: true,
        min: 0
    },
    length: {
        type: Number,
        min: 0
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true,
            index: '2dsphere'
        },
        name: {
            type: String,
            required: true
        }
    },
    dateCaught: {
        type: Date,
        default: Date.now
    },
    image: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        maxlength: 1000
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        text: {
            type: String,
            required: true,
            maxlength: 500
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Create a 2dsphere index for geospatial queries
catchSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for catch URL
catchSchema.virtual('url').get(function() {
    return `/catches/${this._id}`;
});

const Catch = mongoose.model('Catch', catchSchema);
export default Catch;
