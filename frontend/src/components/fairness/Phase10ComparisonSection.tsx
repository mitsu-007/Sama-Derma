import React from 'react';
import { HelpCircle, GitCompare, XCircle } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';

export const Phase10ComparisonSection: React.FC = () => {
  return (
    <section className="rounded-2xl border-2 border-teal-200/80 bg-gradient-to-b from-teal-50/20 to-white p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <GitCompare className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-navy-900">
              C. Phase 10 Controlled Paired Validation Comparison
            </h2>
            <StatusBadge variant="validation" size="sm">
              Controlled Experiment
            </StatusBadge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Paired comparison between Arm A (Standard Balancing) and Arm B (Capped Tone Reweighting) on 880 validation images (479 subjects).
          </p>
        </div>
        <span className="text-xs font-mono text-teal-800 bg-teal-100/80 px-2.5 py-1 rounded border border-teal-200 self-start sm:self-auto">
          Source: validation_comparison.json
        </span>
      </div>

      {/* Honest Research Disclosure Callout */}
      <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/70 text-xs sm:text-sm text-teal-950 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1.5 leading-relaxed">
          <p className="font-bold text-teal-900">
            Honest Research Conclusion: Fairness Intervention Is Inconclusive
          </p>
          <p className="text-slate-700">
            While capped Fitzpatrick reweighting narrowed the observed Pigmentary Disorders FST 3 vs FST 5 recall gap from <strong>+6.36 pp</strong> to <strong>+0.28 pp</strong>, the 10,000-replicate paired subject-cluster bootstrap 95% confidence interval for the gap change is <strong>[-18.94 to +6.06] percentage points</strong>.
          </p>
          <div className="p-2.5 rounded-lg bg-white border border-teal-200/80 text-navy-900 font-medium space-y-1">
            <p className="text-slate-800">
              <strong>Key Statistical Finding:</strong> Because the bootstrap confidence interval spans zero, the data are statistically consistent with both a genuine narrowing (-18.94 pp) and an actual widening (+6.06 pp) of the disparity.
            </p>
            <p className="text-rose-700">
              <strong>Performance Trade-offs:</strong> Arm B suffered a -4.43 pp regression in overall validation accuracy, a -0.0262 drop in macro F1, and an acute -8.56 pp collapse in Infectious Disorders recall.
            </p>
          </div>
          <p className="font-semibold text-teal-950">
            Conclusion: The experiment does NOT establish a fairness improvement or justify clinical deployment of the reweighted model.
          </p>
        </div>
      </div>

      {/* Three Comparison Cards: Arm A, Arm B, Deltas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Arm A */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Baseline Strategy
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
              Arm A
            </span>
          </div>
          <div>
            <h3 className="font-bold text-navy-900 text-base">Standard Class-Balanced</h3>
            <p className="text-xs text-slate-500 mt-0.5">Inverse class frequency weighting ($1 / n_y$)</p>
          </div>
          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-600">Validation Accuracy:</span>
              <span className="font-bold text-navy-900">71.48%</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-600">Macro F1 (8 classes):</span>
              <span className="font-bold text-navy-900">0.4923</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-600">Cross-Entropy Loss:</span>
              <span className="font-mono text-slate-700">1.1805</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-600">Pigmentary FST 3 Recall:</span>
              <span className="font-semibold text-slate-800">80.65% (25/31)</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-600">Pigmentary FST 5 Recall:</span>
              <span className="font-semibold text-slate-800">74.29% (26/35)</span>
            </div>
            <div className="flex justify-between items-center py-0.5 bg-slate-50 px-2 rounded">
              <span className="text-slate-700 font-medium">Pigmentary Gap (3 − 5):</span>
              <span className="font-bold text-navy-900">+6.36 pp</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-600">Infectious Disorders Recall:</span>
              <span className="font-bold text-navy-900">81.49% (295/362)</span>
            </div>
          </div>
        </div>

        {/* Arm B */}
        <div className="rounded-xl border border-teal-200 bg-teal-50/20 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Intervention Strategy
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-800">
              Arm B
            </span>
          </div>
          <div>
            <h3 className="font-bold text-navy-900 text-base">Capped Tone Reweighting</h3>
            <p className="text-xs text-slate-500 mt-0.5">Fitzpatrick cell factor capped at 3×, normalized</p>
          </div>
          <div className="space-y-2 border-t border-teal-100/70 pt-3 text-xs">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-600">Validation Accuracy:</span>
              <span className="font-bold text-rose-700">67.05%</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-600">Macro F1 (8 classes):</span>
              <span className="font-bold text-rose-700">0.4660</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-600">Cross-Entropy Loss:</span>
              <span className="font-mono text-slate-700">1.2051</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-600">Pigmentary FST 3 Recall:</span>
              <span className="font-semibold text-slate-800">77.42% (24/31)</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-600">Pigmentary FST 5 Recall:</span>
              <span className="font-semibold text-slate-800">77.14% (27/35)</span>
            </div>
            <div className="flex justify-between items-center py-0.5 bg-teal-50/80 px-2 rounded">
              <span className="text-teal-900 font-medium">Pigmentary Gap (3 − 5):</span>
              <span className="font-bold text-teal-700">+0.28 pp</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-600">Infectious Disorders Recall:</span>
              <span className="font-bold text-rose-700">72.93% (264/362)</span>
            </div>
          </div>
        </div>

        {/* B − A Deltas & Paired Bootstrap Uncertainty */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Paired Statistical Evidence
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-700">
              B − A Deltas
            </span>
          </div>
          <div>
            <h3 className="font-bold text-navy-900 text-base">Paired Bootstrap Uncertainty</h3>
            <p className="text-xs text-slate-500 mt-0.5">10,000 paired subject-cluster resamples</p>
          </div>
          <div className="space-y-2.5 border-t border-slate-200 pt-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Accuracy Delta:</span>
              <div className="text-right">
                <span className="font-mono font-bold text-rose-600">-4.43 pp</span>
                <span className="text-[10px] text-slate-500 block">95% CI: [-6.83, -2.10] pp</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Macro F1 Delta:</span>
              <div className="text-right">
                <span className="font-mono font-bold text-rose-600">-0.0262</span>
                <span className="text-[10px] text-slate-500 block">95% CI: [-0.0475, -0.0064]</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Infectious Recall Delta:</span>
              <span className="font-mono font-bold text-rose-600">-8.56 pp</span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-800 font-bold">Pigmentary Gap Change:</span>
                <span className="font-mono font-bold text-teal-700">-6.08 pp</span>
              </div>
              <div className="mt-1.5 p-2 rounded bg-white border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                  95% Paired Cluster-Bootstrap Interval
                </span>
                <span className="text-sm font-mono font-extrabold text-navy-900">
                  [-18.94 pp, +6.06 pp]
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600">
                <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Interval crosses zero → unproven fairness gain.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Paired Metric Comparison Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-bold text-navy-900 text-xs sm:text-sm">
            Validation Metric Summary Table (Paired Cohort: 880 images, 479 subjects)
          </h3>
          <span className="text-[11px] text-slate-500">
            Checkpoint selection frozen rule: Validation Macro F1 at Epoch 7
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-slate-600 uppercase font-semibold border-b border-slate-200 text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Metric</th>
                <th className="py-2.5 px-4 text-right">Arm A (Class-Balanced)</th>
                <th className="py-2.5 px-4 text-right">Arm B (Capped Reweight)</th>
                <th className="py-2.5 px-4 text-right">B − A Delta</th>
                <th className="py-2.5 px-4 text-center">95% Paired Bootstrap Interval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 font-sans font-medium text-navy-900">Overall Accuracy</td>
                <td className="py-2.5 px-4 text-right font-bold">71.48%</td>
                <td className="py-2.5 px-4 text-right font-bold text-rose-700">67.05%</td>
                <td className="py-2.5 px-4 text-right text-rose-600 font-bold">-4.43 pp</td>
                <td className="py-2.5 px-4 text-center text-slate-600">[-6.83, -2.10] pp</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 font-sans font-medium text-navy-900">Macro F1 (8 classes)</td>
                <td className="py-2.5 px-4 text-right font-bold">0.4923</td>
                <td className="py-2.5 px-4 text-right font-bold text-rose-700">0.4660</td>
                <td className="py-2.5 px-4 text-right text-rose-600 font-bold">-0.0262</td>
                <td className="py-2.5 px-4 text-center text-slate-600">[-0.0475, -0.0064]</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 font-sans font-medium text-navy-900">Cross-Entropy Loss</td>
                <td className="py-2.5 px-4 text-right">1.1805</td>
                <td className="py-2.5 px-4 text-right">1.2051</td>
                <td className="py-2.5 px-4 text-right text-slate-600">+0.0246</td>
                <td className="py-2.5 px-4 text-center text-slate-400">—</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 font-sans font-medium text-navy-900">Pigmentary Gap (FST 3 − 5)</td>
                <td className="py-2.5 px-4 text-right font-bold">+6.36 pp</td>
                <td className="py-2.5 px-4 text-right font-bold text-teal-700">+0.28 pp</td>
                <td className="py-2.5 px-4 text-right text-teal-700 font-bold">-6.08 pp</td>
                <td className="py-2.5 px-4 text-center text-navy-900 font-bold bg-amber-50">
                  [-18.94, +6.06] pp (Crosses 0)
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 font-sans font-medium text-navy-900">Infectious Disorders Recall</td>
                <td className="py-2.5 px-4 text-right font-bold">81.49%</td>
                <td className="py-2.5 px-4 text-right font-bold text-rose-700">72.93%</td>
                <td className="py-2.5 px-4 text-right text-rose-600 font-bold">-8.56 pp</td>
                <td className="py-2.5 px-4 text-center text-slate-400">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
