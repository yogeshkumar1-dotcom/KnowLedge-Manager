import { Interview } from "../models/interview.models.js";
import { extractTranscript } from "./extractTranscriptFromAudio.js";
import { scoreInterview } from "../services/interviewScoring.services.js";

// Background processing for interviews - WAITS for all steps to complete
export const processInterviewInBackground = async (interviewId) => {
  try {
    // Fetch interview
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return;
    }

    const fileName = interview.fileName;
    if (!fileName) {
      return;
    }

    // Step 1: Extract transcript from audio via AssemblyAI
    let transcriptText = "";
    let speechMetrics = {};
    
    try {
      const result = await extractTranscript(fileName, interview);
      transcriptText = result.transcriptText;
      speechMetrics = result.speechMetrics;
    } catch (transcriptError) {
      interview.status = "failed";
      interview.errorMessage = transcriptError.message;
      await interview.save();
      return;
    }

    // Update interview with transcript
    interview.transcriptText = transcriptText;
    interview.status = "processing";
    await interview.save();

    // Step 2: Score interview with Gemini LLM
    let scoring = null;
    
    try {
      scoring = await scoreInterview(transcriptText);
    } catch (scoringError) {
      interview.status = "failed";
      interview.errorMessage = scoringError.message;
      await interview.save();
      return;
    }

    // Step 3: Update interview with all results
    try {
      await Interview.findByIdAndUpdate(
        interviewId,
        {
          transcriptText,
          overall_communication_score: scoring?.overall_communication_score || 0,
          interviewer_name: scoring?.interviewer_name,
          interviewee_name: scoring?.interviewee_name,
          summary: scoring?.summary,
          language_quality: scoring?.language_quality,
          communication_skills: scoring?.communication_skills,
          coaching_feedback: scoring?.coaching_feedback,
          speech_metrics: speechMetrics.speech_metrics || {
            words_per_minute: 0,
            pause_analysis: { long_pauses_detected: false, average_pause_duration_seconds: 0 },
            filler_words: { total_count: 0, fillers_per_minute: 0, most_common_fillers: [] },
            repetition: { repeated_words_detected: false, examples: [] }
          },
          status: "scored",
        },
        { new: true }
      );
    } catch (updateError) {
      // Handle update error silently
    }
  } catch (error) {
    // Handle error silently
  }
};