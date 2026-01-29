import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { CloudArrowUpIcon, DocumentIcon, CalendarIcon } from '@heroicons/react/24/outline';

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [transcript, setTranscript] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFileType(droppedFile)) {
        setFile(droppedFile);
        setMessage('');
      } else {
        setMessage('Please select a valid audio file (MP3, WAV, OGG, M4A)');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFileType(selectedFile)) {
        setFile(selectedFile);
        setMessage('');
      } else {
        setMessage('Please select a valid audio file (MP3, WAV, OGG, M4A)');
      }
    }
  };

  const isValidFileType = (file) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/m4a'];
    const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];

    return validTypes.includes(file.type) ||
      validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user?._id || user?.id || '');
    formData.append('meetingDate', meetingDate);

    try {
      const response = await axiosInstance.post('/api/v1/upload/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      console.log('Upload response:', response);

      if (response.data && response.data.data) {
        setTranscript(response.data.data);
        setMessage('✅ File uploaded and processed successfully!');
        setFile(null);
        setUploadProgress(0);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('❌ Upload failed. Please try again.');
      setTranscript(null);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Audio</h1>
        <p className="mt-2 text-gray-600">Upload audio files to generate transcripts and extract tasks</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="meeting-date" className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                id="meeting-date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Pick the date when the meeting occurred</p>
          </div>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Drop files here or click to upload
                </span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".mp3,.wav,.ogg,.m4a,audio/*"
                  onChange={handleFileChange}
                />
              </label>
              <p className="mt-2 text-xs text-gray-500">
                Supported formats: MP3, WAV, OGG, M4A (Max 100MB)
              </p>
            </div>
          </div>
        </div>

        {file && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <DocumentIcon className="h-8 w-8 text-gray-400" />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="ml-3 text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Remove</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Uploading and processing...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {message && (
          <div className={`mt-4 p-3 rounded-md ${message.includes('✅')
            ? 'bg-green-50 text-green-800'
            : 'bg-red-50 text-red-800'
            }`}>
            {message}
          </div>
        )}

        {transcript && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Transcript Details</h3>

            {transcript.transcript && (
              <div className="mb-4">
                <h4 className="font-medium text-blue-800 mb-2">Transcript:</h4>
                <div className="bg-white p-3 rounded border border-blue-100 max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{transcript.transcript.transcriptText || transcript.transcript.notes?.summary || 'Transcript processing...'}</p>
                </div>
              </div>
            )}

            {transcript.transcript?.notes && (
              <div className="mb-4">
                <h4 className="font-medium text-blue-800 mb-2">Summary:</h4>
                <div className="bg-white p-3 rounded border border-blue-100">
                  <p className="text-sm text-gray-700">{transcript.transcript.notes.summary}</p>
                </div>
              </div>
            )}

            {transcript.transcript?.notes?.keyPoints && (
              <div className="mb-4">
                <h4 className="font-medium text-blue-800 mb-2">Key Points:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {Array.isArray(transcript.transcript.notes.keyPoints) && transcript.transcript.notes.keyPoints.map((point, idx) => (
                    <li key={idx} className="text-sm text-gray-700">{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {transcript.transcript?.analytics && (
              <div className="mb-4">
                <h4 className="font-medium text-blue-800 mb-3">AI Analytics:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Consistency', value: transcript.transcript.analytics.consistency, color: 'text-green-600' },
                    { label: 'Replicacy', value: transcript.transcript.analytics.replicacy, color: 'text-blue-600' },
                    { label: 'Logical Thinking', value: transcript.transcript.analytics.logicalThinking, color: 'text-purple-600' },
                    { label: 'Relatable Answers', value: transcript.transcript.analytics.relatableAnswers, color: 'text-orange-600' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-blue-100 text-center">
                      <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                      <p className={`text-xl font-bold ${item.color}`}>{item.value}/10</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {transcript.tasksData && (
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Generated Tasks: {transcript.tasksData.length}</h4>
                <p className="text-sm text-blue-700">✅ {transcript.tasksData.length} action items have been created and team members notified</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Processing...' : 'Upload and Process'}
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <h3 className="font-medium mb-2">What happens after upload:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Audio file is transcribed using AI</li>
            <li>Meeting notes and summary are generated</li>
            <li>Action items are extracted and assigned</li>
            <li>Email notifications are sent to assignees</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Upload;