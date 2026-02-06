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
    temperature: 0, // Deterministic output
    max_tokens: 4096,
    top_p: 1, // Use full probability distribution
    seed: 12345, // Consistent seed for reproducibility
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
      temperature: 0, // Deterministic output
      maxOutputTokens: 4096,
      topP: 1, // Use full probability distribution
      topK: 1, // Most deterministic
    }
  });
  
  const rawText = modelResponse.candidates[0].content.parts[0].text;
  return parseResponse(rawText);
};

// Shared prompt generation
const getAnalysisPrompt = (transcript, candidateName) => {
  const candidateInfo = candidateName ? `\nCandidate Name (from filename): ${candidateName}` : '';
  
  return `
You are an expert interview communication coach. Analyze this transcript with OBJECTIVE, CONSISTENT scoring.

CRITICAL RULES FOR CONSISTENCY:
1. ALWAYS use the same scoring criteria for the same quality of response
2. Temperature is 0 - your scores MUST be deterministic
3. Use the rubric below EXACTLY - no subjective interpretation
4. Same transcript = EXACT same scores every time
5. Base scores ONLY on observable evidence in transcript
6. Do NOT vary scores based on "feeling" - use the rubric

SCORING RUBRIC (0-10 scale):

FLUENCY (25% weight):
- 9-10: Smooth, natural flow with no hesitations
- 7-8: Mostly fluent with minor pauses
- 5-6: Noticeable hesitations but understandable
- 3-4: Frequent pauses, choppy delivery
- 0-2: Very difficult to follow, constant interruptions

CLARITY (20% weight):
- 9-10: Crystal clear, well-articulated, easy to understand
- 7-8: Clear with minor unclear moments
- 5-6: Generally understandable but some confusion
- 3-4: Often unclear or ambiguous
- 0-2: Very difficult to understand

CONFIDENCE (20% weight):
- 9-10: Assertive, decisive, no self-doubt
- 7-8: Confident with minor uncertainty
- 5-6: Moderate confidence, some hesitation
- 3-4: Uncertain, frequent self-correction
- 0-2: Very uncertain, lacks conviction

STRUCTURE (15% weight):
- 9-10: Logical, organized, follows clear framework
- 7-8: Mostly structured with minor tangents
- 5-6: Some structure but disorganized at times
- 3-4: Poorly organized, hard to follow
- 0-2: No clear structure, chaotic

RELEVANCE (10% weight):
- 9-10: All points directly relevant and on-topic
- 7-8: Mostly relevant with minor tangents
- 5-6: Some relevant points, some off-topic
- 3-4: Often off-topic or irrelevant
- 0-2: Mostly irrelevant content

ENGAGEMENT (10% weight):
- 9-10: Highly engaging, enthusiastic, compelling
- 7-8: Engaging with good energy
- 5-6: Moderately engaging
- 3-4: Low engagement, monotone
- 0-2: Disengaged, no energy

FINAL SCORE CALCULATION:
= (Fluency × 0.25) + (Clarity × 0.20) + (Confidence × 0.20) + (Structure × 0.15) + (Relevance × 0.10) + (Engagement × 0.10)

OBJECTIVE METRICS:
- Count filler words: um, uh, like, you know, basically, actually, etc.
- Estimate words per minute (typical: 120-150 WPM)
- Identify repeated phrases or words
- Note grammatical errors

CONSISTENCY CHECK:
- If you see the SAME transcript again, you MUST give the SAME scores
- Use the rubric mechanically - don't interpret creatively
- Round to 1 decimal place for consistency${candidateInfo}

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
- Output JSON only
- No markdown
- No explanations
- Use the rubric EXACTLY as specified
- Be DETERMINISTIC - same input = same output
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
