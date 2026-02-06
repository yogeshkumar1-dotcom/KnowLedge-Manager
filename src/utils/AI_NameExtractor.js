import { GoogleGenAI } from "@google/genai";


const genAI = new GoogleGenAI({apiKey: process.env.GOOGLE_GENAI_API_KEY});

/**
 * Extract candidate/interviewee name from filename using AI
 * @param {string} filename - The filename to extract name from
 * @returns {Promise<string|null>} - Extracted name or null
 */
export const extractNameWithAI = async (filename) => {
  if (!filename) return null;

  try {
    // Remove file extension and timestamp prefix
    const cleanFilename = filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/^\d+_/, ''); // Remove timestamp prefix

    // const model = genAI.models.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Extract the candidate/interviewee name from this filename: "${cleanFilename}"

Rules:
- Return ONLY the person's name (first name and last name)
- If multiple names appear, return the candidate/interviewee name (not interviewer)
- Return in proper case (e.g., "John Doe")
- If no clear name is found, return "Unknown Candidate"
- Do not include any explanation, just the name

Examples:
"_jmit_comm_round_sanyam_grazitti_interactive" → "Sanyam"
"interview_john_doe_2024" → "John Doe"
"meeting_with_alice_smith" → "Alice Smith"

Filename: "${cleanFilename}"
Name:`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 20,
      }
    });
    const extractedName = result.candidates[0].content.parts[0].text;

    // Validate the extracted name
    if (extractedName && extractedName !== "Unknown Candidate" && extractedName.length > 0) {
      return extractedName;
    }

    return null;
  } catch (error) {
    console.error("AI name extraction failed:", error.message);
    return null;
  }
};
