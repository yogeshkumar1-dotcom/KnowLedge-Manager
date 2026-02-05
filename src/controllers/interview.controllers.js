import { Interview } from '../models/interview.models.js';
import { Transcript } from '../models/transcript.models.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { scoreInterview } from '../services/interviewScoring.services.js';

export const getInterviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const filter = {};
  if (status) filter.status = status ;
  
  const interviews = await Interview.find(filter)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
  const total = await Interview.countDocuments(filter);
  
  res.status(200).json(
    new ApiResponse(200, {
      interviews,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    }, 'Interviews fetched successfully')
  );
});

export const getInterviewById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const interview = await Interview.findById(id)
    .populate('userId', 'name email');
    
  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }
  
  res.status(200).json(
    new ApiResponse(200, interview, 'Interview fetched successfully')
  );
});

export const updateInterviewScore = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    overall_communication_score,
    summary,
    speech_metrics,
    language_quality,
    communication_skills,
    coaching_feedback 
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
      status: 'reviewed' 
    },
    { new: true }
  );
  
  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }
  
  res.status(200).json(
    new ApiResponse(200, interview, 'Interview score updated successfully')
  );
});