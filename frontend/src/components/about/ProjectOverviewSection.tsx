import React from 'react';
import { BookOpen, AlertCircle, Compass, Target } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';

export const ProjectOverviewSection: React.FC = () => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-navy-900">
              1. Project Scope & Research Mission
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Investigating algorithmic fairness, demographic representation, and trade-offs in clinical dermatology AI.
            </p>
          </div>
        </div>
        <StatusBadge variant="validation" size="sm">
          Academic Research Prototype
        </StatusBadge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm text-slate-600 leading-relaxed">
        {/* Core Description */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-navy-900">
            <BookOpen className="w-4 h-4 text-teal-700" />
            <span>What SamaDerma Is</span>
          </div>
          <p>
            <strong>SamaDerma</strong> is an open-source, academic machine learning research platform designed to audit and evaluate demographic disparities in dermatological computer vision. It investigates how deep vision transformer models perform across diverse skin-tone groups when trained on clinical dermatology datasets.
          </p>
          <p>
            The project provides an interactive analytical testbed connecting genuine PyTorch model inference to transparent subgroup fairness dashboards, allowing researchers to inspect classification behavior, statistical uncertainty, and representation trade-offs.
          </p>
        </div>

        {/* The Fairness Problem */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-navy-900">
            <Target className="w-4 h-4 text-teal-700" />
            <span>The Algorithmic Fairness Problem</span>
          </div>
          <p>
            Dermatological AI models frequently exhibit sharp performance disparities across different skin tones. Historical computer vision benchmarks have been disproportionately trained on fair skin types (Fitzpatrick I–II), leading to performance degradation on richer melanin tones (Fitzpatrick IV–VI).
          </p>
          <p>
            Crucially, <strong>aggregate accuracy alone is an insufficient safety metric</strong>: an overall accuracy of 70.69% can obscure severe diagnostic recall drops in specific demographic cohorts, posing unaddressed safety risks.
          </p>
        </div>
      </div>

      {/* Research Question & Non-Clinical Notice */}
      <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-3 text-xs sm:text-sm">
        <div className="flex items-start gap-2.5">
          <Target className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-navy-900">
              Central Research Question
            </p>
            <p className="text-slate-700 leading-relaxed">
              <em>Can diagnosis-aware skin-tone sampling strategies (such as capped tone reweighting) improve subgroup classification parity across Fitzpatrick groups without unacceptably compromising overall model accuracy and diagnostic recall on other vital disease categories?</em>
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-teal-200/60 flex items-start gap-2.5 text-slate-600">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>Crucial Boundary:</strong> SamaDerma is an experimental research prototype, not a medical device. It does not provide clinical diagnoses, medical triage, or patient treatment plans. The research investigates mathematical sampling policies and observational metrics only.
          </p>
        </div>
      </div>
    </section>
  );
};
