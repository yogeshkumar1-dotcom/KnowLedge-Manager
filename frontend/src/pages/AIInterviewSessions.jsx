import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AIInterviewSessions = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/v1/ai-interviewer/sessions');
            setSessions(response.data.data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
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

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">AI Interview Sessions</h1>
                <button
                    onClick={() => navigate('/ai-interviewer')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                    New Interview
                </button>
            </div>

            {sessions.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-500 text-lg mb-4">No interview sessions found</p>
                    <button
                        onClick={() => navigate('/ai-interviewer')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                    >
                        Start Your First Interview
                    </button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {sessions.map((session) => (
                        <div
                            key={session._id}
                            onClick={() => navigate(`/ai-interview-details/${session._id}`)}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {session.candidateName}
                                    </h3>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                        <span>Role: {session.role}</span>
                                        <span>Level: {session.level}</span>
                                        <span>Duration: {session.durationMinutes} min</span>
                                        <span>Date: {new Date(session.startTime).toLocaleDateString()}</span>
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
                    ))}
                </div>
            )}
        </div>
    );
};

export default AIInterviewSessions;
