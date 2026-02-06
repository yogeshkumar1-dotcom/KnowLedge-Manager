import axios from "axios";
import { supabase } from "./supabaseClient.js";
import ApiError from "./ApiError.js";
import { generateSpeechMetrics } from "./speechMetrics.js";

const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY;

const extractTranscript = async (fileName, transcript) => {
  const bucketName = process.env.SUPABASE_BUCKET_NAME || "supabase-bucket";

  // First, check if the file exists in the bucket
  const { data: fileExists, error: listError } = await supabase.storage
    .from(bucketName)
    .list("", { search: fileName });

  if (listError) {
    throw new ApiError(404, `Failed to list bucket: ${listError.message}`);
  }
  
  if (!fileExists || fileExists.length === 0) {
    throw new ApiError(404, `Audio file not found in bucket: ${fileName}`);
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(fileName, 60 * 60);

  if (signedError) {
    throw new ApiError(500, "Error generating signed URL", [
      signedError.message,
    ]);
  }
  const audioUrl = signedData.signedUrl;

  const assemblyResponse = await axios.post(
    "https://api.assemblyai.com/v2/transcript",
    {
      audio_url: audioUrl,
      speaker_labels: true,
      speakers_expected: 2,
      punctuate: true,
      format_text: true,
      disfluencies: true,
      speech_model: "best",
      word_boost: ["interviewer", "interviewee", "candidate", "hiring", "manager"],
      boost_param: "high",
      sentiment_analysis: true,
      entity_detection: true,
      auto_highlights: true,
      language_detection: true
    },
    { headers: { authorization: ASSEMBLYAI_KEY } }
  );

  const transcriptedId = assemblyResponse.data.id;
  
  // Poll until transcription is complete with exponential backoff
  let completed = false;
  let transcriptText = "";
  let speechMetrics = {};
  let pollInterval = 1000; // Start with 1 second
  let maxInterval = 10000; // Max 10 seconds between polls
  let consecutiveEmpty = 0;
  
  while (!completed) {
    try {
      const checkResponse = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptedId}`,
        { headers: { authorization: ASSEMBLYAI_KEY } },
      );

      const status = checkResponse.data.status;
      
      if (status === "completed") {
        completed = true;
        const data = checkResponse.data;
        
        // Build enhanced transcript with speaker labels and metadata
        if (data.utterances && data.utterances.length > 0) {
          transcriptText = data.utterances.map(utterance => {
            const sentiment = utterance.sentiment ? ` [${utterance.sentiment.toUpperCase()}]` : '';
            return `Speaker ${utterance.speaker}: ${utterance.text}${sentiment}`;
          }).join('\n\n');
        } else {
          transcriptText = data.text;
        }
        
        const speechMetricsData = generateSpeechMetrics(data);
        
        // Extract additional metadata for better analysis
        const enhancedData = {
          transcript: transcriptText,
          entities: data.entities || [],
          sentiment_analysis_results: data.sentiment_analysis_results || [],
          auto_highlights_result: data.auto_highlights_result || null,
          confidence: data.confidence || 0,
          audio_duration: data.audio_duration || 0,
          speech_metrics: speechMetricsData
        };
        
        // Store enhanced data in speechMetrics for potential future use
        speechMetrics = enhancedData;
        
        // Store AssemblyAI transcript ID for LLM analysis
        speechMetrics.assemblyaiTranscriptId = transcriptedId;
      } else if (status === "failed") {
        completed = true;
        transcript.status = "failed";
        transcript.errorMessage = "Transcription failed";
        await transcript.save();
        throw new ApiError(500, "Transcription failed");
      } else {
        // Exponential backoff: increase wait time as we poll more
        // But cap it at maxInterval to avoid waiting too long
        pollInterval = Math.min(pollInterval * 1.2, maxInterval);
        await new Promise((r) => setTimeout(r, pollInterval));
      }
    } catch (pollError) {
      // If polling fails, wait and retry
      pollInterval = Math.min(pollInterval * 1.5, maxInterval);
      await new Promise((r) => setTimeout(r, pollInterval));
    }
  }
  return { transcriptText, speechMetrics };
};

export { extractTranscript };
