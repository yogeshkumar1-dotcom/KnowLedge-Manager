import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { googleDriveService } from "../services/googleDrive.services.js";
import { Interview } from "../models/interview.models.js";
import { User } from "../models/users.model.js";
import { extractAudioFromVideo } from "../utils/videoProcessor.js";
import { processInterviewInBackground } from "../utils/backgroundProcessor.js";
import { processUploadedVideo } from "./uploadsProcessor.controllers.js";
import axios from "axios";
import { extractCandidateFromFilename } from "../utils/nameExtractor.js";
import { extractNameWithAI } from "../utils/AI_NameExtractor.js";
import { uploadAudioOfMeeting } from "../services/uploadAudioOfMeeting.services.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "../uploads");

/**
 * Ensure uploads directory exists
 */
const ensureUploadsDir = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created uploads directory: ${uploadsDir}`);
  }
};

/**
 * Save downloaded video to uploads folder for debugging
 */
const saveVideoToUploads = (fileName, fileBuffer, mimeType) => {
  ensureUploadsDir();
  
  // Determine extension from MIME type if filename doesn't have one
  let fileExtension = fileName.split(".").pop();
  if (fileExtension === fileName || !fileExtension) {
    // Filename has no extension, derive from MIME type
    const mimeToExt = {
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/x-msvideo': 'avi',
      'video/webm': 'webm',
      'video/x-matroska': 'mkv',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/m4a': 'm4a'
    };
    fileExtension = mimeToExt[mimeType] || 'bin';
  }
  
  const safeFileName = `${Date.now()}_${sanitizeFileName(fileName.replace(/\.[^/.]+$/, ''))}.${fileExtension}`;
  const filePath = path.join(uploadsDir, safeFileName);
  
  fs.writeFileSync(filePath, fileBuffer);
  console.log(`Video saved to: ${filePath}`);
  return { filePath, fileName: safeFileName };
};

/**
 * Sanitize filename to remove invalid characters
 */
const sanitizeFileName = (fileName) => {
  return fileName
    .replace(/[^\w\s.-]/g, '_') // Replace invalid chars with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .substring(0, 200); // Limit length
};

/**
 * Upload file from Google Drive
 *
 * Flow:
 * 1. Receive file ID and access token from frontend
 * 2. Download file from Google Drive using access token
 * 3. Process the file (extract audio if video)
 * 4. Upload to Supabase storage
 * 5. Create Interview record
 * 6. Trigger background analysis
 */
const uploadFromGoogleDrive = asyncHandler(async (req, res, next) => {
  const { fileId, fileName, mimeType, meetingDate } = req.body;
  const userId = req.user?.id;

  // Validate required fields
  if (!fileId) {
    throw new ApiError(400, "Missing required field: fileId");
  }
  if (!fileName) {
    throw new ApiError(400, "Missing required field: fileName");
  }

  // Sanitize filename early to prevent issues downstream
  const sanitizedFileName = sanitizeFileName(fileName);

  // Get user's stored Google Drive access token from User model
  const user = await User.findById(userId).select('googleDriveAccessToken');
  let accessToken = user?.googleDriveAccessToken;
  
  if (!accessToken) {
    throw new ApiError(401, "No Google Drive access token found. Please re-authenticate.");
  }

  // Validate file type
  if (!googleDriveService.isValidVideoFile(mimeType)) {
    throw new ApiError(
      400,
      `Invalid file type: ${mimeType}. Only audio and video files are supported.`,
    );
  }

  try {
    // Download file from Google Drive
    const fileBuffer = await googleDriveService.downloadFile(
      fileId,
      accessToken,
    );

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new ApiError(400, "Downloaded file is empty");
    }

    // Calculate file hash to detect duplicates (do this early before any I/O)
    const fileHash = crypto.createHash("md5").update(fileBuffer).digest("hex");

    // Check if file already processed (avoid reprocessing)
    const existingInterview = await Interview.findOne({
      fileHash,
      status: "scored",
    }).sort({ createdAt: -1 });
    if (existingInterview) {
      return res.status(200).json(
        new ApiResponse(200, { interview: existingInterview }, "File already processed")
      );
    }

    // Extract MIME type category early
    const [fileTypeCategory] = mimeType.split("/");
    let processedBuffer = fileBuffer;
    let audioFileName = sanitizedFileName;

    // Process based on file type (extract audio if needed)
    if (fileTypeCategory === "video") {
      try {
        processedBuffer = await extractAudioFromVideo(fileBuffer, sanitizedFileName);
        if (!processedBuffer || processedBuffer.length === 0) {
          throw new Error("Audio extraction returned empty buffer");
        }
        // Ensure proper .wav extension for extracted audio
        audioFileName = sanitizedFileName.includes('.') 
          ? sanitizedFileName.replace(/\.[^/.]+$/, ".wav")
          : `${sanitizedFileName}.wav`;
      } catch (extractError) {
        throw new ApiError(500, `Failed to extract audio from video: ${extractError.message}`);
      }
    } else if (fileTypeCategory === "audio") {
      // Ensure audio files have proper extension
      if (!sanitizedFileName.includes('.')) {
        const audioExtMap = {
          'audio/mpeg': 'mp3',
          'audio/wav': 'wav',
          'audio/ogg': 'ogg',
          'audio/m4a': 'm4a'
        };
        const ext = audioExtMap[mimeType] || 'mp3';
        audioFileName = `${sanitizedFileName}.${ext}`;
      }
    } else {
      throw new ApiError(400, `Unsupported file type category: ${fileTypeCategory}`);
    }

    // Upload audio to Supabase (do this once, not multiple times)
    const audioFile = {
      buffer: processedBuffer,
      originalname: audioFileName,
      mimetype: fileTypeCategory === "video" ? "audio/wav" : mimeType,
    };

    const { fileUrl, fileName: uploadedFileName } = await uploadAudioOfMeeting(audioFile);
    console.log(`Audio uploaded to Supabase: ${uploadedFileName}`);

    // Extract candidate name using AI first, fallback to regex pattern
    let candidateName = await extractNameWithAI(fileName);
    if (!candidateName) {
      candidateName = extractCandidateFromFilename(fileName) || "Unknown Candidate";
    }
    console.log(`Extracted candidate name: ${candidateName}`);

    // Create Interview record with all details at once
    const interview = await Interview.create({
      userId: userId,
      candidateName,
      position: req.body.position || "Unknown Position",
      interviewDate: meetingDate ? new Date(meetingDate) : new Date(),
      fileName: uploadedFileName,
      fileUrl: fileUrl,
      fileHash,
      googleDriveFileId: fileId,
      status: "pending",
    });
    console.log(`Interview created with ID: ${interview._id}, fileName: ${uploadedFileName}`);

    // Build aiConfig from incoming request and wait for background processing
    const aiConfig = {
      customApiKey: req.body && req.body.customApiKey ? req.body.customApiKey : null,
      selectedModel: req.body && req.body.selectedModel ? req.body.selectedModel : null,
    };

    console.log(`Starting background processing for interview ${interview._id}`);
    console.log(`AI Config:`, aiConfig);
    
    try {
      await processInterviewInBackground(interview._id, aiConfig);
      console.log(`Background processing completed for interview ${interview._id}`);
    } catch (bgError) {
      console.error(`Background processing error for interview ${interview._id}:`, bgError);
      console.error(`Error stack:`, bgError.stack);
      // Continue and return the interview even if processing had issues
    }

    // Fetch updated interview with transcript and scores
    const updatedInterview = await Interview.findById(interview._id);
    console.log(`Updated interview status: ${updatedInterview.status}, has transcript: ${!!updatedInterview.transcriptText}`);

    // Return success response with final results (match local upload response structure)
    res.status(200).json(
      new ApiResponse(
        200,
        {
          interview: updatedInterview,
          fileUrl,
          fileName: uploadedFileName,
        },
        "File uploaded and processing complete"
      )
    );
  } catch (error) {
    if (error.message?.includes("401") || error.response?.status === 401) {
      throw new ApiError(
        401,
        "Google Drive access token expired or invalid. Please re-authenticate.",
      );
    } else if (error.message?.includes("404") || error.response?.status === 404) {
      throw new ApiError(
        404,
        "File not found in Google Drive. The file may have been deleted.",
      );
    } else if (error.response?.status === 403) {
      throw new ApiError(
        403,
        "Access denied. Please check that you have permission to access this file.",
      );
    } else if (error instanceof ApiError) {
      throw error;
    } else {
      const msg = error.message || "Unknown error occurred";
      throw new ApiError(500, `Failed to process Google Drive file: ${msg}`);
    }
  }
});

/**
 * Get file metadata from Google Drive
 * Used for validation before uploading
 */
const getGoogleDriveFileInfo = asyncHandler(async (req, res) => {
  const { fileId, accessToken } = req.body;

  if (!fileId || !accessToken) {
    throw new ApiError(400, "Missing fileId or accessToken");
  }

  try {
    const metadata = await googleDriveService.getFileMetadata(
      fileId,
      accessToken,
    );

    if (!googleDriveService.isValidVideoFile(metadata.mimeType)) {
      throw new ApiError(400, `Invalid file type: ${metadata.mimeType}`);
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, metadata, "File metadata retrieved successfully"),
      );
  } catch (error) {
    throw new ApiError(500, `Failed to get file info: ${error.message}`);
  }
});

export { uploadFromGoogleDrive, getGoogleDriveFileInfo };

/**
 * Download the original file from Google Drive into `uploads/` and then
 * trigger processing (audio extraction → upload → transcription → scoring).
 *
 * This endpoint is useful when the initially saved file appears to be missing
 * audio or when you want to force a fresh download of the original file.
 *
 * Route: POST /api/v1/audio/uploads/:fileName
 */
const downloadOriginalAndProcess = asyncHandler(async (req, res) => {
  const { fileName } = req.params;
  const { googleDriveFileId } = req.body;
  const userId = req.user?.id;

  if (!fileName) {
    throw new ApiError(400, "fileName param required");
  }

  // Prevent directory traversal
  if (fileName.includes("..") || fileName.includes("/")) {
    throw new ApiError(400, "Invalid filename");
  }

  // Determine Drive fileId: prefer explicit param, otherwise look up by Interview record
  let fileId = googleDriveFileId;
  if (!fileId) {
    const interview = await Interview.findOne({ fileName }).sort({ createdAt: -1 });
    if (!interview || !interview.googleDriveFileId) {
      throw new ApiError(400, "googleDriveFileId not provided and no matching Interview found");
    }
    fileId = interview.googleDriveFileId;
  }

  // Get access token from user (if available)
  const user = await User.findById(userId).select("googleDriveAccessToken");
  const accessToken = user?.googleDriveAccessToken || null;

  try {
    console.log(`Downloading original Drive file ${fileId} into uploads/${fileName} ...`);

    const fileBuffer = await googleDriveService.downloadFile(fileId, accessToken);

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new ApiError(400, "Downloaded file is empty");
    }

    ensureUploadsDir();
    const destPath = path.join(uploadsDir, fileName);
    fs.writeFileSync(destPath, fileBuffer);
    console.log(`Saved original Drive file to: ${destPath}`);

    // IMPORTANT: do not process the raw binary we just saved. Instead call
    // the internal download API to retrieve a cleaned .mp4 version of the
    // file, save that .mp4 into uploads/, then process the .mp4 file.
    try {
      const host = req.get("host");
      const protocol = req.protocol || (process.env.NODE_ENV === "production" ? "https" : "http");
      const downloadUrl = `${protocol}://${host}/api/v1/audio/uploads/${encodeURIComponent(fileName)}`;
      console.log(`Fetching cleaned .mp4 from internal download API: ${downloadUrl}`);

      const downloadResp = await axios.get(downloadUrl, {
        responseType: "arraybuffer",
        timeout: 120000,
      });

      console.log(`Downloaded cleaned .mp4 from internal API. Size: ${downloadResp.data} bytes`);

      if (!downloadResp || !downloadResp.data || downloadResp.data.length === 0) {
        throw new Error("Internal download returned empty response");
      }

      // Save the downloaded .mp4 version. Ensure extension is .mp4
      const baseName = fileName.replace(/\.[^/.]+$/, "");
      const mp4Name = `${baseName}.mp4`;
      const mp4Path = path.join(uploadsDir, mp4Name);
      fs.writeFileSync(mp4Path, Buffer.from(downloadResp.data));
      console.log(`Saved cleaned .mp4 to: ${mp4Path}`);

      // Trigger processing on the cleaned .mp4 file
      const mockReq = {
        params: { fileName: mp4Name },
        user: req.user || {},
      };
      const mockRes = {
        status: () => ({ json: () => {} }),
        json: () => {},
      };
      const mockNext = (err) => {
        if (err) {
          console.error("[DOWNLOADORIGINAL] Error in processUploadedVideo:", err);
        }
      };

      await processUploadedVideo(mockReq, mockRes, mockNext);

      return res.status(200).json(new ApiResponse(200, { fileName: mp4Name }, "Downloaded cleaned .mp4 and processing started"));
    } catch (innerErr) {
      console.error("Failed to fetch/process cleaned .mp4 via internal download API:", innerErr.message);
      // Fall back to processing the original saved file to avoid losing the upload entirely
      const fallbackReq = { params: { fileName }, user: req.user || {} };
      const fallbackRes = { status: () => ({ json: () => {} }), json: () => {} };
      const fallbackNext = (err) => {
        if (err) {
          console.error("[DOWNLOADORIGINAL] Error in fallback processUploadedVideo:", err);
        }
      };
      try {
        await processUploadedVideo(fallbackReq, fallbackRes, fallbackNext);
        return res.status(200).json(new ApiResponse(200, { fileName }, "Downloaded original and started fallback processing"));
      } catch (fallbackErr) {
        console.error("Fallback processing also failed:", fallbackErr.message);
        throw new ApiError(500, `Failed to download/process cleaned file: ${innerErr.message}`);
      }
    }
  } catch (error) {
    console.error("Error downloading original Drive file:", error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Failed to download/process original file: ${error.message}`);
  }
});

export { downloadOriginalAndProcess };
