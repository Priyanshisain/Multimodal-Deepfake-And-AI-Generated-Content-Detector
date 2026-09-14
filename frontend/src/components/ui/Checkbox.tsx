import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  checked,
  onChange,
  id,
  className = '',
  disabled,
  ...props
}) => {
  const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1 text-left">
      <label
        htmlFor={checkboxId}
        className={`flex items-start gap-2.5 cursor-pointer select-none group ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
      >
        <div className="relative flex items-center justify-center mt-0.5 shrink-0">
          <input
            id={checkboxId}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          <div
            className={`
              w-4 h-4 rounded-md border transition-all duration-200 flex items-center justify-center
              ${
                checked
                  ? 'bg-sky-500 border-sky-400 text-white shadow-sm shadow-sky-500/40'
                  : 'bg-zinc-900 border-zinc-700 group-hover:border-zinc-500'
              }
              ${error ? 'border-rose-500' : ''}
            `}
          >
            {checked && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        </div>

        <span className="text-xs text-zinc-300 group-hover:text-zinc-200 transition-colors leading-relaxed">
          {label}
        </span>
      </label>

      {error && (
        <p className="text-xs text-rose-400 flex items-center gap-1 pl-6 animate-fade-in">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
