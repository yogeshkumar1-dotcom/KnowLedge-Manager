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
    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await axiosInstance.get('/api/v1/transcripts?limit=10');
            const transcripts = response.data.data?.transcripts || [];
            setHistory(transcripts);

            // Aggregate stats from the most recent completed transcript for detail view
            const latestCompleted = transcripts.find(t => t.status === 'completed' && t.analytics);
            if (latestCompleted) {
                setStats({
                    ...latestCompleted.analytics,
                    fileName: latestCompleted.fileName,
                    date: latestCompleted.createdAt
                });
            } else {
                setStats(null); // No data available
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
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
                <h1 className="text-3xl font-bold text-gray-900">Communication Dashboard</h1>
                <p className="mt-1 text-gray-600">
                    Analysis for: <span className="font-semibold">{stats.fileName}</span>
                    <span className="text-sm ml-2 text-gray-400">({new Date(stats.date).toLocaleDateString()})</span>
                </p>
            </div>

            {/* Top Level Scores */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <ScoreCard title="Fluency Score" score={stats.fluencyScore} color="bg-blue-500" icon={BoltIcon} />
                <ScoreCard title="Confidence Score" score={stats.confidenceScore} color="bg-green-500" icon={MicrophoneIcon} />
                <ScoreCard title="Clarity Score" score={stats.clarityScore} color="bg-purple-500" icon={ChatBubbleBottomCenterTextIcon} />
                <ScoreCard title="Overall Score" score={stats.overallScore} color="bg-indigo-600" icon={FaceSmileIcon} isMain />
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
                        <MetricBar label="Clarity & Pronunciation" value={stats.clarityPronunciation} />
                        <MetricBar label="Volume Consistency" value={stats.volumeConsistency} />
                        <MetricBar label="Voice Modulation" value={stats.voiceModulation} />
                        <MetricBar label="Pauses & Fillers" value={stats.pausesAndFillers} />
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-sm font-medium text-gray-600">Speech Rate</span>
                            <span className="text-lg font-bold text-gray-900">{stats.speechRate} <span className="text-xs text-gray-500 font-normal">WPM</span></span>
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
                        <MetricBar label="Vocabulary Richness" value={stats.vocabularyRichness} />
                        <MetricBar label="Grammar Accuracy" value={stats.grammarAccuracy} />
                        <MetricBar label="Coherence" value={stats.coherence} />
                        <MetricBar label="Relevance" value={stats.relevance} />
                        <MetricBar label="Message Clarity" value={stats.messageClarity} />
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
                                {stats.emotionalTone}
                            </span>
                        </div>
                        <MetricBar label="Confidence Level" value={stats.confidenceLevel} />
                        <MetricBar label="Engagement" value={stats.engagement} />
                        <MetricBar label="Empathy / Warmth" value={stats.empathyWarmth} />
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
                        <MetricBar label="Stuttering / Repetition" value={stats.stutteringRepetition} />
                        <MetricBar label="Sentence Completion" value={stats.sentenceCompletion} />
                        <MetricBar label="Flow" value={stats.flow} />
                    </div>
                </div>

            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                    <h3 className="text-red-800 font-bold mb-4 flex items-center">
                        <span className="bg-red-200 text-red-700 p-1 rounded mr-2 text-xs">▼</span> Weak Areas
                    </h3>
                    <ul className="space-y-2">
                        {stats.weakAreas?.map((point, i) => (
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
                        {stats.strengths?.map((point, i) => (
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
