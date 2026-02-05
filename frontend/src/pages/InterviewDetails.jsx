import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  ChartBarIcon,
  DocumentTextIcon,
  MicrophoneIcon,
  ChatBubbleBottomCenterTextIcon,
  FaceSmileIcon,
  BoltIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import CommunicationAnalytics from "../components/CommunicationAnalytics";

const InterviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await axiosInstance.get(`/api/v1/interviews/${id}`);
        setInterview(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching interview:", error);
        setLoading(false);
      }
    };

    if (id) {
      fetchInterview();
    }
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!interview || interview.status !== 'scored') return;
    
    setDownloadingPDF(true);
    try {
      const response = await axiosInstance.get(`/api/v1/interviews/${id}/pdf`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Interview_Report_${interview.candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF report. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen -mt-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Interview Not Found
        </h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Transform interview data for CommunicationAnalytics
  const transformedData = {
    analytics:
      interview.status === "scored"
        ? {
            overallCommunicationScore: interview.overall_communication_score,
            overallScore: interview.overall_communication_score,
            fluencyScore: interview.language_quality?.fluency_score,
            confidenceScore: interview.communication_skills?.confidence_score,
            clarityScore: interview.language_quality?.clarity_score,
            clarityPronunciation: interview.language_quality?.clarity_score,
            speechRate: interview.speech_metrics?.words_per_minute
              ? Math.min(interview.speech_metrics.words_per_minute / 20, 10)
              : 7,
            volumeConsistency: interview.communication_skills?.confidence_score,
            voiceModulation: interview.communication_skills?.engagement_score,
            flow: interview.language_quality?.fluency_score,
            vocabularyRichness: interview.language_quality?.grammar_score,
            grammarAccuracy: interview.language_quality?.grammar_score,
            coherence: interview.communication_skills?.structure_score,
            relevance: interview.communication_skills?.relevance_score,
            clarityOfMessage: interview.communication_skills?.structure_score,
            confidenceLevel: interview.communication_skills?.confidence_score,
            engagement: interview.communication_skills?.engagement_score,
            empathyWarmth: interview.communication_skills?.engagement_score,
            emotionalTone: "Professional",
            strengths:
              interview.coaching_feedback?.what_went_well ||
              interview.summary?.strengths ||
              [],
            weakAreas:
              interview.coaching_feedback?.what_to_improve ||
              interview.summary?.primary_issues ||
              [],
          }
        : null,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>
        
        {interview?.status === 'scored' && (
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>{downloadingPDF ? 'Generating PDF...' : 'Download PDF Report'}</span>
          </button>
        )}
      </div>

      {/* Interview Info */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">
              {interview.candidateName}
            </h1>
            <div className="flex items-center space-x-6 text-gray-600">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>
                  {new Date(interview.interviewDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5" />
                <span>{interview.fileName}</span>
              </div>
            </div>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-bold ${
              interview.status === "scored"
                ? "bg-green-100 text-green-700"
                : interview.status === "processing"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
            }`}
          >
            {interview.status}
          </div>
        </div>

        {interview.status === "scored" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <ScoreCard
              title="Fluency Score"
              score={transformedData.analytics?.fluencyScore}
              color="bg-blue-500"
              icon={BoltIcon}
            />
            <ScoreCard
              title="Confidence Score"
              score={transformedData.analytics?.confidenceScore}
              color="bg-green-500"
              icon={MicrophoneIcon}
            />
            <ScoreCard
              title="Clarity Score"
              score={transformedData.analytics?.clarityScore}
              color="bg-purple-500"
              icon={ChatBubbleBottomCenterTextIcon}
            />
            <ScoreCard
              title="Overall Score"
              score={transformedData.analytics?.overallScore}
              color="bg-indigo-600"
              icon={FaceSmileIcon}
              isMain
            />
          </div>
        )}
      </div>

      {/* Summary */}
      {interview.summary?.verdict && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 mb-4">AI Summary</h2>
          <div className="bg-gray-50 p-6 rounded-2xl italic text-gray-700 leading-relaxed">
            "{interview.summary.verdict}"
          </div>
        </div>
      )}

      {/* Top Level Scores */}

      {/* Communication Analytics */}
      {interview.status === "scored" && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 mb-8">
            Communication Metrics
          </h2>
          <CommunicationAnalytics data={transformedData} />
        </div>
      )}


      {/* Coaching Feedback */}
      {interview.coaching_feedback && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-green-700 mb-4">
              What Went Well
            </h3>
            <ul className="space-y-2">
              {interview.coaching_feedback.what_went_well?.map(
                (item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-amber-700 mb-4">
              Areas to Improve
            </h3>
            <ul className="space-y-2">
              {interview.coaching_feedback.what_to_improve?.map(
                (item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

const ScoreCard = ({ title, score, color, icon: Icon, isMain }) => (
  <div
    className={`rounded-xl p-6 text-white shadow-lg ${color} ${isMain ? "transform scale-105 ring-4 ring-white/30" : ""}`}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-blue-100 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-4xl font-extrabold">
          {score || 0}
          <span className="text-lg opacity-60">/10</span>
        </h3>
      </div>
      <div className="bg-white/20 p-2 rounded-lg">
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const MetricBar = ({ label, value }) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className="text-sm font-bold text-gray-900">{value || 0}/10</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full ${
          (value || 0) >= 8
            ? "bg-green-500"
            : (value || 0) >= 5
              ? "bg-yellow-500"
              : "bg-red-500"
        }`}
        style={{ width: `${(value || 0) * 10}%` }}
      ></div>
    </div>
  </div>
);

export default InterviewDetails;
