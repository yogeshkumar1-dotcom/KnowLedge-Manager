import express from 'express';
import { startInterview, processTurn, finishInterview, getAllSessions, getSessionById } from '../controllers/aiInterview.controller.js';

const router = express.Router();

router.post('/start', startInterview);
router.post('/turn', processTurn);
router.post('/end', finishInterview);
router.get('/sessions', getAllSessions);
router.get('/sessions/:id', getSessionById);

export default router;
