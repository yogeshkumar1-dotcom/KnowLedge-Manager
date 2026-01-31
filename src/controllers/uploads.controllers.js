import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { supabase } from "../utils/supabaseClient.js";
import { Transcript } from "../models/transcript.models.js";
import {
  uploadAudioOfMeeting,
  uploadTranscriptOfMeeting,
} from "../services/uploadAudioOfMeeting.services.js";

const uploadFiles = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  console.log('File received:', {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });

  const [fileType] = req.file.mimetype.split("/");

  let fileUrl,
    fileName = "",
    transcriptText = "";

  try {
    // Upload based on file type
    if (fileType === "audio" || fileType === "video") {
      console.log('Processing audio file...');
      const { fileUrl: uploadedUrl, fileName: uploadedName } =
        await uploadAudioOfMeeting(req.file);
      fileUrl = uploadedUrl;
      fileName = uploadedName;
    } else if (fileType === "video") {
      console.log('Processing video file...');
      const { extractAudioFromVideo } = await import("../utils/videoProcessor.js");

      try {
        const { audioBuffer, audioName } = await extractAudioFromVideo(req.file.buffer, req.file.originalname);

        // Create a new fake file object for the audio
        const audioFile = {
          buffer: audioBuffer,
          originalname: audioName,
          mimetype: 'audio/mpeg'
        };

        const { fileUrl: uploadedUrl, fileName: uploadedName } =
          await uploadAudioOfMeeting(audioFile);
        fileUrl = uploadedUrl;
        fileName = uploadedName;
        req.file = audioFile; // Update req.file to be the audio file for subsequent steps
        console.log('Video processed successfully, audio extracted');
      } catch (videoError) {
        console.error('Video processing failed:', videoError);
        throw new ApiError(500, `Video processing failed: ${videoError.message}`);
      }
    } else if (fileType === "application") {
      console.log('Processing document file...');
      const { fileName: uploadedName, transcriptText: transcriptedText } =
        await uploadTranscriptOfMeeting(req.file);
      fileName = uploadedName;
      transcriptText = transcriptedText;
    } else {
      throw new ApiError(400, `Unsupported file type: ${fileType}`);
    }

    // Create transcript record immediately
    const transcript = await Transcript.create({
      userId: req.body.userId, // comes from frontend auth/session
      fileName,
      status: "pending",
    });
    console.log("Transcript record created: ", transcript._id);

    if (transcriptText.trim()) {
      req.transcriptId = transcript._id;
      req.transcriptText = transcriptText;
      req.date = req.body.meetingDate;
      next();
    } else {
      req.transcriptId = transcript._id;
      req.fileUrl = fileUrl;
      req.fileType = fileType;
      req.date = req.body.meetingDate;
      next();
    }
  } catch (error) {
    console.error('Upload processing error:', error);
    throw error;
  }
});

export { uploadFiles };
