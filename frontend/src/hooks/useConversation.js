import { useState, useRef, useEffect, useCallback } from 'react';

// Configuration - Uses Vite proxy
const BACKEND_URL = '/api/v1/ai-interviewer';

export const useConversation = () => {
    const [status, setStatus] = useState('IDLE'); // IDLE, INITIALIZING, AI_SPEAKING, LISTENING, PROCESSING, COMPLETED
    const [messages, setMessages] = useState([]); // { role: 'ai' | 'user', text: string }
    const [sessionId, setSessionId] = useState(null);
    const [currentTranscript, setCurrentTranscript] = useState('');

    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                setCurrentTranscript(prev => prev + finalTranscript);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const speak = useCallback((text, onEnd) => {
        if (!synthesisRef.current) return;

        synthesisRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        const voices = synthesisRef.current.getVoices();
        const preferredVoice = voices.find(voice => voice.name.includes("Google US English") || voice.name.includes("Microsoft David"));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => {
            setStatus('LISTENING');
            if (onEnd) onEnd();
        };

        setStatus('AI_SPEAKING');
        synthesisRef.current.speak(utterance);
    }, []);

    const startInterview = async (config) => {
        try {
            setStatus('INITIALIZING');
            const res = await fetch(`${BACKEND_URL}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            const data = await res.json();

            setSessionId(data.sessionId);
            setMessages([{ role: 'ai', text: data.message }]);

            speak(data.message, () => startListening(data.sessionId));
        } catch (err) {
            console.error("Failed to start interview", err);
            setStatus('ERROR');
        }
    };

    const startListening = (activeSessionId) => {
        setStatus('LISTENING');
        setCurrentTranscript('');

        if (recognitionRef.current) {
            recognitionRef.current.start();
        }
    };

    // Watch for silence
    useEffect(() => {
        if (status !== 'LISTENING' || !currentTranscript) return;

        const timeoutId = setTimeout(() => {
            submitResponse();
        }, 3000); // 3 seconds silence threshold

        return () => clearTimeout(timeoutId);
    }, [currentTranscript, status]);

    const submitResponse = async () => {
        if (!sessionId || !currentTranscript.trim()) return;

        if (recognitionRef.current) recognitionRef.current.stop();
        setStatus('PROCESSING');

        const userText = currentTranscript;
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setCurrentTranscript('');

        try {
            const res = await fetch(`${BACKEND_URL}/turn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, text: userText })
            });
            const data = await res.json();

            if (data.status === 'COMPLETED') {
                setStatus('COMPLETED');
                setMessages(prev => [...prev, { role: 'ai', text: data.message }]);
                speak(data.message);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: data.message }]);
                speak(data.message, () => startListening(sessionId));
            }

        } catch (err) {
            console.error("Turn processing failed", err);
            setStatus('ERROR');
        }
    };

    return {
        status,
        messages,
        startInterview,
        currentTranscript
    };
};
