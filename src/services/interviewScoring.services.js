import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
});

export const scoreInterview = async (transcript) => {
  try {
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
- If something cannot be inferred, mark it as "null".

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
  "summary": {
    "verdict": string,
    "strengths": string[],
    "primary_issues": string[]
  },
  "speech_metrics": {
    "words_per_minute": number | 0,
    "pause_analysis": {
      "long_pauses_detected": boolean | 0,
      "average_pause_duration_seconds": number | 0
    },
    "filler_words": {
      "total_count": number,
      "fillers_per_minute": number,
      "most_common_fillers": string[]
    },
    "repetition": {
      "repeated_words_detected": boolean,
      "examples": string[]
    }
  },
  "language_quality": {
    "grammar_score": number,
    "clarity_score": number,
    "fluency_score": number,
    "incorrect_or_awkward_phrases": string[]
  },
  "communication_skills": {
    "confidence_score": number,
    "structure_score": number,
    "relevance_score": number,
    "engagement_score": number
  },
  "coaching_feedback": {
    "what_went_well": string[],
    "what_to_improve": string[],
    "actionable_tips": string[]
  }
}

IMPORTANT:
- Output JSON only.
- No markdown.
- No explanations.
`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
      }
    });

    // console.log("Gemini Raw Response: ", response.candidates[0].content.parts[0]);
    const rawText = response.candidates[0].content.parts[0].text;

    try {
      return JSON.parse(rawText);
    } catch (parseError) {
      console.error("Raw Gemini Response:", rawText);
      throw new Error("Invalid JSON returned by Gemini");
    }
  } catch (error) {
    console.error("Error scoring interview:", error);
    throw error;
  }
};
