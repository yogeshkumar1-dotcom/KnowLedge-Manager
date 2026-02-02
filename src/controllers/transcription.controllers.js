import axios from "axios";
import { Transcript } from "../models/transcript.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { supabase } from "../utils/supabaseClient.js";
import { generateMeetingNotes } from "../services/meetingNote.services.js";
import { generateTasksFromNotes } from "../services/task.services.js";
import { analyzeCandidateAnswers } from "../services/candidateAnalysis.services.js";
import { Task } from "../models/task.models.js";
import { extractTranscript } from "../utils/extractTranscriptFromAudio.js";

const createTranscript = asyncHandler(async (req, res) => {
  console.log("Request body in createTranscription - ", req.transcriptIds);
  const transcriptIds = req.transcriptIds;
  if (!transcriptIds || transcriptIds.length === 0) {
    throw new ApiError(400, "transcriptIds required");
  }

  const processedFiles = req.processedFiles || [];
  const results = [];

  for (let i = 0; i < transcriptIds.length; i++) {
    const transcriptId = transcriptIds[i];
    const fileData = processedFiles[i] || {};

    const transcript = await Transcript.findById(transcriptId);
    if (!transcript) {
      console.error(`Transcript record not found for id: ${transcriptId}`);
      continue;
    }

    if (transcript.status === "completed") {
      results.push({ transcript });
      continue;
    }

    const fileName = transcript.fileName;
    if (!fileName) {
      console.error(`No file associated with transcript: ${transcriptId}`);
      continue;
    }

    // Check if the same file has already been processed
    const existingTranscript = await Transcript.findOne({
      fileName: fileName,
      status: "completed",
      notesCreated: true
    });

    if (existingTranscript) {
      console.log("Same file already processed, copying existing analysis...");
      // Copy the existing analysis to avoid re-processing
      transcript.transcriptText = existingTranscript.transcriptText;
      transcript.transcriptTitle = existingTranscript.transcriptTitle;
      transcript.notes = existingTranscript.notes;
      transcript.analytics = existingTranscript.analytics;
      transcript.notesCreated = true;
      transcript.status = "completed";
      await transcript.save();

      // Also copy tasks if they exist
      const existingTasks = await Task.find({ transcriptId: existingTranscript._id });
      const tasksData = existingTasks.length > 0 ? existingTasks.map(task => ({
        ...task.toObject(),
        _id: undefined,
        transcriptId: transcript._id,
        createdAt: new Date(),
        updatedAt: new Date()
      })) : [];

      if (tasksData.length > 0) {
        await Task.insertMany(tasksData);
      }

      console.log("Analysis copied from existing file processing");
      results.push({ transcript, tasksData });
      continue;
    }

    let transcriptText = fileData.transcriptText || "";
    const fileExtension = fileName.split(".").pop().toLowerCase();
    if (["mp3", "wav", "ogg", "m4a", "mp4", "mov", "avi"].includes(fileExtension) && !transcriptText) {
      transcriptText = await extractTranscript(fileName, transcript);
    }

    // 5. Save transcript
    console.log("Transcription completed: ", transcriptText);
    transcript.transcriptText = transcriptText;
    transcript.status = "completed";
    const notes = await generateMeetingNotes(transcriptText, fileData.date);
    const candidateAnalysis = await analyzeCandidateAnswers(transcriptText, fileData.date);
    transcript.transcriptTitle = notes.title;
    //   console.log("Generated Notes: ", notes);
    let extractedNotes = {
      summary: notes.summary,
      keyPoints: notes.keyPoints,
    };
    transcript.notes = extractedNotes;
    // Flatten the response for Mongoose model
    const analyticsData = notes.analytics || {};
    const candidateData = candidateAnalysis.answerAnalysis || {};
    const feedbackData = candidateAnalysis.detailedFeedback || {};
    const speech = analyticsData.speechMechanics || {};
    const lang = analyticsData.languageQuality || {};
    const emotion = analyticsData.emotionalIntelligence || {};
    const flu = analyticsData.fluency || {};
    const scores = analyticsData.scores || {};
    const insights = analyticsData.insights || {};

    transcript.analytics = {
      // Speech
      clarityPronunciation: speech.clarityPronunciation || 0,
      speechRate: speech.speechRate || 0,
      volumeConsistency: speech.volumeConsistency || 0,
      voiceModulation: speech.voiceModulation || 0,
      pausesAndFillers: speech.pausesAndFillers || 0,

      // Language
      vocabularyRichness: lang.vocabularyRichness || 0,
      grammarAccuracy: lang.grammarAccuracy || 0,
      coherence: lang.coherence || 0,
      relevance: lang.relevance || 0,
      messageClarity: lang.messageClarity || 0,

      // Emotional
      emotionalTone: emotion.emotionalTone || 'Neutral',
      confidenceLevel: emotion.confidenceLevel || 0,
      engagement: emotion.engagement || 0,
      empathyWarmth: emotion.empathyWarmth || 0,

      // Fluency
      stutteringRepetition: flu.stutteringRepetition || 0,
      sentenceCompletion: flu.sentenceCompletion || 0,
      flow: flu.flow || 0,

      // Scores
      fluencyScore: scores.fluencyScore || 0,
      confidenceScore: scores.confidenceScore || 0,
      clarityScore: scores.clarityScore || 0,
      overallScore: scores.overallScore || 0,

      // Insights
      weakAreas: insights.weakAreas || [],
      strengths: insights.strengths || [],

      // Candidate Answer Analysis
      overallCorrectnessScore: candidateData.overallCorrectnessScore || 0,
      answerRelevance: candidateData.answerRelevance || 0,
      answerCompleteness: candidateData.answerCompleteness || 0,
      technicalAccuracy: candidateData.technicalAccuracy || 0,
      problemSolving: candidateData.problemSolving || 0,
      answerCommunicationClarity: candidateData.communicationClarity || 0,
      answerQuality: candidateData.answerQuality || 0,
      strongAnswers: feedbackData.strongAnswers || [],
      weakAnswers: feedbackData.weakAnswers || [],
      improvementAreas: feedbackData.improvementAreas || [],
      answerInsights: feedbackData.keyInsights || []
    };
    transcript.notesCreated = true;
    await transcript.save();
    // Generate tasks from notes
    const tasksData = await generateTasksFromNotes(transcript, notes.actionItems);

    console.log("Processed transcript:", transcript._id);
    results.push({ transcript, tasksData });
  }

  console.log("Final response data:", results);

  res
    .status(200)
    .json(
      new ApiResponse(200, results, "Transcriptions completed")
    );
});

