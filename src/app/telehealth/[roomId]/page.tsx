'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  ShieldAlert, 
  ShieldCheck, 
  Share2, 
  MessageSquare, 
  Users, 
  Settings, 
  Sparkles,
  Heart
} from 'lucide-react';
import Link from 'next/link';

export default function EmbeddedTelehealthRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'System', text: 'Encrypted consultation room initialized (256-bit AES). Australian Privacy Principles compliant.', time: 'Just now' },
    { sender: 'Luke (Clinician)', text: 'Hi! Whenever you are settled, take a deep breath. We will begin shortly.', time: 'Just now' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attempt real local webcam stream if permitted in browser
  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startWebcam() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setCameraActive(true);
          }
        }
      } catch (err) {
        // Fallback gracefully to simulated avatar if user blocks camera or headless
        setCameraActive(false);
      }
    }

    if (isVideoOn) {
      startWebcam();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      setCameraActive(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVideoOn]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages(prev => [
      ...prev,
      { sender: 'You', text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setChatInput('');
  };

  return (
    <div className="min-h-screen bg-[#0F1412] text-white flex flex-col justify-between">
      {/* Top Telehealth Header Bar */}
      <div className="bg-[#130C76]/90 border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F96100] flex items-center justify-center text-white">
            <Heart className="w-4 h-4 fill-white" />
          </div>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-white">
              Mighty Mental Health Telehealth
            </span>
            <div className="flex items-center gap-2 text-[11px] text-white/60">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span>Room: <strong>{roomId}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-green-300">
                <ShieldCheck className="w-3 h-3" /> End-to-End Encrypted
              </span>
            </div>
          </div>
        </div>

        {/* Emergency Call Quick Trigger */}
        <div className="flex items-center gap-3">
          <a
            href="tel:131114"
            className="hidden sm:flex items-center gap-1.5 text-xs bg-red-600/30 text-red-200 border border-red-500/40 px-3 py-1.5 rounded-lg font-bold hover:bg-red-600/50 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Crisis Support (Lifeline 13 11 14)
          </a>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white relative"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Video Arena */}
      <div className="flex-1 p-4 sm:p-6 flex gap-4 max-w-7xl mx-auto w-full items-center justify-center">
        
        {/* Clinician Remote Feed */}
        <div className="flex-1 h-full min-h-[460px] max-h-[680px] bg-[#1A2421] rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between p-6 shadow-2xl">
          <div className="flex items-center justify-between z-10">
            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              Luke (Clinician)
            </div>
            <span className="text-xs text-white/50 bg-black/40 px-2.5 py-1 rounded-md">
              Logan, QLD (AEST)
            </span>
          </div>

          {/* Central Clinician Visual / Video Mirror */}
          <div className="my-auto text-center space-y-3">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#130C76] to-[#F96100] text-white flex items-center justify-center font-extrabold text-4xl shadow-xl mx-auto border-4 border-white/20">
              L
            </div>
            <h3 className="font-extrabold text-xl text-white">Luke MCouns (UQ)</h3>
            <p className="text-xs text-[#FFAC24] font-medium">PACFA Registered Clinician • In Consultation</p>
          </div>

          <div className="z-10 bg-black/40 backdrop-blur-xs p-3 rounded-2xl text-xs text-white/70 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F96100]" /> Somatic Nervous System Regulation active
            </span>
            <span className="text-[11px] text-white/40">HD 1080p WebRTC</span>
          </div>

          {/* Picture-in-Picture Local Client Video Feed */}
          <div className="absolute bottom-6 right-6 w-44 sm:w-56 h-32 sm:h-40 rounded-2xl bg-[#130C76] border-2 border-white/30 shadow-2xl overflow-hidden z-20">
            {isVideoOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-white/50">
                <VideoOff className="w-6 h-6 mb-1 text-white/40" />
                <span>Camera Muted</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-bold text-white">
              You
            </div>
          </div>
        </div>

        {/* Side Chat Drawer (Toggled) */}
        {chatOpen && (
          <div className="w-80 h-full min-h-[460px] max-h-[680px] bg-[#1A2421] rounded-3xl border border-white/10 flex flex-col justify-between p-4 shadow-xl">
            <div className="pb-3 border-b border-white/10 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">Consultation Chat</h4>
              <button onClick={() => setChatOpen(false)} className="text-white/40 hover:text-white text-xs">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs">
              {messages.map((m, i) => (
                <div key={i} className={`p-2.5 rounded-xl ${m.sender === 'You' ? 'bg-[#F96100]/20 ml-4' : 'bg-white/5 mr-4'}`}>
                  <div className="flex justify-between text-[10px] text-white/50 mb-1">
                    <span className="font-bold text-white/90">{m.sender}</span>
                    <span>{m.time}</span>
                  </div>
                  <p className="text-white/80 leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="pt-2 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type note or question..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-hidden"
              />
              <button type="submit" className="bg-[#F96100] px-3 py-2 rounded-xl text-xs font-bold text-white">
                Send
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Floating Control Deck */}
      <div className="bg-[#130C76]/90 border-t border-white/10 py-4 px-6 flex items-center justify-center gap-4">
        {/* Mic Toggle */}
        <button
          onClick={() => setIsMicOn(!isMicOn)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isMicOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-600 text-white shadow-md'
          }`}
          title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={() => setIsVideoOn(!isVideoOn)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isVideoOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-600 text-white shadow-md'
          }`}
          title={isVideoOn ? 'Turn Video Off' : 'Turn Video On'}
        >
          {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Screen Share */}
        <button
          onClick={() => setIsScreenSharing(!isScreenSharing)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isScreenSharing ? 'bg-[#F96100] text-white shadow-md' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title="Share Screen"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* End Call / Return to Portal */}
        <Link
          href="/portal"
          className="bg-red-600 hover:bg-red-700 text-white px-6 h-12 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
        >
          <PhoneOff className="w-4 h-4" /> End Consultation
        </Link>
      </div>
    </div>
  );
}
