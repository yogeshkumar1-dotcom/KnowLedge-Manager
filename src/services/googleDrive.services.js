import { google } from 'googleapis';
import axios from 'axios';
import { Readable } from 'stream';

/**
 * Google Drive Service for downloading video files
 * 
 * To set up:
 * 1. Create a service account in Google Cloud Console
 * 2. Download the service account JSON key file
 * 3. Store the key file path in GOOGLE_SERVICE_ACCOUNT_KEY environment variable
 * OR use OAuth2 with refresh tokens for user authentication
 */

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.initializeDrive();
  }

  /**
   * Initialize Google Drive API client
   * Supports both service account and OAuth2 authentication
   */
  initializeDrive() {
    try {
      const serviceAccountKeyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      
      if (serviceAccountKeyPath) {
        // Using Service Account (recommended for backend automation)
        const keyFile = require(serviceAccountKeyPath);
        const auth = new google.auth.GoogleAuth({
          keyFile: serviceAccountKeyPath,
          scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        this.drive = google.drive({ version: 'v3', auth });
      } else {
        console.warn('Google Drive service account key not configured');
      }
    } catch (error) {
      console.error('Error initializing Google Drive:', error.message);
    }
  }

  /**
   * Download file from Google Drive
   * @param {string} fileId - Google Drive file ID
   * @param {string} accessToken - Optional user access token (if using OAuth2)
   * @returns {Promise<Buffer>} - File buffer
   */
  async downloadFile(fileId, accessToken = null) {
    try {
      if (!this.drive && !accessToken) {
        throw new Error('Google Drive service not initialized and no access token provided');
      }

      let response;
      
      if (accessToken) {
        // Using OAuth2 access token (user-specific access)
        console.log(`Downloading from Google Drive using OAuth token for file: ${fileId}`);
        response = await axios.get(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            responseType: 'arraybuffer',
            timeout: 60000, // 60 second timeout
          }
        );
        console.log(`File downloaded successfully. Size: ${response.data.length} bytes`);
      } else {
        // Using service account
        console.log(`Downloading from Google Drive using service account for file: ${fileId}`);
        response = await this.drive.files.get(
          {
            fileId,
            alt: 'media',
          },
          { responseType: 'stream' }
        );
        
        return await this.#streamToBuffer(response.data);
      }

      return Buffer.from(response.data);
    } catch (error) {
      console.error(`Google Drive download error for file ${fileId}:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      throw error;
    }
  }

  /**
   * Get file metadata from Google Drive
   * @param {string} fileId - Google Drive file ID
   * @param {string} accessToken - Optional user access token
   * @returns {Promise<Object>} - File metadata
   */
  async getFileMetadata(fileId, accessToken = null) {
    try {
      if (!this.drive && !accessToken) {
        throw new Error('Google Drive service not initialized and no access token provided');
      }

      let response;

      if (accessToken) {
        response = await axios.get(
          `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        return response.data;
      } else {
        response = await this.drive.files.get({
          fileId,
          fields: 'id, name, mimeType, size, createdTime, modifiedTime',
        });
        return response.data;
      }
    } catch (error) {
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Validate file MIME type
   * @param {string} mimeType - MIME type to validate
   * @returns {boolean}
   */
  isValidVideoFile(mimeType) {
    const validMimes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/x-matroska',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/m4a',
    ];
    return validMimes.includes(mimeType);
  }

  /**
   * Convert readable stream to buffer
   * @private
   * @param {Stream} stream - Readable stream
   * @returns {Promise<Buffer>}
   */
  async #streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();
export default googleDriveService;
