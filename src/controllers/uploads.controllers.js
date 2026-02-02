import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { supabase } from "../utils/supabaseClient.js";
import { Interview } from "../models/interview.models.js";
import { extractAudioFromVideo } from "../utils/videoProcessor.js";
import { processInterviewInBackground } from "../utils/backgroundProcessor.js";
import { extractCandidateFromFilename } from "../utils/nameExtractor.js";
import crypto from "crypto";
import {
  uploadAudioOfMeeting,
  uploadTranscriptOfMeeting,
} from "../services/uploadAudioOfMeeting.services.js";

const uploadFiles = asyncHandler(async (req, res, next) => {
  // Handle single file upload
  if (req.file) {
    return handleSingleFile(req, res, next);
  }
  
  // Handle multiple files upload
  if (req.files && req.files.length > 0) {
    return handleMultipleFiles(req, res);
  }
  
  throw new ApiError(400, "No files uploaded");
});

// Handle single file (existing logic)
const handleSingleFile = asyncHandler(async (req, res, next) => {
  const file = req.file;
  const fileHash = crypto.createHash('md5').update(file.buffer).digest('hex');
  
  const existingInterview = await Interview.findOne({ fileHash, status: 'scored' }).sort({ createdAt: -1 });
  if (existingInterview) {
    return res.status(200).json(new ApiResponse(200, { interview: existingInterview }, "File already processed"));
  }
  
  const [fileType] = file.mimetype.split("/");
  let fileUrl, fileName = "", transcriptText = "", processedBuffer = file.buffer;

  if (fileType === "video") {
    processedBuffer = await extractAudioFromVideo(file.buffer, file.originalname);
    const tempFileName = file.originalname.replace(/\.[^/.]+$/, ".wav");
    const mockAudioFile = { buffer: processedBuffer, originalname: tempFileName, mimetype: 'audio/wav' };
    const { fileUrl: uploadedUrl, fileName: uploadedName } = await uploadAudioOfMeeting(mockAudioFile);
    fileUrl = uploadedUrl; fileName = uploadedName;
  } else if (fileType === "audio") {
    const { fileUrl: uploadedUrl, fileName: uploadedName } = await uploadAudioOfMeeting(file);
    fileUrl = uploadedUrl; fileName = uploadedName;
  } else if (fileType === "application") {
    const { fileName: uploadedName, transcriptText: transcriptedText } = await uploadTranscriptOfMeeting(file);
    fileName = uploadedName; transcriptText = transcriptedText;
  } else {
    throw new ApiError(400, "Unsupported file type");
  }

  const interview = await Interview.create({
    userId: req.body.userId, 
    candidateName: req.body.candidateName || extractCandidateFromFilename(file.originalname) || "Unknown Candidate",
    position: req.body.position || "Unknown Position", 
    interviewDate: req.body.meetingDate || new Date(),
    fileName, transcriptText, fileHash, status: transcriptText ? "processing" : "pending"
  });

  req.interviewId = interview._id; req.transcriptText = transcriptText; req.fileUrl = fileUrl;
  req.fileType = fileType === "video" ? "audio" : fileType; req.date = req.body.meetingDate;
  next();
});

// Handle multiple files independently
const handleMultipleFiles = asyncHandler(async (req, res) => {
  const files = req.files;
  const processingPromises = files.map(file => processFileIndependently(file, req.body));
  const processedResults = await Promise.allSettled(processingPromises);
  
  const results = processedResults.map((result, index) => ({
    file: files[index].originalname,
    status: result.status === 'fulfilled' ? 'success' : 'error',
    ...(result.status === 'fulfilled' ? { interview: result.value } : { error: result.reason.message })
  }));
  
  res.status(200).json(new ApiResponse(200, { results, totalFiles: files.length }, "Multiple files processed"));
});

// Process individual file independently
const processFileIndependently = async (file, bodyData) => {
  const fileHash = crypto.createHash('md5').update(file.buffer).digest('hex');
  const existingInterview = await Interview.findOne({ fileHash, status: 'scored' }).sort({ createdAt: -1 });
  if (existingInterview) return existingInterview;
  
  const [fileType] = file.mimetype.split("/");
  let fileUrl, fileName = "", transcriptText = "";
  
  if (fileType === "video") {
    const processedBuffer = await extractAudioFromVideo(file.buffer, file.originalname);
    const tempFileName = file.originalname.replace(/\.[^/.]+$/, ".wav");
    const mockAudioFile = { buffer: processedBuffer, originalname: tempFileName, mimetype: 'audio/wav' };
    const { fileUrl: uploadedUrl, fileName: uploadedName } = await uploadAudioOfMeeting(mockAudioFile);
    fileUrl = uploadedUrl; fileName = uploadedName;
  } else if (fileType === "audio") {
    const { fileUrl: uploadedUrl, fileName: uploadedName } = await uploadAudioOfMeeting(file);
    fileUrl = uploadedUrl; fileName = uploadedName;
  } else if (fileType === "application") {
    const { fileName: uploadedName, transcriptText: transcriptedText } = await uploadTranscriptOfMeeting(file);
    fileName = uploadedName; transcriptText = transcriptedText;
  } else {
    throw new Error("Unsupported file type");
  }
  
  const interview = await Interview.create({
    userId: bodyData.userId, 
    candidateName: bodyData.candidateName || extractCandidateFromFilename(file.originalname) || "Unknown Candidate",
    position: bodyData.position || "Unknown Position", 
    interviewDate: bodyData.meetingDate || new Date(),
    fileName, transcriptText, fileHash, status: "pending"
  });
  
  // Trigger background processing
  processInterviewInBackground(interview._id);
  return interview;
};

export { uploadFiles };