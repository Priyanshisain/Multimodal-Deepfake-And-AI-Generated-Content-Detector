import React from 'react';
import { Shield, Sparkles, Video, Mic, FileText, Cpu, Lock, CheckCircle2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export interface AuthLayoutProps {
  children: React.ReactNode;
  activeTab: 'signin' | 'signup';
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, activeTab }) => {
  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden selection:bg-sky-500/30 selection:text-sky-200">
      {/* Ambient background mesh and radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/15 via-zinc-950/80 to-zinc-950 pointer-events-none" />
      <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Background Subtle Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Navbar */}
      <header className="relative z-20 w-full border-b border-zinc-800/60 bg-zinc-950/60 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-sm shadow-sky-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight text-white">
                MULTIMODEL <span className="text-sky-400">DETECTOR</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live v2.2
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 tracking-wider uppercase font-mono">
              Deepfake & AI Generated Content Verification
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="hidden sm:inline font-mono">PyTorch 2.14 &bull; Grad-CAM</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Hero & Architectural Highlights (Desktop 7 cols) */}
          <div className="lg:col-span-7 flex flex-col text-left space-y-6 max-w-2xl mx-auto lg:mx-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider w-fit shadow-sm shadow-sky-500/15">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Next-Gen Verification Architecture</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.12]">
              Multimodel Deepfake and AI Generated Content Detector
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl">
              High-assurance multimodal artificial intelligence platform. Real-time forensic verification across facial video reenactment, synthetic speech cloning, and generative AI tokens.
            </p>

            {/* 4 Feature Matrix Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-sky-500/40 transition-all duration-200 backdrop-blur-md flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0 border border-sky-500/20">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 mb-0.5">Visual Deepfake Engine</h3>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    MediaPipe face alignment, Laplacian sharpness check, and Grad-CAM v2.2 heatmaps.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-sky-500/40 transition-all duration-200 backdrop-blur-md flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 border border-blue-500/20">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 mb-0.5">Acoustic Voice Cloning</h3>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Voice Activity Detection (VAD), spectral rolloff, and neural vocoder anomalies.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-sky-500/40 transition-all duration-200 backdrop-blur-md flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0 border border-indigo-500/20">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 mb-0.5">AI Text Synthesizer Check</h3>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Token perplexity modeling, sentence burstiness, and LLM transition markers.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-sky-500/40 transition-all duration-200 backdrop-blur-md flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 border border-emerald-500/20">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 mb-0.5">Cross-Modal Late Fusion</h3>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Audio-visual synchronization penalty and Platt temperature-calibrated probabilities.
                  </p>
                </div>
              </div>
            </div>

            {/* Trust Metrics Strip */}
            <div className="flex items-center gap-6 pt-3 border-t border-zinc-800/60">
              <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>NIST-Level Cryptography</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Sub-250ms Inference</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Cloud Retention</span>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card (Desktop 5 cols) */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl shadow-black/80 border border-zinc-800 relative">
              
              {/* Top Tab Switcher */}
              <div className="grid grid-cols-2 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 mb-6">
                <NavLink
                  to="/"
                  className={`py-2 px-4 rounded-lg text-xs font-bold transition-all duration-200 text-center ${
                    activeTab === 'signin'
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Sign In
                </NavLink>

                <NavLink
                  to="/signup"
                  className={`py-2 px-4 rounded-lg text-xs font-bold transition-all duration-200 text-center ${
                    activeTab === 'signup'
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Create Account
                </NavLink>
              </div>

              {/* Children Component (SignInPage or SignUpPage form) */}
              {children}

              {/* Security Assurance Footer */}
              <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-center gap-2 text-[11px] text-zinc-400 font-mono">
                <Lock className="w-3 h-3 text-sky-400" />
                <span>PBKDF2-HMAC-SHA256 &bull; PyJWT &bull; Private Sandbox</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* App Footer */}
      <footer className="relative z-10 py-4 px-6 border-t border-zinc-900 text-center text-xs text-zinc-400">
        &copy; 2026 Multimodel Deepfake and AI Generated Content Detector. High-assurance multimodal AI verification.
      </footer>
    </div>
  );
};
