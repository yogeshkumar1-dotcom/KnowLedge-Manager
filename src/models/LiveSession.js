import mongoose from 'mongoose';

const liveSessionSchema = new mongoose.Schema({
    candidateName: String,
    role: String,
    level: String,
    experience: String,
    durationMinutes: Number,
    startTime: Date,
    status: {
        type: String,
        enum: ['IDLE', 'INITIALIZING', 'AI_SPEAKING', 'CANDIDATE_SPEAKING', 'SILENCE_WAIT', 'PROCESSING', 'NEXT_QUESTION', 'COMPLETED'],
        default: 'IDLE'
    },
    history: [{
        role: { type: String, enum: ['ai', 'user'] },
        content: String,
        timestamp: Date
    }],
    transcript: String, // Full concatenated transcript
    createdAt: { type: Date, default: Date.now }
});

export const LiveSession = mongoose.models.LiveSession || mongoose.model('LiveSession', liveSessionSchema);
