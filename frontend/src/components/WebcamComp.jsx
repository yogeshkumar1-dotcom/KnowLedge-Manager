import { useState, useRef, useEffect } from 'react';
import {
    VideoCameraIcon,
    VideoCameraSlashIcon,
    MicrophoneIcon,
    SpeakerXMarkIcon
} from '@heroicons/react/24/solid';

const WebcamComp = ({ onPermissionGranted }) => {
    const videoRef = useRef(null);
    const [hasPermission, setHasPermission] = useState(false);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setHasPermission(true);
            if (onPermissionGranted) onPermissionGranted(true);
        } catch (err) {
            console.error("Camera access denied:", err);
            setHasPermission(false);
            if (onPermissionGranted) onPermissionGranted(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
    };

    const toggleVideo = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const track = videoRef.current.srcObject.getVideoTracks()[0];
            track.enabled = !track.enabled;
            setVideoEnabled(track.enabled);
        }
    };

    const toggleAudio = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const track = videoRef.current.srcObject.getAudioTracks()[0];
            track.enabled = !track.enabled;
            setAudioEnabled(track.enabled);
        }
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto bg-black rounded-lg overflow-hidden shadow-xl aspect-video">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button onClick={toggleVideo} className={`p-3 rounded-full ${videoEnabled ? 'bg-gray-800 text-white' : 'bg-red-500 text-white'} hover:bg-opacity-80 transition`}>
                    {videoEnabled ? <VideoCameraIcon className="w-6 h-6" /> : <VideoCameraSlashIcon className="w-6 h-6" />}
                </button>
                <button onClick={toggleAudio} className={`p-3 rounded-full ${audioEnabled ? 'bg-gray-800 text-white' : 'bg-red-500 text-white'} hover:bg-opacity-80 transition`}>
                    {audioEnabled ? <MicrophoneIcon className="w-6 h-6" /> : <SpeakerXMarkIcon className="w-6 h-6" />}
                </button>
            </div>

            {!hasPermission && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white">
                    <p>Requesting Camera & Mic Access...</p>
                </div>
            )}
        </div>
    );
};

export default WebcamComp;
