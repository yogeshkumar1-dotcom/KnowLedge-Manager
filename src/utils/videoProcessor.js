import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

export const extractAudioFromVideo = (videoBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const videoPath = path.join(tempDir, `video_${Date.now()}_${originalName}`);
    const audioPath = path.join(tempDir, `audio_${Date.now()}.wav`);

    // Write video buffer to temp file
    fs.writeFileSync(videoPath, videoBuffer);

    ffmpeg(videoPath)
      .output(audioPath)
      .audioCodec('pcm_s16le')
      .audioFrequency(16000)
      .audioChannels(1)
      .audioBitrate('32k') // Lower bitrate for faster processing
      .noVideo() // Skip video processing
      .on('end', () => {
        try {
          const audioBuffer = fs.readFileSync(audioPath);
          
          // Cleanup temp files
          fs.unlinkSync(videoPath);
          fs.unlinkSync(audioPath);
          
          resolve(audioBuffer);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        // Cleanup on error
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        reject(error);
      })
      .run();
  });
};