import { Interview } from '../models/interview.models.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * GET ALL INTERVIEWS
 * Only return interviews with status === "scored"
 */
export const getInterviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  // 🔒 Force filter to scored interviews only
  const filter = { status: "scored" };

  const interviews = await Interview.find(filter)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await Interview.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        interviews,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: Number(page),
          limit: Number(limit),
        },
      },
      'Scored interviews fetched successfully'
    )
  );
});

/**
 * GET INTERVIEW BY ID
 * (Optional: You can also restrict this to scored only if needed)
 */
export const getInterviewById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const interview = await Interview.findById(id)
    .populate('userId', 'name email');

  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  // Optional strict check (uncomment if required)
  // if (interview.status !== "scored") {
  //   throw new ApiError(403, "Interview is not scored yet");
  // }

  res.status(200).json(
    new ApiResponse(200, interview, 'Interview fetched successfully')
  );
});

/**
 * UPDATE INTERVIEW SCORE
 * Marks interview as "scored"
 */
export const updateInterviewScore = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    overall_communication_score,
    summary,
    speech_metrics,
    language_quality,
    communication_skills,
    coaching_feedback,
  } = req.body;

  const interview = await Interview.findByIdAndUpdate(
    id,
    {
      overall_communication_score,
      summary,
      speech_metrics,
      language_quality,
      communication_skills,
      coaching_feedback,
      status: "scored", // ✅ FIXED (was 'reviewed')
    },
    { new: true }
  );

  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  res.status(200).json(
    new ApiResponse(200, interview, 'Interview scored successfully')
  );
});
