import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-50/95 border-b border-amber-200/80 px-3.5 py-2 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm text-amber-950">
        <div className="flex items-center gap-2 font-medium leading-snug">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Educational & Research Demonstration Only:</strong> Not a medical device or diagnostic service. An image alone cannot diagnose skin disease. Model scores are uncalibrated and must never be used for healthcare or clinical decisions.
          </span>
        </div>
        <span className="shrink-0 px-2 py-0.5 rounded bg-amber-200/70 text-amber-900 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">
          Non-Clinical
        </span>
      </div>
    </div>
  );
};
