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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transcripts</h1>
        <p className="mt-2 text-gray-600">View and manage your audio transcriptions</p>
      </div>

      {transcripts.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No transcripts</h3>
          <p className="mt-1 text-sm text-gray-500">Upload an audio file to create your first transcript.</p>
        </div>
      ) : (
        <>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {transcripts.map((transcript) => (
                <li key={transcript._id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getStatusIcon(transcript.status)}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {transcript.fileName}
                          </p>
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transcript.status)}`}>
                            {transcript.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(transcript.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => fetchTranscriptDetails(transcript._id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
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

      {/* Transcript Details Modal */}
      {selectedTranscript && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedTranscript.fileName}
                </h3>
                <button
                  onClick={() => setSelectedTranscript(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedTranscript.notes && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Summary</h4>
                  <p className="text-sm text-gray-700 mb-4">{selectedTranscript.notes.summary}</p>

                  {selectedTranscript.notes.keyPoints && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-900 mb-2">Key Points</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {selectedTranscript.notes.keyPoints.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedTranscript.analytics && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">AI Analytics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Consistency', value: selectedTranscript.analytics.consistency, color: 'text-green-600' },
                          { label: 'Replicacy', value: selectedTranscript.analytics.replicacy, color: 'text-blue-600' },
                          { label: 'Logical Thinking', value: selectedTranscript.analytics.logicalThinking, color: 'text-purple-600' },
                          { label: 'Relatable Answers', value: selectedTranscript.analytics.relatableAnswers, color: 'text-orange-600' },
                        ].map((item, idx) => (
                          <div key={idx} className="bg-gray-50 p-2 rounded border border-gray-100 text-center">
                            <p className="text-[10px] text-gray-500 mb-1">{item.label}</p>
                            <p className={`text-lg font-bold ${item.color}`}>{item.value}/10</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedTranscript.transcript && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Full Transcript</h4>
                  <div className="max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedTranscript.transcript}
                    </p>
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

export default Transcripts;