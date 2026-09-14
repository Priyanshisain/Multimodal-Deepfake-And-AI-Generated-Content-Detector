import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  type?: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  message,
  onClose,
}) => {
  const typeConfig = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-950/40 text-emerald-100',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      border: 'border-rose-500/40',
      bg: 'bg-rose-950/40 text-rose-100',
    },
    info: {
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
      border: 'border-sky-500/40',
      bg: 'bg-sky-950/40 text-sky-100',
    },
  };

  const { icon, border, bg } = typeConfig[type];

  return (
    <div
      className={`
        flex items-center justify-between gap-3 px-4 py-3 rounded-xl border
        backdrop-filter backdrop-blur-md shadow-lg shadow-black/40 text-xs font-medium
        animate-fade-in ${border} ${bg}
      `}
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <span>{message}</span>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
