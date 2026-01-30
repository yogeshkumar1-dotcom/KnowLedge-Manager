import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { supabase } from "../utils/supabaseClient.js";
import { Interview } from "../models/interview.models.js";
import { extractAudioFromVideo } from "../utils/videoProcessor.js";
import {
  uploadAudioOfMeeting,
  uploadTranscriptOfMeeting,
} from "../services/uploadAudioOfMeeting.services.js";

const uploadFiles = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const [fileType] = req.file.mimetype.split("/");

  let fileUrl,
    fileName = "",
    transcriptText = "",
    processedBuffer = req.file.buffer;

  // Handle video files - extract audio first
  if (fileType === "video") {
    console.log("Processing video file...");
    try {
      processedBuffer = await extractAudioFromVideo(req.file.buffer, req.file.originalname);
      const tempFileName = req.file.originalname.replace(/\.[^/.]+$/, ".wav");
      
      const mockAudioFile = {
        buffer: processedBuffer,
        originalname: tempFileName,
        mimetype: 'audio/wav'
      };
      const { fileUrl: uploadedUrl, fileName: uploadedName } = await uploadAudioOfMeeting(mockAudioFile);
      fileUrl = uploadedUrl;
      fileName = uploadedName;
    } catch (error) {
      console.error("Video processing error:", error);
      throw new ApiError(500, "Failed to process video file");
    }
  }
  // Handle audio files
  else if (fileType === "audio") {
    const { fileUrl: uploadedUrl, fileName: uploadedName } =
      await uploadAudioOfMeeting(req.file);
    fileUrl = uploadedUrl;
    fileName = uploadedName;
  }
  // Handle document files
  else if (fileType === "application") {
    const { fileName: uploadedName, transcriptText: transcriptedText } =
      await uploadTranscriptOfMeeting(req.file);
    fileName = uploadedName;
    transcriptText = transcriptedText;
  } else {
    throw new ApiError(400, "Unsupported file type");
  }

  // Create interview record for all file types
  const interview = await Interview.create({
    userId: req.body.userId,
    candidateName: req.body.candidateName || "Unknown Candidate",
    position: req.body.position || "Unknown Position",
    interviewDate: req.body.meetingDate || new Date(),
    fileName,
    transcriptText,
    status: transcriptText ? "processing" : "pending"
  });

  req.interviewId = interview._id;
  req.transcriptText = transcriptText;
  req.fileUrl = fileUrl;
  req.fileType = fileType === "video" ? "audio" : fileType;
  req.date = req.body.meetingDate;
  
  next();
});

export { uploadFiles };
