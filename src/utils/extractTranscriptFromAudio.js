import axios from "axios";
import { supabase } from "./supabaseClient.js";
import ApiError from "./ApiError.js";



const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY;

const extractTranscript = async (fileName, transcript) => {
  const bucketName = process.env.SUPABASE_BUCKET_NAME || "supabase-bucket";
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
    { audio_url: audioUrl },
    { headers: { authorization: ASSEMBLYAI_KEY } }
  );

  const transcriptedId = assemblyResponse.data.id;

  // 4. Poll until transcription is complete
  let completed = false;
  let transcriptText = "";
  while (!completed) {
    const checkResponse = await axios.get(
      `https://api.assemblyai.com/v2/transcript/${transcriptedId}`,
      { headers: { authorization: ASSEMBLYAI_KEY } }
    );

    const status = checkResponse.data.status;
    if (status === "completed") {
      completed = true;
      transcriptText = checkResponse.data.text;
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
  return transcriptText
};

export { extractTranscript }