const getTranscript = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Transcript id required");
  }
  const transcript = await Transcript.findById(id).populate(
    "userId",
    "name email"
  );

  if (!transcript) {
    throw new ApiError(404, "Transcript not found");
  }
  res.status(200).json(
    new ApiResponse(
      200,
      {
        id: transcript._id,
        user: transcript.userId,
        fileName: transcript.fileName,
        status: transcript.status,
        createdAt: transcript.createdAt,
        updatedAt: transcript.updatedAt,
        transcript: transcript.status === "completed" ? transcript.transcriptText : null,
        notes: transcript.status === "completed" ? transcript.notes : null,
        analytics: transcript.status === "completed" ? transcript.analytics : null,
      },
      "Transcript fetched successfully"
    )
  );
});

const getRecentTranscripts = asyncHandler(async (req, res) => {
  let { limit, sort, page } = req.query;

  // Convert query params to numbers or set defaults
  const pageNum = Number(page) > 0 ? Number(page) : 1;
  const limitNum = Number(limit) > 0 ? Number(limit) : 5;
  const sortOrder = sort === "asc" ? 1 : -1; // default: newest first

  // Calculate how many documents to skip
  const skip = (pageNum - 1) * limitNum;

  // Fetch data
  const transcripts = await Transcript.find()
    .sort({ createdAt: sortOrder })
    .skip(skip)
    .limit(limitNum);

  // Count total documents for pagination info
  const total = await Transcript.countDocuments();

  const totalPages = Math.ceil(total / limitNum);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        transcripts,
        pagination: {
          total,
          totalPages,
          currentPage: pageNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
      "Recent transcripts fetched successfully."
    )
  );
});

export { createTranscript, getTranscript, getRecentTranscripts };
