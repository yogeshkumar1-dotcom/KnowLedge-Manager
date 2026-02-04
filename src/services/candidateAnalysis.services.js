import { GoogleGenAI } from "@google/genai";

const googleGenAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

async function analyzeCandidateAnswers(transcript, meetingDate) {
  const prompt = `
You are an expert HR interviewer and candidate evaluation AI.
You are given a candidate interview transcript and the interview date.

Your goal:
Analyze the candidate's answers for correctness, relevance, and quality in the context of a job interview.

Interview Date: ${meetingDate}

Transcript:
---
${transcript}
---

Please carefully analyze the transcript and return structured JSON with candidate answer analysis:

{
  "answerAnalysis": {
    "overallCorrectnessScore": "Score 1-10 for how correct/accurate the answers are",
    "answerRelevance": "Score 1-10 for how relevant answers are to the questions asked",
    "answerCompleteness": "Score 1-10 for how complete and comprehensive the answers are",
    "technicalAccuracy": "Score 1-10 for technical correctness (if applicable)",
    "problemSolving": "Score 1-10 for demonstrated problem-solving skills",
    "communicationClarity": "Score 1-10 for clear communication of ideas",
    "answerQuality": "Score 1-10 for overall answer quality"
  },
  "detailedFeedback": {
    "strongAnswers": ["List 2-3 strong answers with brief explanations"],
    "weakAnswers": ["List 2-3 weak answers with brief explanations"],
    "improvementAreas": ["List 2-3 areas for improvement"],
    "keyInsights": ["List 2-3 key insights about the candidate's performance"]
  }
}

Focus on evaluating the content and correctness of answers, not just communication delivery.
If the transcript doesn't appear to be an interview, provide general analysis.
Return only valid JSON.`;

  try {
    const model = googleGenAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean and parse JSON
    const cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

    try {
      return JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      // Fallback: try to extract JSON from the response
      const start = cleanedText.indexOf('{');
      const end = cleanedText.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const jsonStr = cleanedText.substring(start, end + 1);
        return JSON.parse(jsonStr);
      }
    }
    throw new Error("Failed to process candidate answer analysis from AI");
  } catch (error) {
    console.error("Error in analyzeCandidateAnswers:", error);
    // Return default values if AI fails
    return {
      answerAnalysis: {
        overallCorrectnessScore: 5,
        answerRelevance: 5,
        answerCompleteness: 5,
        technicalAccuracy: 5,
        problemSolving: 5,
        communicationClarity: 5,
        answerQuality: 5
      },
      detailedFeedback: {
        strongAnswers: ["Analysis temporarily unavailable"],
        weakAnswers: ["Analysis temporarily unavailable"],
        improvementAreas: ["Analysis temporarily unavailable"],
        keyInsights: ["Analysis temporarily unavailable"]
      }
    };
  }
}

export { analyzeCandidateAnswers };