import { Interview } from "../models/interview.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { scoreInterview } from "../services/interviewScoring.services.js";
import { extractTranscript } from "../utils/extractTranscriptFromAudio.js";

const createTranscript = asyncHandler(async (req, res) => {
  const interviewId = req.interviewId;
  if (!interviewId) {
    throw new ApiError(400, "interviewId required");
  }

  const interview = await Interview.findById(interviewId);
  if (!interview) {
    throw new ApiError(404, "Interview record not found");
  }

  if (interview.status === "scored") {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { interview }, "Interview already scored")
      );
  }

  const fileName = interview.fileName;
  if (!fileName) {
    throw new ApiError(400, "No file associated with this interview");
  }
  
  let transcriptText = req.transcriptText || "";
  const fileExtension = fileName.split(".").pop().toLowerCase();
  if (["mp3", "wav", "ogg", "m4a"].includes(fileExtension)) {
    transcriptText = await extractTranscript(fileName, interview);
  }
  return res.json({ message: "Transcript extraction in progress", data: transcriptText });
  // Update interview with transcript
  interview.transcriptText = transcriptText;
  interview.status = "processing";
  await interview.save();

  // Score the interview
  let interviewScore = null;
  try {
    const scoring = await scoreInterview(transcriptText);
    console.log("Interview Scoring Result: ", scoring);
    const updatedInterview = await Interview.findByIdAndUpdate(
      interviewId,
      {
        overall_communication_score: scoring.overall_communication_score,
        summary: scoring.summary,
        speech_metrics: scoring.speech_metrics,
        language_quality: scoring.language_quality,
        communication_skills: scoring.communication_skills,
        coaching_feedback: scoring.coaching_feedback,
        status: 'scored'
      },
      { new: true }
    );
    interviewScore = updatedInterview;
  } catch (error) {
    console.error('Error scoring interview:', error);
    interview.status = 'pending';
    await interview.save();
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, { interview: interviewScore }, "Interview processing completed")
    );
});

const getInterview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Interview id required");
  }
  const interview = await Interview.findById(id).populate(
    "userId",
    "name email"
  );

  if (!interview) {
    throw new ApiError(404, "Interview not found");
  }
  res.status(200).json(
    new ApiResponse(
      200,
      {
        id: interview._id,
        user: interview.userId,
        candidateName: interview.candidateName,
        position: interview.position,
        fileName: interview.fileName,
        status: interview.status,
        createdAt: interview.createdAt,
        updatedAt: interview.updatedAt,
        transcriptText: interview.status === "scored" ? interview.transcriptText : null,
        scores: interview.status === "scored" ? {
          overall_communication_score: interview.overall_communication_score,
          summary: interview.summary,
          speech_metrics: interview.speech_metrics,
          language_quality: interview.language_quality,
          communication_skills: interview.communication_skills,
          coaching_feedback: interview.coaching_feedback
        } : null,
      },
      "Interview fetched successfully"
    )
  );
});

const getRecentInterviews = asyncHandler(async (req, res) => {
  let { limit, sort, page } = req.query;

  const pageNum = Number(page) > 0 ? Number(page) : 1;
  const limitNum = Number(limit) > 0 ? Number(limit) : 5;
  const sortOrder = sort === "asc" ? 1 : -1;

  const skip = (pageNum - 1) * limitNum;

  const interviews = await Interview.find()
    .sort({ createdAt: sortOrder })
    .skip(skip)
    .limit(limitNum);

  const total = await Interview.countDocuments();
  const totalPages = Math.ceil(total / limitNum);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        interviews,
        pagination: {
          total,
          totalPages,
          currentPage: pageNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
      "Recent interviews fetched successfully."
    )
  );
});

export { createTranscript, getInterview, getRecentInterviews };
