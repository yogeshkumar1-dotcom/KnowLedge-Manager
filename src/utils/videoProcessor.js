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

    const sanitizedName = (originalName || 'uploaded').replace(/[^a-zA-Z0-9.-]/g, '_');
    // Derive extension from originalName if present, default to mp4
    const extMatch = (originalName || '').toLowerCase().match(/\.([a-z0-9]+)$/);
    const inputExt = extMatch ? extMatch[1] : 'mp4';
    const videoPath = path.join(tempDir, `video_${Date.now()}_${sanitizedName}.${inputExt}`);
    const audioPath = path.join(tempDir, `audio_${Date.now()}.wav`);

    // Write video buffer to temp file (with extension)
    fs.writeFileSync(videoPath, videoBuffer);

    const proc = ffmpeg(videoPath)
      .output(audioPath)
      .audioCodec('pcm_s16le')
      .audioFrequency(16000)
      .audioChannels(1)
      .audioBitrate('32k') // Lower bitrate for faster processing
      .noVideo(); // Skip video processing

    // Verbose logging for diagnostics
    proc.on('start', (cmd) => {
      console.log('ffmpeg start:', cmd);
    });
    proc.on('stderr', (line) => {
      // ffmpeg stderr can contain useful warnings/errors
      console.log('ffmpeg stderr:', line);
    });
    proc.on('progress', (progress) => {
      console.log('ffmpeg progress:', progress);
    });

    proc.on('end', () => {
      try {
        const audioBuffer = fs.readFileSync(audioPath);

        // Cleanup temp files
        try { if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath); } catch (e) {}
        try { if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); } catch (e) {}

        resolve(audioBuffer);
      } catch (error) {
        reject(error);
      }
    });

    proc.on('error', (error) => {
      // Cleanup on error
      try { if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath); } catch (e) {}
      try { if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); } catch (e) {}
      console.error('ffmpeg error:', error.message || error);
      reject(error);
    });

    proc.run();
  });
};