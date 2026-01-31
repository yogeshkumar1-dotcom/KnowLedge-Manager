import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import stream from 'stream';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import os from 'os';

// Setup ffmpeg path
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
} else {
  console.warn('ffmpeg-static path not found, using system ffmpeg');
}

/**
 * Extracts audio from a video buffer and returns an audio buffer
 * @param {Buffer} videoBuffer 
 * @param {string} originalName
 * @returns {Promise<{audioBuffer: Buffer, audioName: string}>}
 */
export const extractAudioFromVideo = async (videoBuffer, originalName) => {
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `input_${Date.now()}_${path.basename(originalName)}`);
    const outputPath = path.join(tempDir, `output_${Date.now()}.mp3`);

    try {
        // Write buffer to temp file
        await fs.promises.writeFile(inputPath, videoBuffer);

        // Extract audio using ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .toFormat('mp3')
                .audioCodec('libmp3lame')
                .audioBitrate(128)
                .on('error', (err) => {
                    console.error('ffmpeg error:', err);
                    reject(new Error(`Video processing failed: ${err.message}`));
                })
                .on('end', () => {
                    console.log('Audio extraction completed');
                    resolve();
                })
                .save(outputPath);
        });

        // Check if output file exists
        if (!fs.existsSync(outputPath)) {
            throw new Error('Audio extraction failed - output file not created');
        }

        // Read extracted audio
        const audioBuffer = await fs.promises.readFile(outputPath);
        const audioName = originalName.replace(/\.[^/.]+$/, "") + ".mp3";

        return { audioBuffer, audioName };
    } catch (error) {
        console.error('Video processing error:', error);
        throw error;
    } finally {
        // Cleanup temp files
        try {
            if (fs.existsSync(inputPath)) await fs.promises.unlink(inputPath);
            if (fs.existsSync(outputPath)) await fs.promises.unlink(outputPath);
        } catch (err) {
            console.error('Cleanup error:', err);
        }
    }
};
