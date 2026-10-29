import React from 'react';
import { ShieldAlert, ArrowRight, Sparkles, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LimitationsResponsibleUseSection: React.FC = () => {
  return (
    <section className="rounded-2xl border-2 border-amber-200/80 bg-gradient-to-b from-amber-50/20 to-white p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-amber-100 pb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-navy-900">
            6. Limitations, Responsible Use & Research Governance
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Clinical boundaries, ethical restrictions, and future research directions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs sm:text-sm leading-relaxed">
        {/* Clinical Disclaimer */}
        <div className="p-4 rounded-xl border border-amber-200 bg-white space-y-2">
          <div className="flex items-center gap-2 font-bold text-navy-900 text-xs">
            <Stethoscope className="w-4 h-4 text-amber-700" />
            <span>Strict Clinical Restrictions</span>
          </div>
          <p className="text-slate-600 text-xs">
            SamaDerma is not a medical device. Computer vision scores are uncalibrated model outputs from a closed-world 8-class classifier. An automated model cannot substitute for a dermatologist's in-person physical examination, dermoscopy, patient medical history, or histopathology biopsy.
          </p>
        </div>

        {/* Dataset Limitations */}
        <div className="p-4 rounded-xl border border-amber-200 bg-white space-y-2">
          <div className="flex items-center gap-2 font-bold text-navy-900 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            <span>Dataset & Geographic Boundaries</span>
          </div>
          <p className="text-slate-600 text-xs">
            The reference dataset originates from tertiary dermatology centers in India. Performance observations may not generalize to different hospital systems, image capture sensors, lighting conditions, or global patient populations. Subgroup disparities reflect observational associations, not causal demographic bias.
          </p>
        </div>

        {/* Future Directions */}
        <div className="p-4 rounded-xl border border-amber-200 bg-white space-y-2">
          <div className="flex items-center gap-2 font-bold text-navy-900 text-xs">
            <Sparkles className="w-4 h-4 text-teal-700" />
            <span>Future Research Directions</span>
          </div>
          <p className="text-slate-600 text-xs">
            Subsequent phases require multi-center independent test cohorts, multi-seed training runs to capture seed variance, conformal prediction for calibrated confidence sets, and loss formulations that preserve vital disorder recalls while pursuing demographic parity.
          </p>
        </div>
      </div>

      {/* Action Bridge Banner */}
      <div className="p-5 rounded-xl border border-teal-200 bg-teal-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-navy-900 text-sm">
            Ready to explore the research platform?
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Test genuine model inference or dive into interactive subgroup disparity metrics.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <Link
            to="/analyze"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs shadow-sm transition-colors"
          >
            <span>Analyze Image</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/fairness"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-navy-900 font-semibold text-xs shadow-sm transition-colors border border-slate-200"
          >
            <span>Fairness Lab</span>
          </Link>
        </div>
      </div>
    </section>
  );
};
