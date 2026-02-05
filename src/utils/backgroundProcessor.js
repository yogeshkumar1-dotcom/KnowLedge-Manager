import { Interview } from "../models/interview.models.js";
import { extractTranscript } from "./extractTranscriptFromAudio.js";
import { scoreInterview } from "../services/interviewScoring.services.js";

// Background processing for interviews
export const processInterviewInBackground = async (interviewId, aiConfig = {}) => {
  try {
    console.log(`Starting background processing for interview: ${interviewId}`);
    
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
      status: () => ({ json: () => {} }),
      json: () => {}
    };
    
    // Process transcription and scoring
    await createTranscript(mockReq, mockRes);
    
    console.log(`Background processing completed for interview: ${interviewId}`);
  } catch (error) {
    // Handle error silently
  }
};