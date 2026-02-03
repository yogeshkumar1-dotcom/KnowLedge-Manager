import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY;

export const analyzeInterviewWithAssemblyAI = async (transcriptId) => {
  try {
    console.log('Starting AssemblyAI LLM analysis for transcript:', transcriptId);
    
    const response = await axios.post(
      'https://llm-gateway.assemblyai.com/v1/understanding',
      {
        transcript_id: transcriptId,
        prompt: `Analyze this interview transcript and provide comprehensive scoring for communication skills. Focus on:
        
        1. Overall communication effectiveness (0-10 score)
        2. Speaking pace and clarity
        3. Confidence level assessment
        4. Professional language usage
        5. Interview performance insights
        6. Areas for improvement
        7. Key strengths demonstrated
        
        Provide specific examples from the transcript to support your analysis.`,
        
        max_output_tokens: 2000,
        temperature: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${ASSEMBLYAI_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('AssemblyAI LLM analysis completed');
    return {
      analysis: response.data.response,
      confidence: response.data.confidence || 0.9,
      source: 'assemblyai_llm'
    };
    
  } catch (error) {
    console.error('AssemblyAI LLM analysis failed:', error.response?.data || error.message);
    throw error;
  }
};

export const getTranscriptInsights = async (transcriptId) => {
  try {
    console.log('Getting transcript insights from AssemblyAI:', transcriptId);
    
    const response = await axios.post(
      'https://llm-gateway.assemblyai.com/v1/understanding',
      {
        transcript_id: transcriptId,
        prompt: `Extract key insights from this interview:
        
        1. Main topics discussed
        2. Questions asked by interviewer
        3. Candidate's key responses
        4. Technical skills mentioned
        5. Experience highlights
        6. Communication patterns
        7. Overall interview flow
        
        Format as structured data with clear categories.`,
        
        max_output_tokens: 1500,
        temperature: 0.2
      },
      {
        headers: {
          'Authorization': `Bearer ${ASSEMBLYAI_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      insights: response.data.response,
      source: 'assemblyai_insights'
    };
    
  } catch (error) {
    console.error('AssemblyAI insights failed:', error.response?.data || error.message);
    throw error;
  }
};