import express from 'express';
import { 
  getInterviews, 
  getInterviewById, 
  updateInterviewScore,
  generatePDFReport,
  generateBulkPDF
} from '../controllers/interview.controllers.js';

const router = express.Router();

router.get('/', getInterviews);
router.get('/:id', getInterviewById);
router.put('/:id/score', updateInterviewScore);
router.get('/:id/pdf', generatePDFReport);
router.post('/generate-bulk-pdf', generateBulkPDF);

export default router;