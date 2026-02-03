import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';
import {
    CalendarIcon,
    MagnifyingGlassIcon,
    DocumentTextIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

const ActivitiesList = ({ onSelectTranscript, refreshTrigger }) => {
    const [activities, setActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        fetchHistory();
    }, [refreshTrigger]);

    useEffect(() => {
        filterActivities();
    }, [searchTerm, selectedDate, activities]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/api/v1/interviews?limit=100');
            const data = response.data.data?.interviews || [];
            // Transform interview data to match expected format
            const transformedData = data.map(interview => ({
                _id: interview._id,
                fileName: interview.fileName,
                candidateName: interview.candidateName,
                transcriptTitle: interview.candidateName,
                createdAt: interview.createdAt,
                status: interview.status,
                // Transform for analytics display
                analytics: interview.status === 'scored' ? {
                    overallCommunicationScore: interview.overall_communication_score,
                    overallScore: interview.overall_communication_score,
                    fluencyScore: interview.language_quality?.fluency_score,
                    confidenceScore: interview.communication_skills?.confidence_score,
                    clarityScore: interview.language_quality?.clarity_score,
                    // Speech & Fluency metrics
                    clarityPronunciation: interview.language_quality?.clarity_score,
                    speechRate: interview.speech_metrics?.words_per_minute ? Math.min(interview.speech_metrics.words_per_minute / 20, 10) : 7,
                    volumeConsistency: interview.communication_skills?.confidence_score,
                    voiceModulation: interview.communication_skills?.engagement_score,
                    flow: interview.language_quality?.fluency_score,
                    // Content Quality metrics
                    vocabularyRichness: interview.language_quality?.grammar_score,
                    grammarAccuracy: interview.language_quality?.grammar_score,
                    coherence: interview.communication_skills?.structure_score,
                    relevance: interview.communication_skills?.relevance_score,
                    clarityOfMessage: interview.communication_skills?.structure_score,
                    // Soft skills
                    confidenceLevel: interview.communication_skills?.confidence_score,
                    engagement: interview.communication_skills?.engagement_score,
                    empathyWarmth: interview.communication_skills?.engagement_score,
                    emotionalTone: 'Professional',
                    strengths: interview.coaching_feedback?.what_went_well || interview.summary?.strengths || [],
                    weakAreas: interview.coaching_feedback?.what_to_improve || interview.summary?.primary_issues || []
                } : null,
                notes: {
                    summary: interview.summary?.verdict || 'Processing...'
                }
            }));
            setActivities(transformedData);
            setFilteredActivities(transformedData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching history:', error);
            setLoading(false);
        }
    };

    const filterActivities = () => {
        let results = activities;

        if (searchTerm) {
            results = results.filter(act =>
                act.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (act.transcriptTitle && act.transcriptTitle.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (selectedDate) {
            results = results.filter(act => {
                const actDate = new Date(act.createdAt).toISOString().split('T')[0];
                return actDate === selectedDate;
            });
        }

        setFilteredActivities(results);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search recordings..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Calendar Picker */}
                <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="date"
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    {selectedDate && (
                        <button
                            onClick={() => setSelectedDate('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-2 mt-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">History</h4>
                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredActivities.length > 0 ? (
                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto pr-1">
                        {filteredActivities.map((activity) => (
                            <button
                                key={activity._id}
                                onClick={() => onSelectTranscript(activity)}
                                className="w-full text-left p-3 hover:bg-blue-50 rounded-xl transition-colors group flex items-center"
                            >
                                <div className="h-10 w-10 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center mr-3 transition-colors">
                                    <DocumentTextIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-700">
                                        {activity.transcriptTitle || activity.fileName}
                                    </p>
                                    <p className="text-xs text-gray-500 font-medium">
                                        {new Date(activity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                                <ChevronRightIcon className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed">
                        <p className="text-sm text-gray-500">No recordings found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivitiesList;
