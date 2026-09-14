import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      isPassword = false,
      type = 'text',
      className = '',
      id,
      required,
      disabled,
      autoComplete = 'off',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-zinc-300 tracking-wide flex items-center gap-1"
          >
            <span>{label}</span>
            {required && <span className="text-sky-400 font-bold">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-zinc-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={`
              w-full bg-zinc-900/90 border rounded-xl py-2.5 text-sm text-zinc-100 placeholder-zinc-500
              transition-all duration-200 outline-none
              ${leftIcon ? 'pl-11' : 'pl-3.5'}
              ${isPassword ? 'pr-11' : 'pr-3.5'}
              ${
                error
                  ? 'border-rose-500/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-zinc-800 hover:border-zinc-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed bg-zinc-950' : ''}
              ${className}
            `}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-zinc-300" />
              ) : (
                <Eye className="w-4 h-4 text-zinc-400" />
              )}
            </button>
          )}
        </div>

        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-rose-400 flex items-center gap-1 mt-0.5 animate-fade-in">
            <span>⚠️</span>
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-xs text-zinc-400 mt-0.5">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
