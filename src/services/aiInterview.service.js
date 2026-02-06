import { LiveSession } from '../models/LiveSession.js';
import { GoogleGenAI } from "@google/genai";
import { config } from '../config/config.js';
import { scoreInterview } from './interviewScoring.services.js';
import { Interview } from '../models/interview.models.js';
import mongoose from 'mongoose';

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

    const fullTranscript = session.history.map(h => `${h.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${h.content}`).join('\n\n');
    session.transcript = fullTranscript;
    await session.save();

    try {
        const scoreResult = await scoreInterview(fullTranscript, session.candidateName);
        
        // Create Interview record for dashboard
        const interview = new Interview({
            userId: session.userId || new mongoose.Types.ObjectId(),
            candidateName: session.candidateName,
            interviewDate: session.startTime,
            fileName: `AI_Interview_${session.candidateName}_${new Date().toISOString().split('T')[0]}.txt`,
            fileHash: `ai_${session._id}`,
            transcriptText: fullTranscript,
            overall_communication_score: scoreResult.overall_communication_score || 0,
            interviewer_name: 'Alex (AI)',
            interviewee_name: session.candidateName,
            summary: scoreResult.summary,
            speech_metrics: scoreResult.speech_metrics,
            language_quality: scoreResult.language_quality,
            communication_skills: scoreResult.communication_skills,
            coaching_feedback: scoreResult.coaching_feedback,
            status: 'scored',
            isAIInterview: true
        });
        
        await interview.save();
        
        return {
            sessionId: session._id,
            interviewId: interview._id,
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

    const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    });
    return result.text;
};
