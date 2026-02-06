import React, { useState } from 'react';
import WebcamComp from '../components/WebcamComp';
import { useConversation } from '../hooks/useConversation';

const AIInterviewPage = () => {
    const [formData, setFormData] = useState({
        candidateName: '',
        role: 'Software Engineer',
        level: 'Mid-Senior',
        experience: '3',
        duration: 5
    });
    const [started, setStarted] = useState(false);

    const { status, messages, startInterview, currentTranscript } = useConversation();
    const [permissionsGranted, setPermissionsGranted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setStarted(true);
        startInterview(formData);
    };

    if (!started) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">AI Communication Interview</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                value={formData.candidateName}
                                onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Job Role</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Level</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                >
                                    <option>Junior</option>
                                    <option>Mid-Senior</option>
                                    <option>Senior</option>
                                    <option>Executive</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Experience (Yrs)</label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                    value={formData.experience}
                                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Duration (Minutes)</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                            >
                                <option value={5}>5 Minutes</option>
                                <option value={10}>10 Minutes</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            Start Interview
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-100px)]">

                {/* Left: Video Area */}
                <div className="flex flex-col space-y-4">
                    <div className="bg-gray-800 rounded-2xl p-4 shadow-2xl border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-red-500 font-semibold animate-pulse flex items-center">
                                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                Recording
                            </span>
                            <span className="text-gray-400 text-sm">Session ID: {started ? 'Active' : '...'}</span>
                        </div>
                        <WebcamComp onPermissionGranted={setPermissionsGranted} />
                    </div>

                    {/* Status Indicator */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-lg font-medium text-gray-300 mb-2">Interviewer Status</h3>
                        <div className={`p-4 rounded-lg flex items-center justify-center text-xl font-bold transition-colors ${status === 'AI_SPEAKING' ? 'bg-indigo-900 text-indigo-200' :
                                status === 'LISTENING' ? 'bg-green-900 text-green-200' :
                                    status === 'PROCESSING' ? 'bg-yellow-900 text-yellow-200' :
                                        'bg-gray-700'
                            }`}>
                            {status === 'AI_SPEAKING' && "Alex is speaking..."}
                            {status === 'LISTENING' && "Listening to you..."}
                            {status === 'PROCESSING' && "Thinking..."}
                            {status === 'COMPLETED' && "Interview Completed"}
                            {status === 'INITIALIZING' && "Preparing..."}
                        </div>

                        <p className="mt-4 text-sm text-gray-400">
                            {status === 'LISTENING' && "Speak naturally. When you finish, pause for 3 seconds."}
                        </p>
                    </div>
                </div>

                {/* Right: Transcript / Conversation */}
                <div className="bg-gray-800 rounded-2xl flex flex-col border border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-700 bg-gray-850">
                        <h2 className="text-lg font-semibold">Live Transcript</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'ai'
                                        ? 'bg-gray-700 text-white rounded-tl-none'
                                        : 'bg-indigo-600 text-white rounded-tr-none'
                                    }`}>
                                    <p className="text-xs font-bold mb-1 opacity-50">{msg.role === 'ai' ? 'Alex (Interviewer)' : 'You'}</p>
                                    <p>{msg.text}</p>
                                </div>
                            </div>
                        ))}

                        {/* Real-time transcription feedback */}
                        {status === 'LISTENING' && currentTranscript && (
                            <div className="flex justify-end opacity-70">
                                <div className="max-w-[80%] rounded-2xl p-4 bg-indigo-900/50 text-indigo-200 border border-indigo-500/30 dashed">
                                    <p className="text-xs font-bold mb-1 opacity-50">You (Speaking...)</p>
                                    <p>{currentTranscript}</p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIInterviewPage;
