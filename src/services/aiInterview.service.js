import { LiveSession } from '../models/LiveSession.js';
import { GoogleGenAI } from "@google/genai";
import { config } from '../config/config.js';
import { scoreInterview } from './interviewScoring.services.js';
import { Interview } from '../models/interview.models.js';

const genAI = new GoogleGenAI({ apiKey: config.GOOGLE_GENAI_API_KEY });

export const startSession = async (data) => {
    const { candidateName, role, level, experience, duration } = data;

    const session = new LiveSession({
        candidateName,
        role,
        level,
        experience,
        durationMinutes: duration,
        startTime: new Date(),
        status: 'INITIALIZING',
        history: []
    });

    // Generate opening script
    const openingScript = `Hello ${candidateName},
My name is Alex, and I will be conducting your communication assessment today.

This interview will last approximately ${duration} minutes.
I will ask you a series of questions one at a time.
Please answer naturally, as you would in a real workplace conversation.

If you are ready, let's begin.`;

    session.history.push({
        role: 'ai',
        content: openingScript,
        timestamp: new Date()
    });

    session.status = 'AI_SPEAKING';
    await session.save();

    return { sessionId: session._id, message: openingScript, status: session.status };
};

export const handleTurn = async (sessionId, candidateText) => {
    const session = await LiveSession.findById(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status === 'COMPLETED') throw new Error("Session already completed");

    // 1. Save candidate response
    session.history.push({
        role: 'user',
        content: candidateText,
        timestamp: new Date()
    });

    session.status = 'PROCESSING';
    await session.save();

    // 2. Check time
    const elapsedMinutes = (new Date() - new Date(session.startTime)) / 60000;
    if (elapsedMinutes >= session.durationMinutes) {
        return await endSession(sessionId);
    }

    // 3. Generate Next Question with LLM
    const nextQuestion = await generateNextQuestion(session);

    session.history.push({
        role: 'ai',
        content: nextQuestion,
        timestamp: new Date()
    });

    session.status = 'AI_SPEAKING';
    await session.save();

    return { sessionId: session._id, message: nextQuestion, status: session.status };
};

export const endSession = async (sessionId) => {
    const session = await LiveSession.findById(sessionId);
    if (!session) throw new Error("Session not found");

    const closingScript = `Thank you, ${session.candidateName}.
This concludes our interview.
Your responses have been recorded for communication assessment.
You may now stop the recording.
Have a great day.`;

    session.history.push({
        role: 'ai',
        content: closingScript,
        timestamp: new Date()
    });

    session.status = 'COMPLETED';

    // Consolidate Transcript
    const fullTranscript = session.history.map(h => `${h.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${h.content}`).join('\n\n');
    session.transcript = fullTranscript;
    await session.save();

    try {
        const scoreResult = await scoreInterview(fullTranscript, session.candidateName);
        return {
            sessionId: session._id,
            message: closingScript,
            status: 'COMPLETED',
            analysis: scoreResult
        };
    } catch (err) {
        console.error("Scoring failed", err);
        return { sessionId: session._id, message: closingScript, status: 'COMPLETED', error: "Scoring failed" };
    }
};

const generateNextQuestion = async (session) => {
    const historyText = session.history.map(h => `${h.role === 'ai' ? 'Alex' : 'Candidate'}: ${h.content}`).join('\n');

    const prompt = `
  You are Alex, a professional corporate interviewer conducting a communication assessment.
  Role: ${session.role}
  Level: ${session.level}
  Experience: ${session.experience || 'N/A'}
  
  History:
  ${historyText}
  
  Task: Generate the next single open-ended interview question based on the candidate's last response.
  Rules:
  - Keep it professional, calm, corporate.
  - Do NOT repeat questions.
  - Dig deeper into their previous answer if relevant (follow-up).
  - If the previous answer was short, ask for elaboration.
  - Do NOT say "Great", "Okay", "I see" - just ask the question directly.
  - Question should be about 1-2 sentences max.
  - Focus on communication skills, storytelling, and professional behavior.
  
  Next Question:
  `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
};
