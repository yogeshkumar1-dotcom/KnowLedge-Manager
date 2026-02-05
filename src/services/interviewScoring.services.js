import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
});

export const scoreInterview = async (transcript) => {
  let timeoutHandle;
  
  try {
    console.log("Starting interview scoring...");
    
    const prompt = `
You are an expert interview communication coach like professional tools (e.g. Yoodli-style analysis).

RULES (VERY IMPORTANT):
- Analyze ONLY what is present in the transcript.
- Be objective and professional.
- Do NOT hallucinate data.
- Do NOT explain anything outside JSON.
- ALWAYS return VALID JSON.
- Scores must be between 0 and 10.
- Use decimals where appropriate.
- If something cannot be inferred, mark it as null.
- Extract actual names mentioned in the conversation, not just "Speaker A" or "Speaker B".
- Look for introductions like "Hi, I'm John" or "My name is Sarah".
- Be CONSISTENT - same transcript should always give same scores.

SCORING WEIGHTS:
- Fluency: 25%
- Clarity: 20%
- Confidence: 20%
- Structure: 15%
- Relevance: 10%
- Engagement: 10%

FINAL SCORE = weighted average (rounded to 1 decimal).

TRANSCRIPT:
"""
${transcript}
"""

RETURN JSON IN EXACTLY THIS FORMAT:

{
  "overall_communication_score": number,
  "interviewer_name": string | null,
  "interviewee_name": string | null,
  "summary": {
    "verdict": string,
    "strengths": [string],
    "primary_issues": [string]
  },
  "speech_metrics": {
    "words_per_minute": number,
    "pause_analysis": {
      "long_pauses_detected": boolean,
      "average_pause_duration_seconds": number
    },
    "filler_words": {
      "total_count": number,
      "fillers_per_minute": number,
      "most_common_fillers": [string]
    },
    "repetition": {
      "repeated_words_detected": boolean,
      "examples": [string]
    }
  },
  "language_quality": {
    "grammar_score": number,
    "clarity_score": number,
    "fluency_score": number,
    "incorrect_or_awkward_phrases": [string]
  },
  "communication_skills": {
    "confidence_score": number,
    "structure_score": number,
    "relevance_score": number,
    "engagement_score": number
  },
  "coaching_feedback": {
    "what_went_well": [string],
    "what_to_improve": [string],
    "actionable_tips": [string]
  }
}

IMPORTANT:
- Output JSON only.
- No markdown.
- No explanations.
- Be CONSISTENT with scoring.
`;

    // Create a timeout promise that we can clear
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error('LLM request timeout after 2 minutes'));
      }, 120000); // 2 minutes - Gemini is usually fast
    });
    
    // Race between Gemini response and timeout
    const response = await Promise.race([
      genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 4096,
        }
      }),
      timeoutPromise
    ]);

    // Clear timeout if response succeeded
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }

    console.log("LLM response received");
    
    const rawText = response.candidates[0].content.parts[0].text;
    console.log("Raw response length:", rawText.length);

    try {
      // Clean the response text
      let cleanText = rawText.trim();
      
      // Remove markdown code blocks if present
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/\s*```$/, '');
      }
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/\s*```$/, '');
      }
      
      const result = JSON.parse(cleanText);
      console.log("JSON parsed successfully");
      return result;
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Full raw text:", rawText);
      throw new Error("Invalid JSON returned by Gemini");
    }
  } catch (error) {
    // Clear timeout on error
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
    
    console.error("Error in scoreInterview:", error.message);
    
    // Return a default safe response instead of crashing
    if (error.message.includes('timeout')) {
      console.error("LLM request timed out. Returning default scoring.");
      return {
        overall_communication_score: 5.0,
        interviewer_name: null,
        interviewee_name: null,
        summary: {
          verdict: "Could not complete analysis - service timeout",
          strengths: [],
          primary_issues: ["Analysis service timeout - please retry"]
        },
        speech_metrics: {
          words_per_minute: 0,
          pause_analysis: { long_pauses_detected: false, average_pause_duration_seconds: 0 },
          filler_words: { total_count: 0, fillers_per_minute: 0, most_common_fillers: [] },
          repetition: { repeated_words_detected: false, examples: [] }
        },
        language_quality: { grammar_score: 0, clarity_score: 0, fluency_score: 0, incorrect_or_awkward_phrases: [] },
        communication_skills: { confidence_score: 0, structure_score: 0, relevance_score: 0, engagement_score: 0 },
        coaching_feedback: { what_went_well: [], what_to_improve: ["Retry analysis"], actionable_tips: [] }
      };
    }
    
    throw error;
  }
};
