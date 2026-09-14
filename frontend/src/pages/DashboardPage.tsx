import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  LogOut,
  Video,
  Mic,
  FileText,
  Camera,
  Activity,
  UserCheck,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const isGuest = user?.id?.startsWith('guest');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-extrabold text-white tracking-tight">
              MULTIMODEL <span className="text-sky-400">DETECTOR</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Deepfake & AI Content Analysis Portal
            </span>
          </div>
        </div>

        {/* User Profile and Sign Out */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-left">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-400 font-bold text-xs flex items-center justify-center">
              {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold text-zinc-200 leading-tight">
                {user?.fullName || user?.username}
              </span>
              <span className="text-[10px] text-zinc-400">
                {isGuest ? 'Guest Session' : user?.email}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col text-left space-y-8 animate-fade-in">
        
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-sky-950/40 via-zinc-900 to-zinc-900 border border-zinc-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Session Active &bull; {token ? 'JWT Secured' : 'Transient Guest'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome, {user?.fullName || user?.username}!
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
                You are successfully authenticated. Launch high-assurance multimodal verification across visual, acoustic, and textual modalities below.
              </p>
            </div>

            <div className="flex gap-3">
              <a
                href="http://127.0.0.1:8000"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-all shadow-lg shadow-sky-500/25"
              >
                <span>Launch Full FastAPI App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* 4 Multimodal Scanner Workspaces */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Detection Workspaces</h2>
              <p className="text-xs text-zinc-400">Select a neural modality to inspect synthetic artifacts</p>
            </div>
            <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              Inference Engine Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Visual Deepfake */}
            <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-sky-500/40 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Video className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Visual Video Analysis</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Evaluates MP4, AVI, and MOV files for facial boundary blending, blur variance, and Grad-CAM activation maps.
                </p>
              </div>
              <Button variant="outline" size="sm" fullWidth>
                Scan Video File
              </Button>
            </div>

            {/* Audio Voice Clone */}
            <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-blue-500/40 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Mic className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Acoustic Voice Cloning</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Processes WAV and MP3 speech streams using Voice Activity Detection (VAD) and spectral rolloff anomaly analysis.
                </p>
              </div>
              <Button variant="outline" size="sm" fullWidth>
                Scan Audio File
              </Button>
            </div>

            {/* Text Synthesizer */}
            <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-indigo-500/40 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">AI Text & LLM Tokens</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Inspects transcripts and prompts for perplexity uniformity, sentence length burstiness, and LLM transition markers.
                </p>
              </div>
              <Button variant="outline" size="sm" fullWidth>
                Inspect Text Prompt
              </Button>
            </div>

            {/* Live Webcam HUD */}
            <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-emerald-500/40 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Live Camera Stream</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Streams real-time webcam frames with live Face Quality Index calculation and thermal Grad-CAM canvas overlay.
                </p>
              </div>
              <Button variant="outline" size="sm" fullWidth>
                Start Webcam HUD
              </Button>
            </div>
          </div>
        </div>

        {/* System Architecture Details */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-2 text-zinc-300">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Active Architecture: ResNet-GradCAM-v2.1 &bull; SpectralFlux-v1.4 &bull; Perplexity-v1.8 &bull; AdaptiveLateFusion-v2.0</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 font-sans font-semibold">
              Authenticated Session
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};
