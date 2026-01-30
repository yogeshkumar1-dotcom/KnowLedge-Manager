import axios from "axios";
import { supabase } from "./supabaseClient.js";
import ApiError from "./ApiError.js";

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
    { audio_url: audioUrl },
    { headers: { authorization: ASSEMBLYAI_KEY } },
  );

  const transcriptedId = assemblyResponse.data.id;

  // 4. Poll until transcription is complete
  let completed = false;
  let transcriptText = "";
  let speechMetrics = {}
  while (!completed) {
    const checkResponse = await axios.get(
      `https://api.assemblyai.com/v2/transcript/${transcriptedId}`,
      {
        audio_url: audioUrl,

        // 🔥 ENABLE SPEECH METRICS
        punctuate: true,
        format_text: true,
        disfluencies: true, // fillers like um, uh
        speaker_labels: true, // optional but useful
        sentiment_analysis: true, // engagement signal
        word_boost: ["um", "uh", "like", "you know", "basically"],

        // IMPORTANT
        speech_model: "best",
      },
      { headers: { authorization: ASSEMBLYAI_KEY } },
    );

    const status = checkResponse.data.status;
    if (status === "completed") {
      completed = true;
      transcriptText = checkResponse.data.text;
      speechMetrics = checkResponse.data || {}
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
  console.log("Transcription completed for file: ", transcriptText);
  return transcriptText;
};

export { extractTranscript };
