import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    LineChart, Line
} from 'recharts';
import {
    SpeakerWaveIcon,
    ChatBubbleBottomCenterTextIcon,
    HeartIcon,
    SparklesIcon,
    ExclamationCircleIcon,
    CheckBadgeIcon,
    ChartBarIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

const CommunicationAnalytics = ({ data }) => {
    if (!data || !data.analytics) {
        return (
            <div className="flex items-center justify-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <div className="text-center">
                    <SpeakerWaveIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500">No analytics data available for this recording.</p>
                </div>
            </div>
        );
    }

    const { analytics } = data;

    // Data for Fluency Radar Chart
    const fluencyData = [
        { subject: 'Clarity', A: analytics.clarityPronunciation || 0, fullMark: 10 },
        { subject: 'Rate', A: analytics.speechRate || 0, fullMark: 10 },
        { subject: 'Volume', A: analytics.volumeConsistency || 0, fullMark: 10 },
        { subject: 'Modulation', A: analytics.voiceModulation || 0, fullMark: 10 },
        { subject: 'Flow', A: analytics.flow || 0, fullMark: 10 },
    ];

    // Data for Content Bar Chart
    const contentData = [
        { name: 'Vocab', value: analytics.vocabularyRichness || 0 },
        { name: 'Grammar', value: analytics.grammarAccuracy || 0 },
        { name: 'Coherence', value: analytics.coherence || 0 },
        { name: 'Relevance', value: analytics.relevance || 0 },
        { name: 'Message', value: analytics.clarityOfMessage || 0 },
    ];

    // Data for Soft Skills
    const softSkillsData = [
        { name: 'Confidence', value: analytics.confidenceLevel || 0 },
        { name: 'Engagement', value: analytics.engagement || 0 },
        { name: 'Empathy', value: analytics.empathyWarmth || 0 },
    ];

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const getScoreZone = (score) => {
        const value = parseFloat(score);
        if (value >= 8) return { label: 'Green Zone', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', message: 'Congratulations! Excellent Performance.' };
        if (value >= 6) return { label: 'Yellow Zone', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', message: 'Good progress. Keep improving.' };
        return { label: 'Red Zone', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', message: 'Needs significant improvement.' };
    };

    const overallScore = analytics.overallCommunicationScore || (analytics.overallScore || 0);
    const scoreZone = getScoreZone(overallScore);

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Zone Popup/Banner */}
            <div className={`p-4 rounded-xl border ${scoreZone.bg} ${scoreZone.border} flex items-center shadow-sm`}>
                <div className={`p-2 rounded-lg ${scoreZone.color.replace('text', 'bg').replace('600', '100')} mr-4`}>
                    <SparklesIcon className={`h-6 w-6 ${scoreZone.color}`} />
                </div>
                <div>
                    <h4 className={`font-bold ${scoreZone.color}`}>{scoreZone.label}: {scoreZone.message}</h4>
                    <p className="text-sm text-gray-600">Overall Communication Score: {overallScore}/10</p>
                </div>
            </div>

            {/* Overview Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ScoreCard title="Overall Score" value={overallScore} max={10} color="text-blue-600" bg="bg-blue-50" />
                <ScoreCard title="Fluency" value={analytics.fluencyScore} max={10} color="text-green-600" bg="bg-green-50" />
                <ScoreCard title="Confidence" value={analytics.confidenceScore} max={10} color="text-yellow-600" bg="bg-yellow-50" />
                <ScoreCard title="Clarity" value={analytics.clarityScore} max={10} color="text-purple-600" bg="bg-purple-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Fluency Radar Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center mb-6">
                        <SpeakerWaveIcon className="h-6 w-6 text-blue-500 mr-2" />
                        <h3 className="text-lg font-bold text-gray-900">Speech & Fluency</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={fluencyData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                                <Radar
                                    name="Fluency"
                                    dataKey="A"
                                    stroke="#3B82F6"
                                    fill="#3B82F6"
                                    fillOpacity={0.6}
                                />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Content Bar Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center mb-6">
                        <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-green-500 mr-2" />
                        <h3 className="text-lg font-bold text-gray-900">Content Quality</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={contentData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" fontSize={12} tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <Tooltip cursor={{ fill: '#f9fafb' }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                                    {contentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Soft Skills */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center mb-6">
                        <HeartIcon className="h-6 w-6 text-pink-500 mr-2" />
                        <h3 className="text-lg font-bold text-gray-900">Soft Skills & Tone</h3>
                    </div>
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="w-full md:w-1/2 h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={softSkillsData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {softSkillsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full md:w-1/2 space-y-4">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Dominant Tone</p>
                                <p className="text-xl font-bold text-gray-900 capitalize">{analytics.emotionalTone || 'Neutral'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-[10px] text-blue-600 font-bold uppercase">Confidence</p>
                                    <p className="text-lg font-black text-blue-700">{analytics.confidenceLevel || 0}/10</p>
                                </div>
                                <div className="p-3 bg-pink-50 rounded-xl border border-pink-100">
                                    <p className="text-[10px] text-pink-600 font-bold uppercase">Engagement</p>
                                    <p className="text-lg font-black text-pink-700">{analytics.engagement || 0}/10</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Insights */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center mb-6">
                        <SparklesIcon className="h-6 w-6 text-yellow-500 mr-2" />
                        <h3 className="text-lg font-bold text-gray-900">AI Analysis</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center mb-3 text-green-600">
                                <CheckBadgeIcon className="h-5 w-5 mr-2" />
                                <span className="font-bold text-sm uppercase tracking-wide">Key Strengths</span>
                            </div>
                            <ul className="space-y-2">
                                {(analytics.strengths || []).length > 0 ? (
                                    analytics.strengths.map((s, i) => (
                                        <li key={i} className="flex items-start text-sm text-gray-700 bg-green-50 p-2 rounded-lg border border-green-100">
                                            <span className="text-green-500 mr-2">•</span>
                                            {s}
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-sm text-gray-500 italic">No specific strengths identified.</li>
                                )}
                            </ul>
                        </div>
                        <div>
                            <div className="flex items-center mb-3 text-amber-600">
                                <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                                <span className="font-bold text-sm uppercase tracking-wide">Weak Areas</span>
                            </div>
                            <ul className="space-y-2">
                                {(analytics.weakAreas || []).length > 0 ? (
                                    analytics.weakAreas.map((w, i) => (
                                        <li key={i} className="flex items-start text-sm text-gray-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                            <span className="text-amber-500 mr-2">•</span>
                                            {w}
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-sm text-gray-500 italic">No specific weak areas identified.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ScoreCard = ({ title, value, max, color, bg }) => (
    <div className={`${bg} p-6 rounded-2xl border border-white/50 shadow-sm flex flex-col items-center justify-center transition-transform hover:scale-105 duration-200`}>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center">{title}</p>
        <div className="flex items-baseline">
            <span className={`text-3xl font-black ${color}`}>{value || 0}</span>
            <span className="text-gray-400 text-xs font-bold ml-1">/{max}</span>
        </div>
    </div>
);

export default CommunicationAnalytics;