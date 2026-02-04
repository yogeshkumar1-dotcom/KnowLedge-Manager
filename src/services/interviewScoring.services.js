import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
});

export const scoreInterview = async (transcript) => {
  try {
    console.log("Starting interview scoring...");
    
    // Add timeout wrapper - increased to 3 minutes
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('LLM request timeout after 300 seconds')), 300000);
    });
    
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
- SUMMARY VERDICT: Write exactly 5-10 sentences providing comprehensive analysis of the candidate's performance, communication style, strengths, areas for improvement, and overall assessment.
- Do NOT give 9–10 unless performance is clearly exceptional
- Most overall scores SHOULD fall between 5–9
- If transcript is short, unclear, or casual → penalize
- Scores must be CONSISTENT across candidates

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
    "verdict": "A comprehensive 5-10 sentence summary analyzing the candidate's overall interview performance, communication effectiveness, and key observations",
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

    const modelResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 4096,
      }
    });

    const response = await Promise.race([modelResponse, timeoutPromise]);
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
    console.error("Error in scoreInterview:", error.message);
    throw error;
  }
};
