import React from 'react';
import { StatusBadge, BadgeVariant } from './StatusBadge';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  badge?: {
    text: string;
    variant: BadgeVariant;
  };
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  badge,
  highlight = false,
}) => {
  return (
    <div
      className={`rounded-xl border bg-white p-5 transition-shadow hover:shadow-sm ${
        highlight
          ? 'border-teal-300 ring-1 ring-teal-200/60 bg-gradient-to-b from-teal-50/20 to-white'
          : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {badge && (
          <StatusBadge variant={badge.variant} size="sm">
            {badge.text}
          </StatusBadge>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">
        {value}
      </div>
      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
