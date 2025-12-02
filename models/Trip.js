import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 2000
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
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    maxParticipants: {
        type: Number,
        min: 1,
        default: 10
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'declined'],
            default: 'pending'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    images: [{
        type: String
    }],
    tags: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['upcoming', 'in_progress', 'completed', 'cancelled'],
        default: 'upcoming'
    }
}, {
    timestamps: true
});

// Index for geospatial queries
tripSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for trip URL
tripSchema.virtual('url').get(function() {
    return `/trips/${this._id}`;
});

// Virtual to check if a user is a participant
tripSchema.methods.isParticipant = function(userId) {
    return this.participants.some(
        participant => participant.user.toString() === userId.toString()
    );
};

// Virtual to check if a user is the creator
tripSchema.methods.isCreator = function(userId) {
    return this.createdBy.toString() === userId.toString();
};

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
