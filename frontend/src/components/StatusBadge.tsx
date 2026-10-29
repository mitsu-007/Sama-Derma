import React from 'react';
import { ShieldCheck, AlertCircle, Info, Sparkles } from 'lucide-react';

export type BadgeVariant = 'verified' | 'exploratory' | 'validation' | 'neutral' | 'warning';

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  children,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    verified: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
    },
    exploratory: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600" />,
    },
    validation: {
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-200',
      icon: <Sparkles className="w-3.5 h-3.5 text-teal-600" />,
    },
    neutral: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      icon: <Info className="w-3.5 h-3.5 text-slate-500" />,
    },
    warning: {
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
    },
  };

  const style = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses}`}
    >
      {style.icon}
      <span>{children}</span>
    </span>
  );
};
