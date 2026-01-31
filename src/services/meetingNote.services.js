import { GoogleGenAI } from "@google/genai";


const googleGenAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

async function generateMeetingNotes(transcript, meetingDate) {
  const prompt = `
You are an intelligent meeting notes generator AI. 
You are given a meeting transcript (which may be from a past meeting) and the actual meeting date.

Your goal:
Extract meaningful structured notes from the transcript while maintaining accuracy and context.

Meeting Date: ${meetingDate}

Transcript:
---
${transcript}
---

Please carefully analyze the transcript and return structured JSON with the following fields:

{
  "title": "A concise title of the meeting inferred from the transcript (max 10 words)",
  "summary": "A 3–5 sentence overview summarizing what the meeting was about",
  "keyPoints": ["List of key discussion points as short sentences"],
  "analytics": {
    "speechMechanics": {
      "clarityPronunciation": "Score 1-10",
      "speechRate": "Estimated Words Per Minute (Number)",
      "volumeConsistency": "Score 1-10",
      "voiceModulation": "Score 1-10",
      "pausesAndFillers": "Score 1-10 (10 = minimal filters)"
    },
    "languageQuality": {
      "vocabularyRichness": "Score 1-10",
      "grammarAccuracy": "Score 1-10",
      "coherence": "Score 1-10",
      "relevance": "Score 1-10",
      "messageClarity": "Score 1-10"
    },
    "emotionalIntelligence": {
      "emotionalTone": "String (e.g., Professional, Excited, Serious, Warm, Neutral)",
      "confidenceLevel": "Score 1-10",
      "engagement": "Score 1-10",
      "empathyWarmth": "Score 1-10"
    },
    "fluency": {
      "stutteringRepetition": "Score 1-10 (10 = no stuttering)",
      "sentenceCompletion": "Score 1-10",
      "flow": "Score 1-10"
    },
    "scores": {
      "fluencyScore": "Calculated average of fluency metrics (1-10)",
      "confidenceScore": "Score based on overall confidence 1-10",
      "clarityScore": "Score based on overall clarity 1-10",
      "overallScore": "Overall communication effectiveness 1-10"
    },
    "insights": {
      "weakAreas": ["List of 3 specific areas for improvement"],
      "strengths": ["List of 3 specific strong points"]
    }
  },
  "actionItems": [
    {
      "owner": "Name of the person responsible, if mentioned, else 'Unassigned'",
      "taskTitle": "Short descriptive title of the task",
      "task": [
        {
          "taskName": "Detailed description",
          "Priority": "High/Medium/Low",
          "DueDate": "dd-mm-yy",
          "type": "action/discussion",
          "status": "pending"
        }
      ]
    }
  ]
}

Specific Metrics to Evaluate (Score 1-10 for each except where noted):
1. Clarity / Pronunciation – how clearly words are spoken
2. Speech Rate – words per minute (too fast / too slow)
3. Volume Consistency – sudden drops or spikes
4. Voice Modulation – pitch variation, monotone vs expressive
5. Pauses & Fillers – frequency of “uh”, “um”, long silences (Lower number means more fillers)
6. Vocabulary Richness – repetitive vs diverse words
7. Grammar Accuracy – sentence structure, tense usage
8. Coherence – logical flow of ideas
9. Relevance – staying on topic
10. Clarity of Message – easy to understand or confusing
11. Emotional Tone – primary emotion detected (positive, neutral, negative)
12. Confidence Level – hesitation vs assertiveness
13. Engagement – energetic vs dull delivery
14. Empathy / Warmth – friendliness in tone
15. Stuttering / Repetition - (Lower number means more stuttering)
16. Sentence Completion - how often sentences are finished
17. Flow - smooth flow without long breaks

Aggregate Scores:
- Fluency Score (1-10)
- Confidence Score (1-10)
- Clarity Score (1-10)
- Overall Communication Score (1-10)

Rules:
- The analytics scores must be numbers (except emotionalTone).
- Return only valid JSON.
- Be critical and accurate in scoring based on the transcript provided.
- If the transcript is very short or unclear, provide conservative scores.

`;

  const response = await googleGenAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
  });

  let result = response.candidates[0].content.parts[0].text;
  console.log("Generated Notes: ", result);

  // More robust JSON extraction
  if (result.includes("```json")) {
    result = result.split("```json")[1].split("```")[0].trim();
  } else if (result.includes("```")) {
    result = result.split("```")[1].split("```")[0].trim();
  }

  console.log("Extracted JSON Notes: ", result);

  try {
    const finalResult = JSON.parse(result);
    return finalResult;
  } catch (error) {
    console.error("Failed to parse Gemini response as JSON:", error);
    // Fallback if JSON is slightly malformed or not wrapped in code blocks
    try {
      // Try to find the first '{' and last '}'
      const start = result.indexOf('{');
      const end = result.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const jsonStr = result.substring(start, end + 1);
        return JSON.parse(jsonStr);
      }
    } catch (innerError) {
      console.error("Fallback JSON parsing failed too:", innerError);
    }
    throw new Error("Failed to process meeting notes from AI");
  }
}

export { generateMeetingNotes };


