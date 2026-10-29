import React from 'react';
import { ShieldCheck, Cpu, Scale } from 'lucide-react';
import { WorkflowStep } from '../data/homeHighlights';

interface WorkflowCardProps {
  step: WorkflowStep;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({ step }) => {
  const getIcon = (name: WorkflowStep['iconName']) => {
    switch (name) {
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-teal-700" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-teal-700" />;
      case 'Scale':
        return <Scale className="w-5 h-5 text-teal-700" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-teal-700" />;
    }
  };

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-sm flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
            Phase {step.stepNumber}
          </span>
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center">
            {getIcon(step.iconName)}
          </div>
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
          {step.category}
        </span>
        <h3 className="text-base font-bold text-navy-900 leading-snug">
          {step.title}
        </h3>

        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {step.description}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100">
        <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          {step.technicalDetail}
        </span>
      </div>
    </div>
  );
};
