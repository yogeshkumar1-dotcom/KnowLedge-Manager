/**
 * Google OAuth and Drive Configuration
 * 
 * To set up Google Drive integration:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project
 * 3. Enable Google Drive API and Google Picker API
 * 4. Create OAuth 2.0 credentials (Web Application)
 * 5. Add authorized JavaScript origins: http://localhost:5173 (dev), your production domain
 * 6. Add authorized redirect URIs for your backend
 * 7. Copy Client ID and add to .env file
 */

export const GOOGLE_CONFIG = {
  // Frontend OAuth Client ID (get from Google Cloud Console)
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  
  // API key for Google Picker (get from Google Cloud Console)
  API_KEY: import.meta.env.VITE_GOOGLE_API_KEY || '',
  
  // Scopes needed for Drive access
  SCOPES: [
    'https://www.googleapis.com/auth/drive.readonly'
  ],
  
  // Allowed MIME types for video files
  ALLOWED_VIDEO_MIMES: [
    'video/mp4',
    'video/quicktime', // .mov files
    'video/x-msvideo', // .avi files
    'video/webm',
    'video/x-matroska' // .mkv files
  ],
  
  // Picker API configuration
  PICKER_CONFIG: {
    viewId: 'DOCS',
    mimeTypes: [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/x-matroska'
    ]
  }
};

export default GOOGLE_CONFIG;
