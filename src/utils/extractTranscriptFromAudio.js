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

  if (listError || !fileExists || fileExists.length === 0) {
    console.error(`File not found in bucket: ${fileName}`);
    throw new ApiError(404, `Audio file not found: ${fileName}`);
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(fileName, 60 * 60);
  console.log("Bucket Name: ", bucketName);

  console.log("Signed URL data: ", signedData, " Error: ", signedError);

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
  console.log("AssemblyAI Transcript ID: ", transcriptedId);
  // 4. Poll until transcription is complete
  let completed = false;
  let transcriptText = "";
  let speechMetrics = {}
  while (!completed) {
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
      
      console.log("Enhanced transcript data:", {
        transcript_length: transcriptText.length,
        entities_found: enhancedData.entities.length,
        confidence: enhancedData.confidence,
        duration: enhancedData.audio_duration,
        words_per_minute: speechMetricsData.words_per_minute,
        filler_count: speechMetricsData.filler_words.total_count
      });
      
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
      // wait 2 seconds before next poll
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.log("Transcription completed for file: ", transcriptText.substring(0, 200));
  return { transcriptText, speechMetrics };
};

export { extractTranscript };
