import { Interview } from '../models/interview.models.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateInterviewPDF, generatePDFFromHTML } from '../services/pdfReportGenerator.services.js';

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

/**
 * GENERATE PDF REPORT
 * Generate and download PDF report for an interview
 */
export const generatePDFReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const interview = await Interview.findById(id)
    .populate('userId', 'name email');

  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  if (interview.status !== 'scored') {
    throw new ApiError(400, 'Interview must be scored before generating PDF report');
  }

  try {
    const pdfBuffer = await generateInterviewPDF(interview);
    
    const fileName = `Interview_Report_${interview.candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new ApiError(500, 'Failed to generate PDF report');
  }
});

/**
 * GENERATE BULK PDF REPORT
 * Generate PDF from HTML content (for multiple interviews)
 */
export const generateBulkPDF = asyncHandler(async (req, res) => {
  const { htmlContent, filename } = req.body;

  if (!htmlContent) {
    throw new ApiError(400, 'HTML content is required');
  }

  try {
    const pdfBuffer = await generatePDFFromHTML(htmlContent);
    
    const pdfFileName = filename || `bulk_interview_report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Bulk PDF generation error:', error);
    throw new ApiError(500, 'Failed to generate bulk PDF report');
  }
});
