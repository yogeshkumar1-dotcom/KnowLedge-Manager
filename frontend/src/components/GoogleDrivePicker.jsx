import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axios';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import useDrivePicker from 'react-google-drive-picker';

/**
 * GoogleDrivePicker Component
 * 
 * Allows users to select and upload video files from Google Drive
 * Uses Google Picker API or direct Drive selection via OAuth
 */
const GoogleDrivePicker = ({ onFilesSelected, meetingDate }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [driveToken, setDriveToken] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [openPicker, authResponse] = useDrivePicker();

  // Fetch stored Google Drive access token on mount to avoid repeated re-authentication
  useEffect(() => {
    const fetchDriveToken = async () => {
      try {
        // Call backend endpoint to get the stored Drive token for the logged-in user
        const response = await axiosInstance.get('/api/v1/auth/google-drive-token');
        if (response.data?.data?.token) {
          setDriveToken(response.data.data.token);
          console.log('Google Drive token retrieved; will reuse for picker');
        }
      } catch (err) {
        console.warn('Failed to fetch stored Google Drive token:', err.message);
        // Picker will prompt for auth on first open if token unavailable
      }
    };
    fetchDriveToken();
  }, []);

  const handleOpenPicker = useCallback(() => {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID || !import.meta.env.VITE_GOOGLE_API_KEY) {
      setError('Missing Google configuration. Please set VITE_GOOGLE_API_KEY and VITE_GOOGLE_CLIENT_ID.');
      return;
    }

    openPicker({
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      developerKey: import.meta.env.VITE_GOOGLE_API_KEY,
      viewId: 'DOCS_VIDEOS',
      // Allow selecting videos and common audio MIME types via viewMimeTypes
      viewMimeTypes: 'video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska,audio/mpeg,audio/wav,audio/ogg,audio/m4a',
      setOrigin: window.location.origin,
      multiselect: true,
      supportDrives: true,
      token: driveToken || undefined, // Pass stored token to skip re-auth if available
      customScopes: ['https://www.googleapis.com/auth/drive.readonly'],
      callbackFunction: (data) => {
        if (!data) return;
        if (data.action === 'cancel' || data.action === 'CANCEL') {
          setShowPicker(false);
          return;
        }
        const docs = Array.isArray(data.docs) ? data.docs : [data];
        if (docs.length > 0) {
          setSelectedFiles(docs);
          setError('');
        }
      },
    });
  }, [openPicker, driveToken]);

  /**
   * Upload selected Google Drive files to backend
   */
  const handleUploadGoogleFiles = async () => {
    if (selectedFiles.length === 0) {
      setError('No files selected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const uploadPromises = selectedFiles.map((file) =>
        axiosInstance.post(
          '/api/v1/audio/google-drive',
          {
            fileId: file.id,
            fileName: file.name,
            mimeType: file.mimeType || 'video/unknown',
            size: file.sizeBytes || 0,
            meetingDate: meetingDate || new Date().toISOString().split('T')[0],
          },
          {
            timeout: 300000, // 5 minute timeout to allow for AssemblyAI polling
          }
        )
      );

      const results = await Promise.allSettled(uploadPromises);

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      // Collect the interview data from successful uploads
      const processedInterviews = [];
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const responseData = result.value.data?.data?.data;
          if (responseData?.interview) {
            processedInterviews.push({
              file: responseData.interview,
              fileName: responseData.interview.fileName,
            });
          }
        }
      });

      if (successful > 0 && processedInterviews.length > 0) {
        // Pass each processed interview to parent component
        processedInterviews.forEach(interview => {
          onFilesSelected(interview);
        });
        
        setSelectedFiles([]);
        setShowPicker(false);
        
        if (failed === 0) {
          setError('');
        } else {
          setError(`⚠️ Uploaded ${successful} file(s), ${failed} failed. Check console for details.`);
        }
      } else if (successful > 0 && processedInterviews.length === 0) {
        // Uploads succeeded but response format was unexpected
        setError('❌ Upload successful but response format invalid. Check console logs.');
      } else {
        throw new Error('All uploads failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to upload files from Google Drive';
      setError(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-100 h-12 w-12 rounded-2xl flex items-center justify-center">
          <SparklesIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900">Google Drive Upload</h3>
          <p className="text-sm text-gray-500">Select video files directly from your Google Drive</p>
        </div>
      </div>

      <div className="space-y-4">
        {selectedFiles.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-900">{selectedFiles.length} file(s) selected</p>
              <button
                onClick={() => setSelectedFiles([])}
                disabled={loading}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Clear
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-green-900 truncate">{file.name}</p>
                    <p className="text-xs text-green-700 mt-0.5">
                      {(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={handleOpenPicker}
            className="w-full px-6 py-4 bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-300 rounded-2xl transition-colors flex items-center justify-center space-x-2 text-blue-700 font-bold"
          >
            <CloudArrowUpIcon className="h-6 w-6" />
            <span>Browse Google Drive</span>
          </button>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedFiles([])}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadGoogleFiles}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Processing ({uploadProgress}/{selectedFiles.length})...</span>
                </>
              ) : (
                <span>Upload & Process All</span>
              )}
            </button>
          </div>
        )}
      </div>
      {/* )} */}
    </div>
  );
};

export default GoogleDrivePicker;
