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
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "No files uploaded");
  }

  console.log('Files received:', req.files.map(f => ({
    originalname: f.originalname,
    mimetype: f.mimetype,
    size: f.size
  })));

  const transcriptIds = [];
  const processedFiles = [];

  for (const file of req.files) {
    const [fileType] = file.mimetype.split("/");

    let fileUrl,
      fileName = "",
      transcriptText = "";

    try {
      // Upload based on file type
      if (fileType === "audio") {
        console.log('Processing audio file...');
        const { fileUrl: uploadedUrl, fileName: uploadedName } =
          await uploadAudioOfMeeting(file);
        fileUrl = uploadedUrl;
        fileName = uploadedName;
      } else if (fileType === "video") {
        console.log('Processing video file...');
        const { extractAudioFromVideo } = await import("../utils/videoProcessor.js");

        try {
          const { audioBuffer, audioName } = await extractAudioFromVideo(file.buffer, file.originalname);

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
          // Update file to be the audio file for subsequent steps
          Object.assign(file, audioFile);
          console.log('Video processed successfully, audio extracted');
        } catch (videoError) {
          console.error('Video processing failed:', videoError);
          throw new ApiError(500, `Video processing failed: ${videoError.message}`);
        }
      } else if (fileType === "application") {
        console.log('Processing document file...');
        const { fileName: uploadedName, transcriptText: transcriptedText } =
          await uploadTranscriptOfMeeting(file);
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

      transcriptIds.push(transcript._id);
      processedFiles.push({
        transcriptId: transcript._id,
        fileName,
        fileUrl,
        transcriptText,
        date: req.body.meetingDate
      });

    } catch (error) {
      console.error('Upload processing error for file:', file.originalname, error);
      throw error;
    }
  }

  req.transcriptIds = transcriptIds;
  req.processedFiles = processedFiles;
  next();
});

export { uploadFiles };
