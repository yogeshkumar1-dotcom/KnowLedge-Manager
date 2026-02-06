import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const AIInterviewDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSession();
    }, [id]);

    const fetchSession = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/api/v1/ai-interviewer/sessions/${id}`);
            setSession(response.data.data);
        } catch (error) {
            console.error('Error fetching session:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="max-w-4xl mx-auto text-center py-20">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h1>
                <button
                    onClick={() => navigate('/ai-interview-sessions')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                    Back to Sessions
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <button
                onClick={() => navigate('/ai-interview-sessions')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="font-medium">Back to Sessions</span>
            </button>

            {/* Session Info */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">{session.candidateName}</h1>
                        <div className="flex gap-6 text-gray-600">
                            <span>Role: {session.role}</span>
                            <span>Level: {session.level}</span>
                            <span>Experience: {session.experience} years</span>
                            <span>Duration: {session.durationMinutes} min</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                            {new Date(session.startTime).toLocaleString()}
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                        session.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        session.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                    }`}>
                        {session.status}
                    </div>
                </div>
            </div>

            {/* Conversation History */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-black text-gray-900 mb-6">Interview Transcript</h2>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {session.history.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[80%] rounded-2xl p-4 ${
                                msg.role === 'ai'
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'bg-blue-600 text-white'
                            }`}>
                                <p className="text-xs font-bold mb-1 opacity-70">
                                    {msg.role === 'ai' ? 'Alex (Interviewer)' : session.candidateName}
                                </p>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <p className="text-xs opacity-50 mt-2">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Analysis (if available) */}
            {session.status === 'COMPLETED' && session.analysis && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-black text-gray-900 mb-6">Communication Analysis</h2>
                    <div className="prose max-w-none">
                        <pre className="whitespace-pre-wrap bg-gray-50 p-6 rounded-xl text-sm">
                            {JSON.stringify(session.analysis, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

            {/* Full Transcript */}
            {session.transcript && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-black text-gray-900 mb-6">Full Transcript</h2>
                    <div className="bg-gray-50 p-6 rounded-xl whitespace-pre-wrap text-gray-700">
                        {session.transcript}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIInterviewDetails;
