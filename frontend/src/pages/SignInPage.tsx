import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Zap } from 'lucide-react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { SocialButton } from '../components/ui/SocialButton';
import { Toast } from '../components/ui/Toast';
import { ForgotPasswordModal } from '../components/modals/ForgotPasswordModal';
import { useAuth } from '../context/AuthContext';

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, continueAsGuest, isLoading: authLoading, error: authError, clearError } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [formErrors, setFormErrors] = useState<{ emailOrUsername?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const validateForm = () => {
    const errors: { emailOrUsername?: string; password?: string } = {};

    if (!emailOrUsername.trim()) {
      errors.emailOrUsername = 'Username or email address is required';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await signIn({
        emailOrUsername: emailOrUsername.trim(),
        password,
        rememberMe,
      });

      setSuccessMsg('Authentication successful! Redirecting to dashboard...');

      // Smooth transition before redirect
      setTimeout(() => {
        navigate('/dashboard');
      }, 750);
    } catch (err: any) {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'github') => {
    setIsSubmitting(true);
    // Simulate social authentication
    setTimeout(() => {
      signIn({
        emailOrUsername: `${provider}_analyst@agency.org`,
        password: 'SocialLoginSecret123!',
        rememberMe: true,
      }).then(() => {
        setSuccessMsg(`Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}! Redirecting...`);
        setTimeout(() => navigate('/dashboard'), 750);
      });
    }, 600);
  };

  const handleGuestAccess = () => {
    continueAsGuest();
    setSuccessMsg('Continuing as Guest Analyst (Transient Mode)...');
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  return (
    <AuthLayout activeTab="signin">
      <div className="flex flex-col text-left">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white tracking-tight">Sign in to your account</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Access the multimodal deepfake detection neural pipeline
          </p>
        </div>

        {/* Global Error Banner */}
        {authError && (
          <div className="mb-4">
            <Toast type="error" message={authError} onClose={clearError} />
          </div>
        )}

        {/* Success Banner */}
        {successMsg && (
          <div className="mb-4">
            <Toast type="success" message={successMsg} />
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email or Username"
            type="text"
            required
            placeholder="analyst@agency.org or username"
            value={emailOrUsername}
            onChange={(e) => {
              setEmailOrUsername(e.target.value);
              if (formErrors.emailOrUsername) {
                setFormErrors((prev) => ({ ...prev, emailOrUsername: undefined }));
              }
            }}
            error={formErrors.emailOrUsername}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="username"
            disabled={isSubmitting || !!successMsg}
          />

          <div className="space-y-1">
            <Input
              label="Password"
              isPassword
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formErrors.password) {
                  setFormErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              error={formErrors.password}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              disabled={isSubmitting || !!successMsg}
            />

            <div className="flex items-center justify-between pt-1">
              <Checkbox
                label="Remember me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isSubmitting || !!successMsg}
              />

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            isLoading={isSubmitting || authLoading}
            disabled={!!successMsg}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="mt-2"
          >
            {isSubmitting ? 'Verifying Credentials...' : 'Sign In'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-zinc-900/90 px-3 text-zinc-400 font-medium tracking-wider">
              Or continue with
            </span>
          </div>
        </div>

        {/* Social Authentication */}
        <div className="grid grid-cols-2 gap-2.5">
          <SocialButton
            provider="google"
            onClick={() => handleSocialLogin('google')}
            disabled={isSubmitting || !!successMsg}
          />
          <SocialButton
            provider="github"
            onClick={() => handleSocialLogin('github')}
            disabled={isSubmitting || !!successMsg}
          />
        </div>

        {/* Quick Guest Access Mode */}
        <button
          type="button"
          onClick={handleGuestAccess}
          disabled={isSubmitting || !!successMsg}
          className="mt-3.5 w-full py-2.5 px-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-all text-xs font-semibold flex items-center justify-center gap-2 group"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>Continue as Guest (Instant Scan)</span>
        </button>

        {/* Link to Sign Up */}
        <p className="mt-5 text-center text-xs text-zinc-400">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-sky-400 hover:text-sky-300 hover:underline transition-colors ml-1"
          >
            Create an account
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        defaultEmail={emailOrUsername.includes('@') ? emailOrUsername : ''}
      />
    </AuthLayout>
  );
};
