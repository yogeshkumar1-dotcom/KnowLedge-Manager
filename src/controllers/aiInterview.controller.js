import { startSession, handleTurn, endSession } from '../services/aiInterview.service.js';
import { LiveSession } from '../models/LiveSession.js';

export const startInterview = async (req, res, next) => {
    try {
        const data = req.body;
        const result = await startSession(data);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const processTurn = async (req, res, next) => {
    try {
        const { sessionId, text } = req.body;
        const result = await handleTurn(sessionId, text);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const finishInterview = async (req, res, next) => {
    try {
        const { sessionId } = req.body;
        const result = await endSession(sessionId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const getAllSessions = async (req, res, next) => {
    try {
        const sessions = await LiveSession.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        next(error);
    }
};

export const getSessionById = async (req, res, next) => {
    try {
        const session = await LiveSession.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }
        res.status(200).json({ success: true, data: session });
    } catch (error) {
        next(error);
    }
};
