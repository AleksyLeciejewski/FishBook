import mongoose from 'mongoose';

const draftSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['catch', 'trip'],
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Optional: index to quickly lookup user's drafts
draftSchema.index({ user: 1, updatedAt: -1 });

const Draft = mongoose.model('Draft', draftSchema);
export default Draft;