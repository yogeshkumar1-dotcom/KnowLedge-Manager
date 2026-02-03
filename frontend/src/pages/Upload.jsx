import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";
import { useAuth } from "../contexts/AuthContext";
import {
  CloudArrowUpIcon,
  DocumentIcon,
  CalendarIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  SparklesIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import CommunicationAnalytics from "../components/CommunicationAnalytics";
import ActivitiesList from "../components/ActivitiesList";

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const resultsRef = useRef(null);

  const getFileNameWithoutExtension = (fileName) => {
    if (!fileName) return "Unknown File";
    return fileName.replace(/\.[^/.]+$/, "");
  };

  const getTruncatedFileName = (fileName) => {
    if (!fileName) return "Unknown File";
    const lastDot = fileName.lastIndexOf(".");
    if (lastDot === -1) return fileName;
    const name = fileName.substring(0, lastDot);
    const ext = fileName.substring(lastDot);
    if (name.length <= 30) return fileName;
    const truncated = name.substring(0, 40) + "..." + ext;
    return truncated;
  };

  useEffect(() => {
    if (results.length > 0) {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [results]);

  // Fetch the most recent completed transcript on component mount
  useEffect(() => {
    const fetchLatestAnalysis = async () => {
      try {
        const response = await axiosInstance.get(
          "/api/v1/transcripts?limit=10",
        );
        const transcripts = response.data.data?.transcripts || [];
        const latestCompleted = transcripts.find(
          (t) => t.status === "completed" && t.analytics,
        );
        if (latestCompleted) {
          setResults([{ transcript: latestCompleted }]);
          setSelectedResult({ transcript: latestCompleted });
        }
      } catch (error) {
        console.error("Error fetching latest analysis:", error);
      }
    };

    fetchLatestAnalysis();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFileType(droppedFile)) {
        setFiles((prev) => [...prev, droppedFile]);
        setMessage("");
      } else setMessage("Please select a valid video or audio file.");
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const isValidFileType = (file) => {
    const validTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp4",
      "audio/m4a",
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
    ];
    const validExtensions = [
      ".mp3",
      ".wav",
      ".ogg",
      ".m4a",
      ".mp4",
      ".mov",
      ".avi",
    ];

    return (
      validTypes.includes(file.type) ||
      validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    );
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      setMessage("Please select files first");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setMessage("");

    const formData = new FormData();
    if (files.length === 1) {
      formData.append("file", files[0]);
    } else {
      files.forEach((file) => {
        formData.append("files", file);
      });
    }
    formData.append("userId", user?._id || user?.id || "");
    formData.append("meetingDate", meetingDate);

    try {
      const endpoint =
        files.length === 1 ? "/api/v1/audio/file" : "/api/v1/audio/files";
      const response = await axiosInstance.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data && response.data.data) {
        // Handle single file response
        if (response.data.data.interview) {
          const interview = response.data.data.interview;
          const transformedData = {
            transcript: {
              fileName: interview.fileName || "Unknown File",
              candidateName: interview.candidateName || "Unknown Candidate",
              status: interview.status || "pending",
              notes: {
                summary:
                  interview.summary?.verdict ||
                  "Analysis completed successfully",
              },
              analytics: {
                overallCommunicationScore:
                  interview.overall_communication_score,
                overallScore: interview.overall_communication_score,
                fluencyScore: interview.language_quality?.fluency_score,
                confidenceScore:
                  interview.communication_skills?.confidence_score,
                clarityScore: interview.language_quality?.clarity_score,
                clarityPronunciation: interview.language_quality?.clarity_score,
                speechRate: interview.speech_metrics?.words_per_minute
                  ? Math.min(interview.speech_metrics.words_per_minute / 20, 10)
                  : 7,
                volumeConsistency:
                  interview.communication_skills?.confidence_score,
                voiceModulation:
                  interview.communication_skills?.engagement_score,
                flow: interview.language_quality?.fluency_score,
                vocabularyRichness: interview.language_quality?.grammar_score,
                grammarAccuracy: interview.language_quality?.grammar_score,
                coherence: interview.communication_skills?.structure_score,
                relevance: interview.communication_skills?.relevance_score,
                clarityOfMessage:
                  interview.communication_skills?.structure_score,
                confidenceLevel:
                  interview.communication_skills?.confidence_score,
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
              },
            },
          };
          setResults([transformedData]);
          setSelectedResult(transformedData);
        }
        // Handle multiple files response
        else if (response.data.data.results) {
          const transformedResults = response.data.data.results
            .filter((result) => result.status === "success" && result.interview)
            .map((result) => {
              const interview = result.interview;
              return {
                transcript: {
                  fileName: interview.fileName || "Unknown File",
                  candidateName: interview.candidateName || "Unknown Candidate",
                  status: interview.status || "pending",
                  notes: {
                    summary:
                      interview.summary?.verdict || "Analysis in progress",
                  },
                  analytics: {
                    overallCommunicationScore:
                      interview.overall_communication_score,
                    overallScore: interview.overall_communication_score,
                    fluencyScore: interview.language_quality?.fluency_score,
                    confidenceScore:
                      interview.communication_skills?.confidence_score,
                    clarityScore: interview.language_quality?.clarity_score,
                    clarityPronunciation:
                      interview.language_quality?.clarity_score,
                    speechRate: interview.speech_metrics?.words_per_minute
                      ? Math.min(
                          interview.speech_metrics.words_per_minute / 20,
                          10,
                        )
                      : 7,
                    volumeConsistency:
                      interview.communication_skills?.confidence_score,
                    voiceModulation:
                      interview.communication_skills?.engagement_score,
                    flow: interview.language_quality?.fluency_score,
                    vocabularyRichness:
                      interview.language_quality?.grammar_score,
                    grammarAccuracy: interview.language_quality?.grammar_score,
                    coherence: interview.communication_skills?.structure_score,
                    relevance: interview.communication_skills?.relevance_score,
                    clarityOfMessage:
                      interview.communication_skills?.structure_score,
                    confidenceLevel:
                      interview.communication_skills?.confidence_score,
                    engagement:
                      interview.communication_skills?.engagement_score,
                    empathyWarmth:
                      interview.communication_skills?.engagement_score,
                    emotionalTone: "Professional",
                    strengths:
                      interview.coaching_feedback?.what_went_well ||
                      interview.summary?.strengths ||
                      [],
                    weakAreas:
                      interview.coaching_feedback?.what_to_improve ||
                      interview.summary?.primary_issues ||
                      [],
                  },
                },
              };
            });
          setResults(transformedResults);
          if (transformedResults.length > 0) {
            setSelectedResult(transformedResults[0]);
          }
        } else {
          throw new Error("No interview data received");
        }

        setRefreshTrigger((prev) => prev + 1);
        setMessage("✅ Processing completed successfully!");
        setFiles([]);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("❌ Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Upload Session
          </h1>
          <p className="mt-2 text-lg text-gray-500 font-medium italic">
            Analyze your communication skills with AI
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3">
          <InformationCircleIcon className="h-6 w-6 text-blue-500" />
          <span className="text-sm font-bold text-gray-600">
            Supports Video & Audio
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest pl-1">
                  Session Date
                </label>
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
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-4 border-dashed rounded-3xl p-12 transition-all duration-300 group
                ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-blue-200 hover:bg-gray-50"}`}
            >
              <div className="text-center space-y-4">
                <div className="bg-blue-100 h-16 w-16 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <CloudArrowUpIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <label className="cursor-pointer">
                    <span className="text-xl font-black text-gray-900 block">
                      Drag & Drop File
                    </span>
                    <span className="text-sm text-gray-500 font-medium">
                      or click here to browse files
                    </span>
                    <input
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={handleFileChange}
                      accept="audio/*,video/*"
                    />
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    Supported formats: MP3, WAV, OGG, M4A, MP4, MOV, AVI (Max
                    1024MB)
                  </p>
                </div>
                <div className="flex justify-center space-x-2">
                  {["MP4", "MP3", "WAV", "MOV"].map((ext) => (
                    <span
                      key={ext}
                      className="px-3 py-1 bg-white text-[10px] font-black text-gray-400 rounded-lg border border-gray-100"
                    >
                      {ext}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 bg-blue-50 rounded-2xl border border-blue-100"
                  >
                    <DocumentIcon className="h-8 w-8 text-blue-500 mr-3" />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">
                        {getTruncatedFileName(file.name)}
                      </p>
                      <p className="text-xs text-blue-600 font-bold">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setFiles(files.filter((_, i) => i !== index))
                      }
                      className="p-2 hover:bg-blue-100 rounded-full text-blue-400"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploading && (
              <div className="space-y-3 animate-pulse">
                <div className="flex justify-between text-sm font-black text-blue-600 uppercase tracking-widest">
                  <span>Processing Session...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-3 w-full bg-blue-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {message && (
              <div
                className={`p-4 rounded-2xl font-bold text-sm ${message.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
              >
                {message}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
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
          {results.length > 0 && (
            <div ref={resultsRef} className="space-y-8 animate-fadeIn">
              {results.length === 1 ? (
                <>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-1 inline-block w-8 bg-blue-600 rounded-full"></div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        AI Summary for{" "}
                        {results[0].transcript?.candidateName || "Candidate"}
                      </h2>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 italic text-gray-700 leading-relaxed">
                      "
                      {results[0].transcript?.notes?.summary ||
                        "No summary available."}
                      "
                    </div>
                  </div>

                  <div
                    className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
                    style={{ width: "1000px" }}
                  >
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="h-1 inline-block w-8 bg-blue-600 rounded-full"></div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        Communication Metrics
                      </h2>
                    </div>
                    <CommunicationAnalytics data={results[0].transcript} />
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-1 inline-block w-8 bg-blue-600 rounded-full"></div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        Analysis Results
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-sm font-black text-gray-600 uppercase tracking-widest">
                              Person Name
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-black text-gray-600 uppercase tracking-widest">
                              Overall Score
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-black text-gray-600 uppercase tracking-widest">
                              View Details
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((result, index) => (
                            <tr
                              key={index}
                              className="border-t border-gray-100 hover:bg-gray-50"
                            >
                              <td className="px-4 py-3 text-gray-900 font-bold">
                                {result.transcript?.candidateName ||
                                  "Candidate"}
                              </td>
                              <td className="px-4 py-3 text-gray-900 font-bold">
                                {result.transcript?.analytics?.overallScore ||
                                  "N/A"}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => setSelectedResult(result)}
                                  className="text-blue-600 hover:text-blue-800 font-bold underline"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {selectedResult && (
                    <>
                      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center space-x-3">
                          <div className="h-1 inline-block w-8 bg-blue-600 rounded-full"></div>
                          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                            AI Summary for{" "}
                            {selectedResult.transcript?.candidateName ||
                              "Candidate"}
                          </h2>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 italic text-gray-700 leading-relaxed">
                          "
                          {selectedResult.transcript?.notes?.summary ||
                            "No summary available."}
                          "
                        </div>
                      </div>

                      <div
                        className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
                        style={{ width: "1000px" }}
                      >
                        <div className="flex items-center space-x-3 mb-8">
                          <div className="h-1 inline-block w-8 bg-blue-600 rounded-full"></div>
                          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                            Communication Metrics
                          </h2>
                        </div>
                        <CommunicationAnalytics
                          data={selectedResult.transcript}
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Side History */}
        <div className="space-y-6" style={{ height: "990px" }}>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-gray-900 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
                Recent History
              </h2>
            </div>
            <ActivitiesList
              onSelectTranscript={(t) => {
                setResults([{ transcript: t }]);
                setSelectedResult({ transcript: t });
              }}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
