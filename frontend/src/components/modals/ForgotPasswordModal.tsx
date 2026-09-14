import React, { useState } from 'react';
import { X, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setIsLoading(true);

    // Simulate password reset network request
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1000);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setEmail('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl shadow-black/80">
        <button
          type="button"
          onClick={handleReset}
          className="absolute right-4 top-4 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="flex flex-col items-center text-center py-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">Reset link dispatched</h3>
            <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
              If an account matches <span className="text-sky-400 font-medium">{email}</span>, we have sent instructions to reset your password. Please check your inbox and spam folder.
            </p>
            <Button onClick={handleReset} variant="secondary" fullWidth>
              Return to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col text-left">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mb-3 text-sky-400">
              <Mail className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-bold text-zinc-100 mb-1">Reset your password</h3>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              Enter the email address registered with your account, and we'll send you a secure verification link to choose a new password.
            </p>

            <div className="mb-5">
              <Input
                label="Email Address"
                placeholder="analyst@agency.org"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                error={error}
                leftIcon={<Mail className="w-4 h-4" />}
                autoFocus
              />
            </div>

            <div className="flex gap-2.5">
              <Button type="button" variant="ghost" onClick={handleReset} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="flex-1"
              >
                Send Reset Link
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
