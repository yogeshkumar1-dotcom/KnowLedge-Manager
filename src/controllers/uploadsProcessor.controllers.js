import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { extractAudioFromVideo } from "../utils/videoProcessor.js";
import { uploadAudioOfMeeting } from "../services/uploadAudioOfMeeting.services.js";
import { Interview } from "../models/interview.models.js";
import { processInterviewInBackground } from "../utils/backgroundProcessor.js";
import { scoreInterview } from "../services/interviewScoring.services.js";
import { extractTranscript } from "../utils/extractTranscriptFromAudio.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "../uploads");

/**
 * Process uploaded video file:
 * 1. Read video from uploads folder
 * 2. Extract audio
 * 3. Upload to Supabase
 * 4. Create Interview record
 * 5. Extract transcript via Assembly AI
 * 6. Score with Gemini LLM
 */
export const processUploadedVideo = asyncHandler(async (req, res) => {
  const { fileName } = req.params;
  const userId = req.user?.id;

  // Validate filename
  if (fileName.includes("..") || fileName.includes("/")) {
    throw new ApiError(400, "Invalid filename");
  }

  const filePath = path.join(uploadsDir, fileName);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, `File not found: ${fileName}`);
  }

  try {
    // Read video file
    const fileBuffer = fs.readFileSync(filePath);

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new ApiError(400, "Video file is empty");
    }

    // Determine MIME type from extension
    const ext = path.extname(fileName).toLowerCase().replace(".", "");
    const extToMime = {
      mp4: "video/mp4",
      mov: "video/quicktime",
      avi: "video/x-msvideo",
      webm: "video/webm",
      mkv: "video/x-matroska",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/m4a",
    };
    const mimeType = extToMime[ext] || "video/mp4";

    // Extract audio from video
    let processedBuffer;
    let audioFileName;

    if (mimeType.startsWith("video/")) {
      processedBuffer = await extractAudioFromVideo(fileBuffer, fileName);
      audioFileName = fileName.replace(/\.[^/.]+$/, ".wav");

      if (!processedBuffer || processedBuffer.length === 0) {
        throw new ApiError(500, "Audio extraction returned empty buffer");
      }
    } else if (mimeType.startsWith("audio/")) {
      processedBuffer = fileBuffer;
      audioFileName = fileName;
    } else {
      throw new ApiError(400, `Unsupported file type: ${mimeType}`);
    }

    // Create mock file for upload
    const mockFile = {
      buffer: processedBuffer,
      originalname: audioFileName,
      mimetype: mimeType.startsWith("video/") ? "audio/wav" : mimeType,
    };

    // Upload audio to Supabase
    const { fileUrl, fileName: uploadedFileName } = await uploadAudioOfMeeting(mockFile);

    // Create Interview record
    const interview = await Interview.create({
      userId: userId || "system",
      candidateName: "From Uploaded Video",
      position: "Analysis",
      interviewDate: new Date(),
      fileName: uploadedFileName,
      fileUrl: fileUrl,
      status: "processing",
    });

    // Extract transcript via Assembly AI
    let transcriptText = "";
    try {
      const transcriptResult = await extractTranscript(uploadedFileName, interview);
      transcriptText = transcriptResult.transcriptText;
    } catch (transcriptError) {
      transcriptText = "Transcript extraction failed";
    }

    // Score with Gemini LLM
    let scoring = null;
    try {
      scoring = await scoreInterview(transcriptText);
    } catch (scoringError) {
      scoring = {
        overall_communication_score: 0,
        summary: { verdict: "Scoring failed", strengths: [], primary_issues: [] },
      };
    }

    // Update interview with all results
    const updatedInterview = await Interview.findByIdAndUpdate(
      interview._id,
      {
        transcriptText,
        overall_communication_score: scoring?.overall_communication_score || 0,
        interviewer_name: scoring?.interviewer_name,
        interviewee_name: scoring?.interviewee_name,
        summary: scoring?.summary,
        language_quality: scoring?.language_quality,
        communication_skills: scoring?.communication_skills,
        coaching_feedback: scoring?.coaching_feedback,
        status: "scored",
      },
      { new: true }
    );

    res.status(200).json(
      new ApiResponse(
        200,
        {
          interview: updatedInterview,
          transcript: transcriptText,
          scores: scoring,
        },
        "Video processed successfully"
      )
    );
  } catch (error) {
    throw error;
  }
});

/**
 * Download video file directly (without processing)
 */
export const downloadVideo = asyncHandler(async (req, res) => {
  const { fileName } = req.params;

  // Prevent directory traversal attacks
  if (fileName.includes("..") || fileName.includes("/")) {
    throw new ApiError(400, "Invalid filename");
  }

  const filePath = path.join(uploadsDir, fileName);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "File not found");
  }

  // Send file as attachment
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error("Error downloading file:", err);
    }
  });
});
