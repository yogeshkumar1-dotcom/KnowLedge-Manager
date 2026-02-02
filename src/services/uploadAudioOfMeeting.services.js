import { supabase } from "../utils/supabaseClient.js";
import fs from "fs";
import axios from "axios";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import mammoth from "mammoth";
import ApiError from "../utils/ApiError.js";

const uploadAudioOfMeeting = async (file) => {
  const bucketName = process.env.SUPABASE_BUCKET_NAME || "supabase-bucket";
  if (!bucketName) {
    throw new ApiError(500, "Supabase bucket name not configured");
  }
  const fileExtension = file.originalname.split(".").pop();
  const fileName = `${Date.now()}.${fileExtension}`;
  const fileBuffer = file.buffer;
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, fileBuffer);
  if (error) {
    throw new ApiError(500, "Error uploading file to Supabase", [
      error.message,
    ]);
  }
  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(fileName, 60 * 60 * 24); // URL valid for 24 hours
  if (urlError) {
    throw new ApiError(500, "Error generating signed URL", [urlError.message]);
  }
  return {
    fileUrl: signedUrlData.signedUrl,
    fileName,
  };
};

const uploadTranscriptOfMeeting = async (file) => {
  if (!file) throw new ApiError(400, "No file uploaded");
  console.log("Files - ", file);

  const fileType = file.mimetype.split("/")[1];
  const dataBuffer = file.buffer;
  let transcriptText = "";

  try {
    // 📄 PDF → extract text
    if (fileType === "pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      const data = await pdf(dataBuffer);
      transcriptText = data.text;
    }
    // 🧾 DOCX → extract text
    else if (
      fileType === "vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.originalname.toLowerCase().endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      transcriptText = result.value;
    }
    // 📝 TXT → read directly
    else if (fileType === "plain" || file.originalname.toLowerCase().endsWith(".txt")) {
      transcriptText = dataBuffer.toString("utf8");
    } else {
      throw new ApiError(400, "Unsupported file type: " + fileType);
    }

    return {
      fileName: file.originalname,
      transcriptText: transcriptText.trim(),
    };
  } catch (error) {
    console.error("Transcript extraction failed:", error);
    throw new ApiError(500, "Failed to extract transcript: " + error.message);
  }
};

export { uploadAudioOfMeeting, uploadTranscriptOfMeeting };

// import { supabase } from "../utils/supabaseClient.js";
// import fs from "fs";
// import axios from "axios";
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// const pdf = require("pdf-parse");
// import mammoth from "mammoth";
// import ApiError from "../utils/ApiError.js";

// const uploadAudioOfMeeting = async (file) => {
//   const bucketName = process.env.SUPABASE_BUCKET_NAME || "supabase-bucket";
//   if (!bucketName) {
//     throw new ApiError(500, "Supabase bucket name not configured");
//   }
//   const fileExtension = file.originalname.split(".").pop();
//   const fileName = ${Date.now()}.${fileExtension};
//   const fileBuffer = file.buffer;
//   const { data, error } = await supabase.storage
//     .from(bucketName)
//     .upload(fileName, fileBuffer, {
//       contentType: file.mimetype,
//       cacheControl: "3600",
//       upsert: false,
//     });
//   if (error) {
//     throw new ApiError(500, "Error uploading file to Supabase", [
//       error.message,
//     ]);
//   }
//   const { data: signedUrlData, error: urlError } = await supabase.storage
//     .from(bucketName)
//     .createSignedUrl(fileName, 60 * 60 * 24); // URL valid for 24 hours
//   if (urlError) {
//     throw new ApiError(500, "Error generating signed URL", [urlError.message]);
//   }
//   return {
//     fileUrl: signedUrlData.signedUrl,
//     fileName,
//   };
// };

// const uploadTranscriptOfMeeting = async (file) => {
//   if (!file) throw new ApiError(400, "No file uploaded");
//   console.log("Files - ", file);

//   const fileType = file.mimetype.split("/")[1];
//   const dataBuffer = file.buffer;
//   let transcriptText = "";

//   try {
//     // 📄 PDF → extract text
//     if (fileType === "pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
//       const data = await pdf(dataBuffer);
//       transcriptText = data.text;
//     }
//     // 🧾 DOCX → extract text
//     else if (
//       fileType === "vnd.openxmlformats-officedocument.wordprocessingml.document" ||
//       file.originalname.toLowerCase().endsWith(".docx")
//     ) {
//       const result = await mammoth.extractRawText({ buffer: dataBuffer });
//       transcriptText = result.value;
//     }
//     // 📝 TXT → read directly
//     else if (fileType === "plain" || file.originalname.toLowerCase().endsWith(".txt")) {
//       transcriptText = dataBuffer.toString("utf8");
//     } else {
//       throw new ApiError(400, "Unsupported file type: " + fileType);
//     }

//     return {
//       fileName: file.originalname,
//       transcriptText: transcriptText.trim(),
//     };
//   } catch (error) {
//     console.error("Transcript extraction failed:", error);
//     throw new ApiError(500, "Failed to extract transcript: " + error.message);
//   }
// };

// export { uploadAudioOfMeeting, uploadTranscriptOfMeeting };

