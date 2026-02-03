import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegStatic);

export const compressVideo = (videoBuffer, originalName, maxSizeMB = 50) => {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const inputPath = path.join(tempDir, `input_${Date.now()}_${originalName}`);
    const outputPath = path.join(tempDir, `compressed_${Date.now()}.mp4`);

    fs.writeFileSync(inputPath, videoBuffer);

    // Calculate target bitrate based on file size
    const fileSizeMB = videoBuffer.length / (1024 * 1024);
    const compressionRatio = Math.min(maxSizeMB / fileSizeMB, 1);
    const targetBitrate = Math.max(500, Math.floor(1000 * compressionRatio)); // Min 500k

    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .videoBitrate(`${targetBitrate}k`)
      .audioBitrate('64k')
      .size('720x?') // Maintain aspect ratio, max width 720
      .aspect('16:9')
      .fps(24)
      .on('end', () => {
        try {
          const compressedBuffer = fs.readFileSync(outputPath);
          
          // Cleanup
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
          
          resolve(compressedBuffer);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        // Cleanup on error
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        reject(error);
      })
      .run();
  });
};