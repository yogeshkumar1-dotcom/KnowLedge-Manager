import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';
import {
    ChartBarIcon,
    MicrophoneIcon,
    ChatBubbleBottomCenterTextIcon,
    FaceSmileIcon,
    BoltIcon
} from '@heroicons/react/24/outline';

const CommunicationDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [transcripts, setTranscripts] = useState([]);
    const [selectedTranscriptId, setSelectedTranscriptId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await axiosInstance.get('/api/v1/transcripts?limit=100'); // Fetch more transcripts for selection
            const transcriptsData = response.data.data?.transcripts || [];
            setTranscripts(transcriptsData);

            // Find the latest completed transcript with analytics
            const latestCompleted = transcriptsData.find(t => t.status === 'completed' && t.analytics);
            if (latestCompleted) {
                setSelectedTranscriptId(latestCompleted._id);
                setStats({
                    analytics: latestCompleted.analytics,
                    fileName: latestCompleted.fileName,
                    date: latestCompleted.createdAt
                });
            } else {
                setStats(null);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    };

    const handleTranscriptSelect = (transcriptId) => {
        const selected = transcripts.find(t => t._id === transcriptId);
        if (selected && selected.status === 'completed' && selected.analytics) {
            setSelectedTranscriptId(transcriptId);
            setStats({
                analytics: selected.analytics,
                fileName: selected.fileName,
                date: selected.createdAt
            });
            setIsDropdownOpen(false); // Close dropdown after selection
        }
    };

    if (loading) return <div className="p-8 text-center">Loading analytics...</div>;

    if (!stats) return (
        <div className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-700">No Analysis Available</h2>
            <p className="text-gray-500 mt-2">Upload a recording to see your communication metrics.</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-fadeIn pb-10">
            <div className="border-b border-gray-200 pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Communication Dashboard</h1>
                        <p className="mt-1 text-gray-600">
                            Analysis for: <span className="font-semibold">{stats.fileName}</span>
                            <span className="text-sm ml-2 text-gray-400">({new Date(stats.date).toLocaleDateString()})</span>
                        </p>
                    </div>
                    {/* Search Bar for Recordings */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setIsDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} // Delay to allow click on options
                            placeholder="Search recordings..."
                            className="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        {isDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-40 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                {transcripts
                                    .filter(t => t.status === 'completed' && t.analytics && 
                                        (t.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                         new Date(t.createdAt).toLocaleDateString().includes(searchTerm)))
                                    .map(transcript => (
                                        <div
                                            key={transcript._id}
                                            onClick={() => handleTranscriptSelect(transcript._id)}
                                            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${selectedTranscriptId === transcript._id ? 'bg-indigo-100 border border-indigo-300' : ''}`}
                                        >
                                            <div className="font-medium">{transcript.fileName}</div>
                                            <div className="text-sm text-gray-500">{new Date(transcript.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Level Scores */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <ScoreCard title="Fluency Score" score={stats.analytics.fluencyScore} color="bg-blue-500" icon={BoltIcon} />
                <ScoreCard title="Confidence Score" score={stats.analytics.confidenceScore} color="bg-green-500" icon={MicrophoneIcon} />
                <ScoreCard title="Clarity Score" score={stats.analytics.clarityScore} color="bg-purple-500" icon={ChatBubbleBottomCenterTextIcon} />
                <ScoreCard title="Overall Score" score={stats.analytics.overallScore} color="bg-indigo-600" icon={FaceSmileIcon} isMain />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Speech Mechanics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800 flex items-center">
                            <MicrophoneIcon className="w-5 h-5 mr-2 text-blue-500" /> Speech Mechanics
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <MetricBar label="Clarity & Pronunciation" value={stats.analytics.clarityPronunciation} />
                        <MetricBar label="Volume Consistency" value={stats.analytics.volumeConsistency} />
                        <MetricBar label="Voice Modulation" value={stats.analytics.voiceModulation} />
                        <MetricBar label="Pauses & Fillers" value={stats.analytics.pausesAndFillers} />
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-sm font-medium text-gray-600">Speech Rate</span>
                            <span className="text-lg font-bold text-gray-900">{stats.analytics.speechRate} <span className="text-xs text-gray-500 font-normal">WPM</span></span>
                        </div>
                    </div>
                </div>

                {/* Language Quality */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800 flex items-center">
                            <ChatBubbleBottomCenterTextIcon className="w-5 h-5 mr-2 text-purple-500" /> Language Quality
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <MetricBar label="Vocabulary Richness" value={stats.analytics.vocabularyRichness} />
                        <MetricBar label="Grammar Accuracy" value={stats.analytics.grammarAccuracy} />
                        <MetricBar label="Coherence" value={stats.analytics.coherence} />
                        <MetricBar label="Relevance" value={stats.analytics.relevance} />
                        <MetricBar label="Message Clarity" value={stats.analytics.messageClarity} />
                    </div>
                </div>

                {/* Emotional Intelligence */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800 flex items-center">
                            <FaceSmileIcon className="w-5 h-5 mr-2 text-yellow-500" /> Emotional Intelligence
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-600">Emotional Tone</span>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                                {stats.analytics.emotionalTone}
                            </span>
                        </div>
                        <MetricBar label="Confidence Level" value={stats.analytics.confidenceLevel} />
                        <MetricBar label="Engagement" value={stats.analytics.engagement} />
                        <MetricBar label="Empathy / Warmth" value={stats.analytics.empathyWarmth} />
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
                        <MetricBar label="Stuttering / Repetition" value={stats.analytics.stutteringRepetition} />
                        <MetricBar label="Sentence Completion" value={stats.analytics.sentenceCompletion} />
                        <MetricBar label="Flow" value={stats.analytics.flow} />
                    </div>
                </div>

            </div>

            {/* Candidate Answer Analysis */}
            {(stats.analytics.overallCorrectnessScore || stats.analytics.answerRelevance) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800 flex items-center">
                            <ChartBarIcon className="w-5 h-5 mr-2 text-indigo-500" /> Answer Analysis
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-600">Correctness</p>
                                <p className="text-2xl font-bold text-indigo-600">{stats.analytics.overallCorrectnessScore}/10</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-600">Relevance</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.analytics.answerRelevance}/10</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-600">Completeness</p>
                                <p className="text-2xl font-bold text-green-600">{stats.analytics.answerCompleteness}/10</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-600">Quality</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.analytics.answerQuality}/10</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-bold text-green-600 mb-2">Strong Answers</h4>
                                <ul className="space-y-1">
                                    {stats.analytics.strongAnswers?.map((answer, i) => (
                                        <li key={i} className="text-sm text-gray-700 flex items-start">
                                            <span className="text-green-500 mr-2">✓</span> {answer}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-red-600 mb-2">Areas for Improvement</h4>
                                <ul className="space-y-1">
                                    {stats.analytics.improvementAreas?.map((area, i) => (
                                        <li key={i} className="text-sm text-gray-700 flex items-start">
                                            <span className="text-red-500 mr-2">•</span> {area}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                    <h3 className="text-red-800 font-bold mb-4 flex items-center">
                        <span className="bg-red-200 text-red-700 p-1 rounded mr-2 text-xs">▼</span> Weak Areas
                    </h3>
                    <ul className="space-y-2">
                        {stats.analytics.weakAreas?.map((point, i) => (
                            <li key={i} className="text-red-700 text-sm flex items-start">
                                <span className="mr-2">•</span> {point}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                    <h3 className="text-green-800 font-bold mb-4 flex items-center">
                        <span className="bg-green-200 text-green-700 p-1 rounded mr-2 text-xs">▲</span> Strengths
                    </h3>
                    <ul className="space-y-2">
                        {stats.analytics.strengths?.map((point, i) => (
                            <li key={i} className="text-green-700 text-sm flex items-start">
                                <span className="mr-2">•</span> {point}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const ScoreCard = ({ title, score, color, icon: Icon, isMain }) => (
    <div className={`rounded-xl p-6 text-white shadow-lg ${color} ${isMain ? 'transform scale-105 ring-4 ring-white/30' : ''}`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-blue-100 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-4xl font-extrabold">{score}<span className="text-lg opacity-60">/10</span></h3>
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
            <span className="text-sm font-bold text-gray-900">{value}/10</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
                className={`h-2.5 rounded-full ${value >= 8 ? 'bg-green-500' : value >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                style={{ width: `${value * 10}%` }}
            ></div>
        </div>
    </div>
);

export default CommunicationDashboard;
