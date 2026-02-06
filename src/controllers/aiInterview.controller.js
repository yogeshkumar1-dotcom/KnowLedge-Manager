import { startSession, handleTurn, endSession } from '../services/aiInterview.service.js';

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
