import { useState, useEffect } from "react";
import {
  SpeakerWaveIcon,
  SparklesIcon,
  ExclamationCircleIcon,
  CheckBadgeIcon,
  MicrophoneIcon,
  ChatBubbleBottomCenterTextIcon,
  FaceSmileIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";

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

const CommunicationAnalytics = ({ data }) => {
  if (!data || !data.analytics) {
    return (
      <div className="flex items-center justify-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <div className="text-center">
          <SpeakerWaveIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-500">
            No analytics data available for this recording.
          </p>
        </div>
      </div>
    );
  }

  const { analytics } = data;

  const overallScore =
    analytics.overallCommunicationScore || analytics.overallScore || 0;
  const getScoreZone = (score) => {
    const value = parseFloat(score);
    if (value >= 8)
      return {
        label: "Green Zone",
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
        message: "Congratulations! Excellent Performance.",
      };
    if (value >= 6)
      return {
        label: "Yellow Zone",
        color: "text-yellow-600",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        message: "Good progress. Keep improving.",
      };
    return {
      label: "Red Zone",
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      message: "Needs significant improvement.",
    };
  };
  const scoreZone = getScoreZone(overallScore);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Score Zone Banner */}
      <div className={`p-6 rounded-2xl border-2 ${scoreZone.bg} ${scoreZone.border}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-xl font-bold ${scoreZone.color}`}>
              {scoreZone.label} - {overallScore}/10
            </h3>
            <p className={`text-sm ${scoreZone.color} mt-1`}>
              {scoreZone.message}
            </p>
          </div>
          <div className={`text-3xl font-black ${scoreZone.color}`}>
            {overallScore}
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Speech Mechanics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <MicrophoneIcon className="w-5 h-5 mr-2 text-blue-500" />
              Speech Mechanics
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <MetricBar
              label="Clarity"
              value={analytics.clarityPronunciation}
            />
            <MetricBar
              label="Volume"
              value={analytics.volumeConsistency}
            />
            <MetricBar
              label="Modulation"
              value={analytics.voiceModulation}
            />
            <MetricBar
              label="Flow"
              value={analytics.flow}
            />
          </div>
        </div>

        {/* Language Quality */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <ChatBubbleBottomCenterTextIcon className="w-5 h-5 mr-2 text-purple-500" />
              Language Quality
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <MetricBar
              label="Vocabulary"
              value={analytics.vocabularyRichness}
            />
            <MetricBar
              label="Grammar"
              value={analytics.grammarAccuracy}
            />
            <MetricBar
              label="Coherence"
              value={analytics.coherence}
            />
            <MetricBar
              label="Relevance"
              value={analytics.relevance}
            />
          </div>
        </div>

        {/* Emotional Intelligence */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FaceSmileIcon className="w-5 h-5 mr-2 text-yellow-500" />
              Emotional Intelligence
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <MetricBar
              label="Confidence"
              value={analytics.confidenceLevel}
            />
            <MetricBar
              label="Engagement"
              value={analytics.engagement}
            />
            <MetricBar
              label="Empathy"
              value={analytics.empathyWarmth}
            />
          </div>
        </div>

        {/* Fluency */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <BoltIcon className="w-5 h-5 mr-2 text-green-500" /> Fluency
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <MetricBar
              label="Repetition Control"
              value={analytics.stutteringRepetition || 7}
            />
            <MetricBar
              label="Sentence Completion"
              value={analytics.sentenceCompletion || 7}
            />
            <MetricBar
              label="Flow"
              value={analytics.flow}
            />
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <SparklesIcon className="h-6 w-6 text-yellow-500 mr-2" />
          <h3 className="text-lg font-bold text-gray-900">AI Analysis</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center mb-3 text-green-600">
              <CheckBadgeIcon className="h-5 w-5 mr-2" />
              <span className="font-bold text-sm uppercase tracking-wide">
                Key Strengths
              </span>
            </div>
            <ul className="space-y-2">
              {(analytics.strengths || []).length > 0 ? (
                analytics.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start text-sm text-gray-700 bg-green-50 p-2 rounded-lg border border-green-100"
                  >
                    <span className="text-green-500 mr-2">•</span>
                    {s}
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 italic">
                  No specific strengths identified.
                </li>
              )}
            </ul>
          </div>
          <div>
            <div className="flex items-center mb-3 text-amber-600">
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              <span className="font-bold text-sm uppercase tracking-wide">
                Weak Areas
              </span>
            </div>
            <ul className="space-y-2">
              {(analytics.weakAreas || []).length > 0 ? (
                analytics.weakAreas.map((w, i) => (
                  <li
                    key={i}
                    className="flex items-start text-sm text-gray-700 bg-amber-50 p-2 rounded-lg border border-amber-100"
                  >
                    <span className="text-amber-500 mr-2">•</span>
                    {w}
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 italic">
                  No specific weak areas identified.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationAnalytics;
