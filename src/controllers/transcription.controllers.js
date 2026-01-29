import axios from "axios";
import { Transcript } from "../models/transcript.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { supabase } from "../utils/supabaseClient.js";
import { generateMeetingNotes } from "../services/meetingNote.services.js";
import { generateTasksFromNotes } from "../services/task.services.js";
import { Task } from "../models/task.models.js";
import { extractTranscript } from "../utils/extractTranscriptFromAudio.js";

const createTranscript = asyncHandler(async (req, res) => {
  //   const { transcriptId } = req.body;
  // const transcriptId = req.body;
  console.log("Request body in createTranscription - ", req.transcriptId);
  const transcriptId = req.transcriptId;
  if (!transcriptId) {
    throw new ApiError(400, "transcriptId required");
  }

  const transcript = await Transcript.findById(transcriptId);
  if (!transcript) {
    throw new ApiError(404, "Transcript record not found");
  }

  if (transcript.status === "completed") {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { transcript }, "Transcription already completed")
      );
  }

  const fileName = transcript.fileName;
  if (!fileName) {
    throw new ApiError(400, "No file associated with this transcript");
  }
  let transcriptText = "";
  transcriptText = req.transcriptText;
  const fileExtension = fileName.split(".").pop().toLowerCase();
  if (["mp3", "wav", "ogg", "m4a"].includes(fileExtension)) {
    transcriptText = await extractTranscript(fileName, transcript);
  }

  // 5. Save transcript
  console.log("Transcription completed: ", transcriptText);
  transcript.transcriptText = transcriptText;
  transcript.status = "completed";
  const notes = await generateMeetingNotes(transcriptText, req.date);
  transcript.transcriptTitle = notes.title;
  //   console.log("Generated Notes: ", notes);
  let extractedNotes = {
    summary: notes.summary,
    keyPoints: notes.keyPoints,
  };
  transcript.notes = extractedNotes;
  transcript.analytics = notes.analytics;
  transcript.notesCreated = true;
  await transcript.save();
  // Generate tasks from notes
  const tasksData = await generateTasksFromNotes(transcript, notes.actionItems);

  console.log("Final response data:", { transcript, tasksData });

  res
    .status(200)
    .json(
      new ApiResponse(200, { transcript, tasksData }, "Transcription completed")
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
