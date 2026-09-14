import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';

export interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl shadow-black/80 flex flex-col max-h-[85vh]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100">Terms of Service & Privacy</h3>
            <p className="text-xs text-zinc-400">Multimodel Deepfake and AI Generated Content Detector</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 text-xs text-zinc-300 space-y-3.5 leading-relaxed text-left border-y border-zinc-800/80 py-4 my-1">
          <section>
            <h4 className="font-semibold text-zinc-100 mb-1 text-xs">1. Scope of Evaluation</h4>
            <p>
              By accessing this multimodal AI analysis system, you agree that media submitted (video, audio, text) will be processed through localized neural models for forensic authenticity assessment.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-zinc-100 mb-1 text-xs">2. Privacy & Data Confidentiality</h4>
            <p>
              Uploaded biometric data and speech samples are processed in isolated sandboxes and protected under strict encryption standards (PBKDF2-HMAC-SHA256, salted hashes, and JWT tokens). Transient guest scans are not permanently retained.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-zinc-100 mb-1 text-xs">3. Responsible Usage</h4>
            <p>
              You agree not to use this platform to reverse-engineer synthetic content evasion techniques, conduct malicious automated scraping, or breach regional privacy regulations.
            </p>
          </section>
        </div>

        <div className="pt-4 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            I Understand & Agree
          </Button>
        </div>
      </div>
    </div>
  );
};
