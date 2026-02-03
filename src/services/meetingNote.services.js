// import { GoogleGenAI } from "@google/genai";


// const googleGenAI = new GoogleGenAI({
//   apiKey: process.env.GOOGLE_GENAI_API_KEY,
// });

// async function generateMeetingNotes(transcript, meetingDate) {
//   const prompt = `
// You are an intelligent meeting notes generator AI. 
// You are given a meeting transcript (which may be from a past meeting) and the actual meeting date.

// Your goal:
// Extract meaningful structured notes from the transcript while maintaining accuracy and context.

// Meeting Date: ${meetingDate}

// Transcript:
// ---
// ${transcript}
// ---

// Please carefully analyze the transcript and return structured JSON with the following fields:

// {
//   "title": "A concise title of the meeting inferred from the transcript (max 10 words)",
//   "summary": "A 3–5 sentence overview summarizing what the meeting was about",
//   "keyPoints": ["List of key discussion points as short sentences"],
//   "analytics": {
//     "speechMechanics": {
//       "clarityPronunciation": "Score 1-10",
//       "speechRate": "Estimated Words Per Minute (Number)",
//       "volumeConsistency": "Score 1-10",
//       "voiceModulation": "Score 1-10",
//       "pausesAndFillers": "Score 1-10 (10 = minimal filters)"
//     },
//     "languageQuality": {
//       "vocabularyRichness": "Score 1-10",
//       "grammarAccuracy": "Score 1-10",
//       "coherence": "Score 1-10",
//       "relevance": "Score 1-10",
//       "messageClarity": "Score 1-10"
//     },
//     "emotionalIntelligence": {
//       "emotionalTone": "String (e.g., Professional, Excited, Serious, Warm, Neutral)",
//       "confidenceLevel": "Score 1-10",
//       "engagement": "Score 1-10",
//       "empathyWarmth": "Score 1-10"
//     },
//     "fluency": {
//       "stutteringRepetition": "Score 1-10 (10 = no stuttering)",
//       "sentenceCompletion": "Score 1-10",
//       "flow": "Score 1-10"
//     },
//     "scores": {
//       "fluencyScore": "Calculated average of fluency metrics (1-10)",
//       "confidenceScore": "Score based on overall confidence 1-10",
//       "clarityScore": "Score based on overall clarity 1-10",
//       "overallScore": "Overall communication effectiveness 1-10"
//     },
//     "insights": {
//       "weakAreas": ["List of 3 specific areas for improvement"],
//       "strengths": ["List of 3 specific strong points"]
//     }
//   },
//   "actionItems": [
//     {
//       "owner": "Name of the person responsible, if mentioned, else 'Unassigned'",
//       "taskTitle": "Short descriptive title of the task",
//       "task": [
//         {
//           "taskName": "Detailed description",
//           "Priority": "High/Medium/Low",
//           "DueDate": "dd-mm-yy",
//           "type": "action/discussion",
//           "status": "pending"
//         }
//       ]
//     }
//   ]
// }

// Specific Metrics to Evaluate (Score 1-10 for each except where noted):
// 1. Clarity / Pronunciation – how clearly words are spoken
// 2. Speech Rate – words per minute (too fast / too slow)
// 3. Volume Consistency – sudden drops or spikes
// 4. Voice Modulation – pitch variation, monotone vs expressive
// 5. Pauses & Fillers – frequency of “uh”, “um”, long silences (Lower number means more fillers)
// 6. Vocabulary Richness – repetitive vs diverse words
// 7. Grammar Accuracy – sentence structure, tense usage
// 8. Coherence – logical flow of ideas
// 9. Relevance – staying on topic
// 10. Clarity of Message – easy to understand or confusing
// 11. Emotional Tone – primary emotion detected (positive, neutral, negative)
// 12. Confidence Level – hesitation vs assertiveness
// 13. Engagement – energetic vs dull delivery
// 14. Empathy / Warmth – friendliness in tone
// 15. Stuttering / Repetition - (Lower number means more stuttering)
// 16. Sentence Completion - how often sentences are finished
// 17. Flow - smooth flow without long breaks

// Aggregate Scores:
// - Fluency Score (1-10)
// - Confidence Score (1-10)
// - Clarity Score (1-10)
// - Overall Communication Score (1-10)

// Rules:
// - The analytics scores must be numbers (except emotionalTone).
// - Return only valid JSON.
// - Be critical and accurate in scoring based on the transcript provided.
// - If the transcript is very short or unclear, provide conservative scores.

// `;

//   const response = await googleGenAI.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: [
//       {
//         role: "user",
//         parts: [
//           {
//             text: prompt,
//           },
//         ],
//       },
//     ],
//   });

//   let result = response.candidates[0].content.parts[0].text;
//   console.log("Generated Notes: ", result);

