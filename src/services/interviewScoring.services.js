import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

export const scoreInterview = async (transcript, candidateName = null, customApiKey = null, selectedModel = null) => {
  try {
    console.log("Starting interview scoring...");
    console.log("Selected model:", selectedModel);
    
    const model = selectedModel || "gemini-2.5-flash";
    
    // Determine if it's a GPT or Gemini model
    const isGPTModel = model.includes('gpt');
    
    if (isGPTModel) {
      return await scoreWithOpenAI(transcript, candidateName, customApiKey, model);
    } else {
      return await scoreWithGemini(transcript, candidateName, customApiKey, model);
    }
  } catch (error) {
    console.error("Error in scoreInterview:", error.message);
    throw error;
  }
};

// OpenAI scoring function
const scoreWithOpenAI = async (transcript, candidateName, customApiKey, model) => {
  const apiKey = customApiKey || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }
  
  const openai = new OpenAI({ apiKey });
  
  const prompt = getAnalysisPrompt(transcript, candidateName);
  
  const response = await openai.chat.completions.create({
    model: model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    max_tokens: 4096,
  });
  
  const rawText = response.choices[0].message.content;
  return parseResponse(rawText);
};

// Gemini scoring function
const scoreWithGemini = async (transcript, candidateName, customApiKey, model) => {
  const apiKey = customApiKey || process.env.GOOGLE_GENAI_API_KEY;
  
  const genAI = new GoogleGenAI({ apiKey });
  
  const prompt = getAnalysisPrompt(transcript, candidateName);
  
  const modelResponse = await genAI.models.generateContent({
    model: model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 4096,
    }
  });
  
  const rawText = modelResponse.candidates[0].content.parts[0].text;
  return parseResponse(rawText);
};

// Shared prompt generation
const getAnalysisPrompt = (transcript, candidateName) => {
  const candidateInfo = candidateName ? `\nCandidate Name (from filename): ${candidateName}` : '';
  
  return `
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
- SUMMARY VERDICT: Write exactly 50-100 words providing comprehensive analysis of the candidate's performance, communication style, strengths, areas for improvement, and overall assessment.
- Do NOT give 9–10 unless performance is clearly exceptional
- Most overall scores SHOULD fall between 5–9
- If transcript is short, unclear, or casual → penalize
- Scores must be CONSISTENT across candidates${candidateInfo}

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
    "verdict": "A comprehensive 50-100 word summary analyzing the candidate's overall interview performance, communication effectiveness, and key observations",
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
};

// Shared response parsing
const parseResponse = (rawText) => {
  try {
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
    throw new Error("Invalid JSON returned by LLM");
  }
};
