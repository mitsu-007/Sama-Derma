import React from 'react';
import { History, GitCompare, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { Link } from 'react-router-dom';

export const ResearchFindingsSummarySection: React.FC = () => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-navy-900">
            4. Summary of Completed Research Experiments
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Comparing historical test benchmarks with the Phase 10 controlled paired validation trial.
          </p>
        </div>
        <Link
          to="/fairness"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition-colors self-start sm:self-auto border border-teal-200"
        >
          <span>Open Interactive Fairness Lab</span>
          <LinkIcon className="w-3.5 h-3.5 text-teal-700" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Regime 1: Historical Baseline */}
        <div className="rounded-xl border-2 border-amber-200/80 bg-amber-50/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-700" />
              <h3 className="font-bold text-navy-900 text-sm">
                Historical Original Checkpoint Evaluation
              </h3>
            </div>
            <StatusBadge variant="exploratory" size="sm">
              Exploratory Only
            </StatusBadge>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-amber-100">
              <span className="text-slate-600">Evaluated Images:</span>
              <span className="font-mono font-bold text-navy-900">1,051 Test Images</span>
            </div>
            <div className="flex justify-between py-1 border-b border-amber-100">
              <span className="text-slate-600">Test Accuracy:</span>
              <span className="font-mono font-bold text-navy-900">70.69%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-amber-100">
              <span className="text-slate-600">Macro F1 (8 classes):</span>
              <span className="font-mono font-bold text-navy-900">0.4472</span>
            </div>
            <div className="flex justify-between py-1 border-b border-amber-100">
              <span className="text-slate-600">Pigmentary Recall (FST 3):</span>
              <span className="font-mono font-bold text-slate-800">58.33% (28/48)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-amber-100">
              <span className="text-slate-600">Pigmentary Recall (FST 5):</span>
              <span className="font-mono font-bold text-slate-800">86.36% (38/44)</span>
            </div>
            <div className="flex justify-between py-1 bg-amber-100/60 px-2 rounded">
              <span className="text-amber-950 font-bold">Observed FST 3 − 5 Gap:</span>
              <span className="font-mono font-bold text-rose-700">−28.03 pp (p = 0.0049)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-amber-200 text-[11px] text-amber-900 space-y-1">
            <div className="flex items-center gap-1 font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Upstream Validation Leakage Limitation</span>
            </div>
            <p className="leading-relaxed">
              Upstream training assigned the official test split to its validation variable. These results cannot serve as independent confirmatory evidence of model generalizability or causal bias.
            </p>
          </div>
        </div>

        {/* Regime 2: Phase 10 Paired Validation Experiment */}
        <div className="rounded-xl border-2 border-teal-200/80 bg-teal-50/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-teal-700" />
              <h3 className="font-bold text-navy-900 text-sm">
                Phase 10 Controlled Paired Validation
              </h3>
            </div>
            <StatusBadge variant="validation" size="sm">
              Controlled Experiment
            </StatusBadge>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-teal-100">
              <span className="text-slate-600">Cohort Split:</span>
              <span className="font-mono font-bold text-navy-900">880 Images (479 Patients)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-teal-100">
              <span className="text-slate-600">Accuracy (Arm A vs B):</span>
              <span className="font-mono font-bold text-navy-900">71.48% vs 67.05% (−4.43 pp)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-teal-100">
              <span className="text-slate-600">Macro F1 (Arm A vs B):</span>
              <span className="font-mono font-bold text-navy-900">0.4923 vs 0.4660 (−0.0262)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-teal-100">
              <span className="text-slate-600">Infectious Recall (A vs B):</span>
              <span className="font-mono font-bold text-rose-700">81.49% vs 72.93% (−8.56 pp)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-teal-100">
              <span className="text-slate-600">Pigmentary Gap (A vs B):</span>
              <span className="font-mono font-bold text-teal-800">+6.36 pp vs +0.28 pp (−6.08 pp)</span>
            </div>
            <div className="flex justify-between py-1 bg-teal-100/60 px-2 rounded">
              <span className="text-teal-950 font-bold">95% Paired Bootstrap CI:</span>
              <span className="font-mono font-bold text-navy-900">[−18.94 pp, +6.06 pp]</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-teal-200 text-[11px] text-slate-700 space-y-1">
            <div className="font-bold text-navy-900">Scientific Interpretation</div>
            <p className="leading-relaxed">
              Because the 10,000-replicate cluster-bootstrap interval spans zero and Arm B experienced acute regressions in accuracy and Infectious Disorders recall, <strong>the experiment did not establish a successful fairness intervention</strong>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
