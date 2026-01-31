import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';
import {
  DocumentTextIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Transcripts = () => {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    fetchTranscripts();
  }, []);

  const fetchTranscripts = async (page = 1) => {
    try {
      const response = await axiosInstance.get(`/api/v1/transcripts?page=${page}&limit=10`);
      setTranscripts(response.data.data?.transcripts || []);
      setPagination(response.data.data?.pagination || {});
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      setLoading(false);
    }
  };

  const fetchTranscriptDetails = async (id) => {
    try {
      const response = await axiosInstance.get(`/api/v1/transcripts/${id}`);
      setSelectedTranscript(response.data.data);
    } catch (error) {
      console.error('Error fetching transcript details:', error);
    }
  };

  const getStatusIcon = (status) => {
    return status === 'completed'
      ? <CheckCircleIcon className="h-5 w-5 text-green-500" />
      : <ClockIcon className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusColor = (status) => {
    return status === 'completed'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const [selectedDate, setSelectedDate] = useState('');

  // ... (fetchTranscripts logic remains, possibly adding date filter if backend supported, but for now just UI)

  const filteredTranscripts = selectedDate
    ? transcripts.filter(t => new Date(t.createdAt).toISOString().split('T')[0] === selectedDate)
    : transcripts;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recent Activities</h1>
          <p className="mt-2 text-gray-600">View your communication history and analysis</p>
        </div>
        <div className="mt-4 md:mt-0">
          <label className="block text-sm font-medium text-gray-700 mr-2">History Search</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>
      </div>

      {filteredTranscripts.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No records found</h3>
          <p className="mt-1 text-sm text-gray-500">Upload a file or adjust your search.</p>
        </div>
      ) : (
        <>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredTranscripts.map((transcript) => (
                <li key={transcript._id}>
                  <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getStatusIcon(transcript.status)}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {transcript.fileName}
                          </p>
                          <span className={`ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${getStatusColor(transcript.status)}`}>
                            {transcript.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {new Date(transcript.createdAt).toLocaleDateString()} at {new Date(transcript.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => fetchTranscriptDetails(transcript._id)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        Analysis
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Pagination (Note: only works for full list currently if filtered locally) */}
          {!selectedDate && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => fetchTranscripts(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchTranscripts(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      {selectedTranscript && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedTranscript.fileName}</h3>
                <p className="text-sm text-gray-500">{new Date(selectedTranscript.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedTranscript(null)}
                className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm hover:shadow transition-all"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Summary Section */}
              {selectedTranscript.notes?.summary && (
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Executive Summary</h4>
                  <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-xl border border-blue-100">
                    {selectedTranscript.notes.summary}
                  </p>
                </div>
              )}

              {/* Analytics Grid */}
              {selectedTranscript.analytics && (
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Communication Analysis</h4>

                  {/* Scores */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <ScoreBadge label="Fluency" value={selectedTranscript.analytics.fluencyScore} color="blue" />
                    <ScoreBadge label="Confidence" value={selectedTranscript.analytics.confidenceScore} color="green" />
                    <ScoreBadge label="Clarity" value={selectedTranscript.analytics.clarityScore} color="purple" />
                    <ScoreBadge label="Overall" value={selectedTranscript.analytics.overallScore} color="indigo" />
                  </div>

                  {/* Insights */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                      <h4 className="text-red-800 font-bold text-sm mb-2">Weak Areas</h4>
                      <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                        {selectedTranscript.analytics.weakAreas?.map((area, i) => <li key={i}>{area}</li>) || <li>No specific weaknesses detected</li>}
                      </ul>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <h4 className="text-green-800 font-bold text-sm mb-2">Strengths</h4>
                      <ul className="list-disc list-inside text-xs text-green-700 space-y-1">
                        {selectedTranscript.analytics.strengths?.map((area, i) => <li key={i}>{area}</li>) || <li>No specific strengths detected</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ScoreBadge = ({ label, value, color }) => (
  <div className={`text-center p-3 rounded-xl bg-white border border-gray-100 shadow-sm`}>
    <div className="text-2xl font-black text-gray-900">{value || '-'}<span className="text-xs text-gray-400 font-normal">/10</span></div>
    <div className={`text-[10px] font-bold uppercase tracking-wider text-${color}-600`}>{label}</div>
  </div>
);

export default Transcripts;