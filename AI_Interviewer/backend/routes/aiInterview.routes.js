import express from 'express';
import { startInterview, processTurn, finishInterview } from '../controllers/aiInterview.controller.js';

const router = express.Router();

router.post('/start', startInterview);
router.post('/turn', processTurn);
router.post('/end', finishInterview);

export default router;
