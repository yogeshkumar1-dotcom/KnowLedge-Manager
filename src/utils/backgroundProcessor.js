import { Interview } from "../models/interview.models.js";
import { extractTranscript } from "./extractTranscriptFromAudio.js";
import { scoreInterview } from "../services/interviewScoring.services.js";
import { createTranscriptCore } from "../controllers/transcription.controllers.js";

// Background processing for interviews
export const processInterviewInBackground = async (interviewId, aiConfig = {}) => {
  try {
    console.log(`Starting background processing for interview: ${interviewId}`);
    console.log(`AI Config received:`, aiConfig);
    
    // Create mock request object for transcription processing
    const mockReq = {
      interviewId,
      fileType: 'audio',
      body: {
        customApiKey: aiConfig.customApiKey,
        selectedModel: aiConfig.selectedModel
      }
    };
    
    const mockRes = {
      headersSent: true, // Prevent sending response
      status: () => ({ json: () => {} }),
      json: () => {}
    };
    console.log("Calling createTranscriptCore with mockReq:", { interviewId: mockReq.interviewId, fileType: mockReq.fileType });
    
    // Process transcription and scoring - use core function directly
    await createTranscriptCore(mockReq, mockRes);
    
    console.log(`Background processing completed for interview: ${interviewId}`);
  } catch (error) {
    console.error(`Background processing failed for interview ${interviewId}:`, error);
    console.error(`Error stack:`, error.stack);
    throw error; // Re-throw to let caller handle it
  }
};