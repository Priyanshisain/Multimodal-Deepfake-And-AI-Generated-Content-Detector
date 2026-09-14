import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User as UserIcon, Mail, Lock, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { SocialButton } from '../components/ui/SocialButton';
import { PasswordStrengthMeter } from '../components/ui/PasswordStrengthMeter';
import { Toast } from '../components/ui/Toast';
import { TermsModal } from '../components/modals/TermsModal';
import { useAuth } from '../context/AuthContext';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isLoading: authLoading, error: authError, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreeToTerms?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const validateForm = () => {
    const errors: typeof formErrors = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full Name is required';
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/[0-9]/.test(password)) {
      errors.password = 'Password must include at least one number';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the Terms of Service & Privacy Policy';
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
      await signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        agreeToTerms,
      });

      setSuccessMsg('Account registered successfully! Redirecting to dashboard...');

      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (err: any) {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignUp = (provider: 'google' | 'github') => {
    setIsSubmitting(true);
    setTimeout(() => {
      signUp({
        fullName: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Analyst`,
        email: `new_${provider}_user@agency.org`,
        password: 'SocialSecretPass123!',
        confirmPassword: 'SocialSecretPass123!',
        agreeToTerms: true,
      }).then(() => {
        setSuccessMsg(`Account created via ${provider.charAt(0).toUpperCase() + provider.slice(1)}! Redirecting...`);
        setTimeout(() => navigate('/dashboard'), 750);
      });
    }, 600);
  };

  return (
    <AuthLayout activeTab="signup">
      <div className="flex flex-col text-left">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white tracking-tight">Create your account</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Join the platform for multimodal deepfake detection
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

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Full Name"
            type="text"
            required
            placeholder="John Doe or Analyst ID"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (formErrors.fullName) {
                setFormErrors((prev) => ({ ...prev, fullName: undefined }));
              }
            }}
            error={formErrors.fullName}
            leftIcon={<UserIcon className="w-4 h-4" />}
            autoComplete="name"
            disabled={isSubmitting || !!successMsg}
          />

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="analyst@agency.org"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (formErrors.email) {
                setFormErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            error={formErrors.email}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
            disabled={isSubmitting || !!successMsg}
          />

          <div>
            <Input
              label="Password"
              isPassword
              required
              placeholder="Create strong password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formErrors.password) {
                  setFormErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              error={formErrors.password}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
              disabled={isSubmitting || !!successMsg}
            />

            {/* Real-time Strength Meter */}
            <PasswordStrengthMeter password={password} />
          </div>

          <Input
            label="Confirm Password"
            isPassword
            required
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (formErrors.confirmPassword) {
                setFormErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }
            }}
            error={formErrors.confirmPassword}
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete="new-password"
            disabled={isSubmitting || !!successMsg}
          />

          {/* Terms & Conditions Checkbox */}
          <div className="pt-1">
            <Checkbox
              checked={agreeToTerms}
              onChange={(e) => {
                setAgreeToTerms(e.target.checked);
                if (formErrors.agreeToTerms) {
                  setFormErrors((prev) => ({ ...prev, agreeToTerms: undefined }));
                }
              }}
              error={formErrors.agreeToTerms}
              disabled={isSubmitting || !!successMsg}
              label={
                <span>
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTermsModal(true);
                    }}
                    className="text-sky-400 hover:text-sky-300 underline font-medium"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTermsModal(true);
                    }}
                    className="text-sky-400 hover:text-sky-300 underline font-medium"
                  >
                    Privacy Policy
                  </button>
                </span>
              }
            />
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
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-zinc-900/90 px-3 text-zinc-400 font-medium tracking-wider">
              Or sign up with
            </span>
          </div>
        </div>

        {/* Social Authentication */}
        <div className="grid grid-cols-2 gap-2.5">
          <SocialButton
            provider="google"
            onClick={() => handleSocialSignUp('google')}
            disabled={isSubmitting || !!successMsg}
          />
          <SocialButton
            provider="github"
            onClick={() => handleSocialSignUp('github')}
            disabled={isSubmitting || !!successMsg}
          />
        </div>

        {/* Link to Sign In */}
        <p className="mt-5 text-center text-xs text-zinc-400">
          Already have an account?{' '}
          <Link
            to="/"
            className="font-semibold text-sky-400 hover:text-sky-300 hover:underline transition-colors ml-1"
          >
            Sign In
          </Link>
        </p>
      </div>

      {/* Terms & Conditions Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </AuthLayout>
  );
};
