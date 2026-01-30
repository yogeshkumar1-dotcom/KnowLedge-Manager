import express from 'express';
import { 
  getInterviews, 
  getInterviewById, 
  updateInterviewScore 
} from '../controllers/interview.controllers.js';

const router = express.Router();

router.get('/', getInterviews);
router.get('/:id', getInterviewById);
router.put('/:id/score', updateInterviewScore);

export default router;