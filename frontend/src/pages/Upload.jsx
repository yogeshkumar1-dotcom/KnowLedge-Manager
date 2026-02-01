import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  CalendarIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import CommunicationAnalytics from '../components/CommunicationAnalytics';
import ActivitiesList from '../components/ActivitiesList';

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState(null);
  const resultsRef = useRef(null);

  const getFileNameWithoutExtension = (fileName) => {
    if (!fileName) return 'Unknown File';
    return fileName.replace(/\.[^/.]+$/, '');
  };

  useEffect(() => {
    if (result) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  // Fetch the most recent completed transcript on component mount
  useEffect(() => {
    const fetchLatestAnalysis = async () => {
      try {
        const response = await axiosInstance.get('/api/v1/transcripts?limit=10');
        const transcripts = response.data.data?.transcripts || [];
        const latestCompleted = transcripts.find(t => t.status === 'completed' && t.analytics);
        if (latestCompleted) {
          setResult({ transcript: latestCompleted });
        }
      } catch (error) {
        console.error('Error fetching latest analysis:', error);
      }
    };

    fetchLatestAnalysis();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFileType(droppedFile)) { setFile(droppedFile); setMessage(''); }
      else setMessage('Please select a valid video or audio file.');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFileType(selectedFile)) { setFile(selectedFile); setMessage(''); }
      else setMessage('Please select a valid video or audio file.');
    }
  };

  const isValidFileType = (file) => {
    const validTypes = [
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/m4a',
      'video/mp4', 'video/quicktime', 'video/x-msvideo'
    ];
    const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.mp4', '.mov', '.avi'];

    return validTypes.includes(file.type) ||
      validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const handleUpload = async () => {
    if (!file) { setMessage('Please select a file first'); return; }
    setUploading(true); setUploadProgress(0); setMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user?._id || user?.id || '');
    formData.append('meetingDate', meetingDate);

    try {
      const response = await axiosInstance.post('/api/v1/upload/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data && response.data.data) {
        setResult(response.data.data);
        setMessage('✅ Processing completed successfully!');
        setFile(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('❌ Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Upload Session</h1>
          <p className="mt-2 text-lg text-gray-500 font-medium italic">Analyze your communication skills with AI</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3">
          <InformationCircleIcon className="h-6 w-6 text-blue-500" />
          <span className="text-sm font-bold text-gray-600">Supports Video & Audio</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest pl-1">Session Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-gray-700"
                  />
                </div>
              </div>
            </div>

            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              className={`relative border-4 border-dashed rounded-3xl p-12 transition-all duration-300 group
                ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}
            >
              <div className="text-center space-y-4">
                <div className="bg-blue-100 h-16 w-16 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <CloudArrowUpIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <label className="cursor-pointer">
                    <span className="text-xl font-black text-gray-900 block">Drag & Drop File</span>
                    <span className="text-sm text-gray-500 font-medium">or click here to browse files</span>
                    <input type="file" className="sr-only" onChange={handleFileChange} accept="audio/*,video/*" />
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    Supported formats: MP3, WAV, OGG, M4A, MP4, MOV, AVI (Max 500MB)
                  </p>
                </div>
                <div className="flex justify-center space-x-2">
                  {['MP4', 'MP3', 'WAV', 'MOV'].map(ext => (
                    <span key={ext} className="px-3 py-1 bg-white text-[10px] font-black text-gray-400 rounded-lg border border-gray-100">{ext}</span>
                  ))}
                </div>
              </div>
            </div>

            {file && (
              <div className="flex items-center p-4 bg-blue-50 rounded-2xl border border-blue-100 animate-slideUp">
                <DocumentIcon className="h-10 w-10 text-blue-500 mr-4" />
                <div className="flex-1">
                  <p className="font-bold text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-blue-600 font-bold">Ready to analyze • {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <button onClick={() => setFile(null)} className="p-2 hover:bg-blue-100 rounded-full text-blue-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {uploading && (
              <div className="space-y-3 animate-pulse">
                <div className="flex justify-between text-sm font-black text-blue-600 uppercase tracking-widest">
                  <span>Processing Session...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-3 w-full bg-blue-50 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {message && (
              <div className={`p-4 rounded-2xl font-bold text-sm ${message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-3"
            >
              {uploading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                  <span>AI Analyzing...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-6 w-6" />
                  <span>Start Analysis</span>
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          {result && (
            <div ref={resultsRef} className="space-y-8 animate-fadeIn">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="h-1 inline-block w-8 bg-blue-600 rounded-full"></div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    AI Summary for {getFileNameWithoutExtension(result.transcript?.fileName)}
                  </h2>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 italic text-gray-700 leading-relaxed">
                  "{result.transcript?.notes?.summary || 'No summary available.'}"
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"style={{width:'1000px'}}>
                <div className="flex items-center space-x-3 mb-8">
                  <div className="h-1 inline-block w-8 bg-blue-600 rounded-full"></div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Communication Metrics</h2>
                </div>
                <CommunicationAnalytics data={result.transcript} />
              </div>
            </div>
          )}
        </div>

        {/* Side History */}
        <div className="space-y-6" style={{height:'990px'}}>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-gray-900 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
                Recent History
              </h2>
            </div>
            <ActivitiesList onSelectTranscript={(t) => setResult({ transcript: t })} />
          </div>

          <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Want better scores?</h3>
              <p className="text-indigo-100 text-sm mb-4">Our AI coach suggests focusing on voice modulation for your next session.</p>
              <button className="text-xs font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-lg backdrop-blur-md">View Guide</button>
            </div>
            <SparklesIcon className="absolute -right-4 -bottom-4 h-32 w-32 text-white/10 group-hover:scale-110 transition-transform duration-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
