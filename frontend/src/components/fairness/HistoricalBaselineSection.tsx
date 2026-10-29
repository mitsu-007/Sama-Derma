import React from 'react';
import { AlertCircle, History, Info } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { MetricCard } from '../MetricCard';
import { historicalTestSummary } from '../../data/historicalData';

export const HistoricalBaselineSection: React.FC = () => {
  return (
    <section className="rounded-2xl border-2 border-amber-200/80 bg-gradient-to-b from-amber-50/30 to-white p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <History className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-navy-900">
              B. Historical Checkpoint Baseline Evaluation
            </h2>
            <StatusBadge variant="exploratory" size="sm">
              Exploratory Only
            </StatusBadge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Retrospective evaluation of the original Swin-B checkpoint on the 1,051-image official test split.
          </p>
        </div>
        <span className="text-xs font-mono text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded border border-amber-200 self-start sm:self-auto">
          Source: baseline_report.txt
        </span>
      </div>

      {/* Upstream Checkpoint Selection Limitation Callout */}
      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-xs sm:text-sm text-amber-950 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1.5 leading-relaxed">
          <p className="font-bold text-amber-900">
            Critical Scientific Limitation: Upstream Validation Variable Leakage
          </p>
          <p className="text-amber-900/90">
            Project and data audits established that during original checkpoint selection, the official test split (1,051 images) was assigned to the upstream training pipeline's validation variable. Subgroup disparity hypotheses were subsequently inspected on these identical test results.
          </p>
          <p className="text-amber-900/90 font-medium">
            Consequently, these metrics are classified strictly as <strong>Exploratory</strong>. They do not constitute independent confirmatory evidence of model generalizability or causal demographic bias.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Evaluated Test Images"
          value={historicalTestSummary.evaluatedImages.toLocaleString()}
          subtitle="Fixed test split images evaluated on CUDA"
          badge={{ text: 'Test Split', variant: 'neutral' }}
        />
        <MetricCard
          label="Historical Test Accuracy"
          value={`${(historicalTestSummary.accuracy * 100).toFixed(2)}%`}
          subtitle="Overall classification accuracy (8 classes)"
          badge={{ text: 'Exploratory', variant: 'exploratory' }}
        />
        <MetricCard
          label="Historical Macro F1"
          value={historicalTestSummary.macroF1.toFixed(4)}
          subtitle="Unweighted macro average across all 8 classes"
          badge={{ text: '0.4472', variant: 'exploratory' }}
        />
        <MetricCard
          label="Pigmentary Recall Gap (FST 3 − 5)"
          value="-28.03 pp"
          subtitle="FST 3 (58.33%) vs FST 5 (86.36%)"
          badge={{ text: 'Observed Gap', variant: 'exploratory' }}
          highlight
        />
      </div>

      {/* Detailed Priority Disparity Breakdown Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-teal-700" />
            <h3 className="font-bold text-navy-900 text-sm">
              Primary Historical Exploratory Subgroup Disparity (Pigmentary Disorders)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Two-sided Fisher test: p = 0.00487 (Holm adj: 0.0243)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 space-y-1.5">
            <div className="flex items-center justify-between font-bold text-navy-900">
              <span>Fitzpatrick Group 3 (Lighter Tone Cohort)</span>
              <span className="text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Recall: 58.33%
              </span>
            </div>
            <div className="text-slate-600 space-y-1">
              <p>Sample Support: <strong>28 correct out of 48 cases</strong> ($n = 48$)</p>
              <p>95% Wilson Confidence Interval: <strong>[44.28%, 71.15%]</strong></p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 space-y-1.5">
            <div className="flex items-center justify-between font-bold text-navy-900">
              <span>Fitzpatrick Group 5 (Darker Tone Cohort)</span>
              <span className="text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Recall: 86.36%
              </span>
            </div>
            <div className="text-slate-600 space-y-1">
              <p>Sample Support: <strong>38 correct out of 44 cases</strong> ($n = 44$)</p>
              <p>95% Wilson Confidence Interval: <strong>[73.29%, 93.60%]</strong></p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 italic">
          Observed Gap calculation: Recall(FST 3) − Recall(FST 5) = 58.33% − 86.36% = −28.03 percentage points. Notice that the FST 3 95% CI upper bound (71.15%) does not overlap the FST 5 point estimate (86.36%), motivating the controlled paired reweighting intervention evaluated in Phase 10.
        </p>
      </div>
    </section>
  );
};