//   // More robust JSON extraction
//   if (result.includes("```json")) {
//     result = result.split("```json")[1].split("```")[0].trim();
//   } else if (result.includes("```")) {
//     result = result.split("```")[1].split("```")[0].trim();
//   }

//   console.log("Extracted JSON Notes: ", result);

//   try {
//     const finalResult = JSON.parse(result);
//     return finalResult;
//   } catch (error) {
//     console.error("Failed to parse Gemini response as JSON:", error);
//     // Fallback if JSON is slightly malformed or not wrapped in code blocks
//     try {
//       // Try to find the first '{' and last '}'
//       const start = result.indexOf('{');
//       const end = result.lastIndexOf('}');
//       if (start !== -1 && end !== -1) {
//         const jsonStr = result.substring(start, end + 1);
//         return JSON.parse(jsonStr);
//       }
//     } catch (innerError) {
//       console.error("Fallback JSON parsing failed too:", innerError);
//     }
//     throw new Error("Failed to process meeting notes from AI");
//   }
// }

// export { generateMeetingNotes };


import { GoogleGenAI } from "@google/genai";

const googleGenAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

async function generateMeetingNotes(transcript, meetingDate) {
  const prompt = `
You are an AI communication evaluator used for REAL interview assessments.
You must be STRICT, CONSISTENT, and UNBIASED.

You are given a transcript and must evaluate it using FIXED RUBRICS.
DO NOT be generous. Average performance must score around 5–9.

Meeting Date: ${meetingDate}

Transcript:
---
${transcript}
---

========================
SCORING RUBRICS (MANDATORY)
========================

For ALL 1–10 scores, follow these anchors strictly:

1–2  : Very poor, major issues, unacceptable in interviews  
3–4  : Weak, noticeable problems, below interview standards  
5–6  : Average, acceptable but needs improvement  
7–8  : Strong, interview-ready, minor issues  
9–10 : Exceptional, rare, near-perfect (use VERY sparingly)

Rules:
- Do NOT give 9–10 unless performance is clearly exceptional
- Most overall scores SHOULD fall between 5–9
- If transcript is short, unclear, or casual → penalize
- Scores must be CONSISTENT across candidates

========================
EVALUATION TASK
========================

Return ONLY valid JSON in the structure below.
All numeric fields MUST be numbers (not strings).

{
  "title": "Short inferred meeting title (max 10 words)",
  "summary": "10-15 sentence factual summary",
  "keyPoints": ["Concise key discussion points"],

  "analytics": {
    "speechMechanics": {
      "clarityPronunciation": 1-10,
      "speechRate": "Estimated WPM (number)",
      "volumeConsistency": 1-10,
      "voiceModulation": 1-10,
      "pausesAndFillers": 1-10
    },

    "languageQuality": {
      "vocabularyRichness": 1-10,
      "grammarAccuracy": 1-10,
      "coherence": 1-10,
      "relevance": 1-10,
      "messageClarity": 1-10
    },

    "emotionalIntelligence": {
      "emotionalTone": "Professional / Neutral / Nervous / Confident / Flat",
      "confidenceLevel": 1-10,
      "engagement": 1-10,
      "empathyWarmth": 1-10
    },

    "fluency": {
      "stutteringRepetition": 1-10,
      "sentenceCompletion": 1-10,
      "flow": 1-10
    },

    "scores": {
      "fluencyScore": "Average of fluency metrics",
      "confidenceScore": "Derived from confidence + engagement",
      "clarityScore": "Derived from clarity + coherence",
      "overallScore": "STRICT overall interview score (1–10)"
    },

    "insights": {
      "weakAreas": ["Exactly 3 specific weaknesses"],
      "strengths": ["Exactly 3 specific strengths"]
    }
  },

  "actionItems": [
    {
      "owner": "Name or Unassigned",
      "taskTitle": "Short task title",
      "task": [
        {
          "taskName": "Detailed description",
          "Priority": "High / Medium / Low",
          "DueDate": "dd-mm-yy",
          "type": "action / discussion",
          "status": "pending"
        }
      ]
    }
  ]
}

FINAL CHECK BEFORE RESPONDING:
- JSON only
- No markdown
- No explanations
- Be strict
`;

  const response = await googleGenAI.models.generateContent({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.2,   // 🔒 reduces randomness
      topP: 0.8,
    },
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  let result = response.candidates[0].content.parts[0].text;

  // JSON cleanup
  if (result.includes("```")) {
    result = result.split("```")[1].split("```")[0].trim();
  }

  try {
    return JSON.parse(result);
  } catch (error) {
    console.error("JSON parsing failed:", error);
    const start = result.indexOf("{");
    const end = result.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      return JSON.parse(result.substring(start, end + 1));
    }
    throw new Error("AI response could not be parsed");
  }
}

export { generateMeetingNotes };
