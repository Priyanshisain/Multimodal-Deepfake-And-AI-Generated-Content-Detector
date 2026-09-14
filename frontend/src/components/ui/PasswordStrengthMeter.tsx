import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import type { PasswordCriteria, PasswordStrength } from '../../types/auth';

export interface PasswordStrengthMeterProps {
  password?: string;
  showRequirements?: boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password = '',
  showRequirements = true,
}) => {
  const criteria: PasswordCriteria = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const { strength, score }: { strength: PasswordStrength; score: number } = useMemo(() => {
    if (!password) return { strength: 'empty', score: 0 };

    let passedCount = 0;
    if (criteria.minLength) passedCount++;
    if (criteria.hasUppercase && criteria.hasLowercase) passedCount++;
    if (criteria.hasNumber) passedCount++;
    if (criteria.hasSpecialChar) passedCount++;

    if (passedCount <= 1) return { strength: 'weak', score: 1 };
    if (passedCount === 2) return { strength: 'fair', score: 2 };
    if (passedCount === 3) return { strength: 'good', score: 3 };
    return { strength: 'strong', score: 4 };
  }, [password, criteria]);

  const strengthConfig: Record<PasswordStrength, { label: string; color: string; text: string }> = {
    empty: { label: '', color: 'bg-zinc-800', text: 'text-zinc-600' },
    weak: { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400' },
    fair: { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400' },
    good: { label: 'Good', color: 'bg-yellow-400', text: 'text-yellow-300' },
    strong: { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' },
  };

  if (!password && !showRequirements) return null;

  return (
    <div className="w-full flex flex-col gap-2 mt-1">
      {/* 4 Segment Progress Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 grid grid-cols-4 gap-1.5 h-1.5">
          {[1, 2, 3, 4].map((step) => {
            const isFilled = score >= step;
            const segmentColor = isFilled
              ? strengthConfig[strength].color
              : 'bg-zinc-800';

            return (
              <div
                key={step}
                className={`rounded-full transition-all duration-300 ${segmentColor}`}
              />
            );
          })}
        </div>

        {password && (
          <span
            className={`text-xs font-semibold uppercase tracking-wider shrink-0 ml-2 ${
              strengthConfig[strength].text
            }`}
          >
            {strengthConfig[strength].label}
          </span>
        )}
      </div>

      {/* Checklist */}
      {showRequirements && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            {criteria.minLength ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            )}
            <span className={criteria.minLength ? 'text-zinc-200' : ''}>
              8+ characters
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {criteria.hasUppercase && criteria.hasLowercase ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            )}
            <span
              className={
                criteria.hasUppercase && criteria.hasLowercase ? 'text-zinc-200' : ''
              }
            >
              Upper & lower case
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {criteria.hasNumber ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            )}
            <span className={criteria.hasNumber ? 'text-zinc-200' : ''}>
              At least 1 number
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {criteria.hasSpecialChar ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            )}
            <span className={criteria.hasSpecialChar ? 'text-zinc-200' : ''}>
              Special character
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
