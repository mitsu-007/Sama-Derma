import React, { useState } from 'react';
import { Sliders, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { ToneScale } from '../../types/fairness';
import { historicalSubgroupMetrics, historicalPriorityTests } from '../../data/fairnessData';

export const SubgroupExplorer: React.FC = () => {
  const [activeScale, setActiveScale] = useState<ToneScale>('Fitzpatrick');

  const filteredMetrics = historicalSubgroupMetrics.filter(
    (item) => item.scale === activeScale
  );

  const filteredPriorityTests = historicalPriorityTests.filter(
    (item) => item.scale === activeScale
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header & Scale Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-navy-900">
              D. Interactive Subgroup Exploration & Statistical Audit
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Inspecting classification accuracy, macro F1, and 95% Wilson intervals across skin-tone categories.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveScale('Fitzpatrick')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeScale === 'Fitzpatrick'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            Fitzpatrick Scale (FST 3–6)
          </button>
          <button
            type="button"
            onClick={() => setActiveScale('Monk')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeScale === 'Monk'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            Monk Skin Tone (MST 4–9)
          </button>
        </div>
      </div>

      {/* Contextual Notice */}
      <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-navy-900">
            Audit Source: skin_tone_fairness_results_fixed8.csv & fairness_confidence_intervals.csv
          </p>
          <p className="text-slate-600 leading-relaxed">
            Metrics below are derived from the 1,051-image historical test split evaluated on the verified 8-class Swin-B model. Shaded horizontal bars visualize the 95% Wilson score confidence interval surrounding each point estimate. Subgroups with $n \le 30$ are explicitly flagged for high estimation variance.
          </p>
        </div>
      </div>

      {/* Subgroup Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMetrics.map((item) => {
          const accPct = (item.accuracy * 100).toFixed(1);
          const ciLowerPct = item.ci95 ? (item.ci95[0] * 100).toFixed(1) : null;
          const ciUpperPct = item.ci95 ? (item.ci95[1] * 100).toFixed(1) : null;

          return (
            <div
              key={item.group}
              className={`p-5 rounded-xl border transition-all ${
                item.isSmallSample
                  ? 'border-amber-200/80 bg-amber-50/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-navy-900 text-sm">{item.group}</span>
                  {item.isSmallSample && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      <AlertTriangle className="w-3 h-3 text-amber-700" />
                      Small Sample ($n \le 30$)
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  $n = {item.n}$ ({item.correct}/{item.n} correct)
                </span>
              </div>

              {/* Accuracy & Macro F1 Stats */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Subgroup Accuracy</span>
                  <span className="text-lg font-bold text-navy-900">{accPct}%</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Macro F1 (8 Classes)</span>
                  <span className="text-lg font-bold text-navy-900">{item.macroF1.toFixed(4)}</span>
                </div>
              </div>

              {/* 95% Confidence Interval Range Bar */}
              {item.ci95 && (
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>95% Wilson CI</span>
                    <span className="font-semibold text-navy-900">
                      [{ciLowerPct}%, {ciUpperPct}%]
                    </span>
                  </div>

                  {/* Range Bar Graphic */}
                  <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    {/* Shaded interval */}
                    <div
                      className="absolute top-0 bottom-0 bg-teal-200/80 rounded-full"
                      style={{
                        left: `${item.ci95[0] * 100}%`,
                        width: `${(item.ci95[1] - item.ci95[0]) * 100}%`,
                      }}
                    />
                    {/* Point estimate marker */}
                    <div
                      className="absolute top-0 bottom-0 w-1.5 bg-teal-800 -ml-0.5"
                      style={{ left: `${item.accuracy * 100}%` }}
                      title={`Point Estimate: ${accPct}%`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}

              {item.isSmallSample && (
                <p className="mt-3 text-[11px] text-amber-800/90 leading-tight">
                  Notice: Small sample size ($n = {item.n}$) results in a broad confidence interval. This point estimate may be unstable and should not be interpreted in isolation.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Priority Disparity Statistical Hypotheses for Active Scale */}
      {filteredPriorityTests.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <CheckCircle className="w-4 h-4 text-teal-700" />
            <h3 className="font-bold text-navy-900 text-xs sm:text-sm">
              Verified Pairwise Disparity Tests ({activeScale} Scale)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-200/60 text-slate-600 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-2 px-3">Diagnosis</th>
                  <th className="py-2 px-3">Group A vs Group B</th>
                  <th className="py-2 px-3 text-right">A Recall (n)</th>
                  <th className="py-2 px-3 text-right">B Recall (n)</th>
                  <th className="py-2 px-3 text-right">Diff (A − B)</th>
                  <th className="py-2 px-3 text-right">p-value</th>
                  <th className="py-2 px-3 text-right">Holm Adj. p</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white font-mono text-[11px]">
                {filteredPriorityTests.map((test, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans font-medium text-navy-900">
                      {test.diagnosis}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      {test.groupA} vs {test.groupB}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {(test.groupARecall * 100).toFixed(1)}% ({test.groupAn})
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {(test.groupBRecall * 100).toFixed(1)}% ({test.groupBn})
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                      {test.differenceAminusBpp.toFixed(2)} pp
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {test.pValue.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-navy-900">
                      {test.holmAdjustedPValue.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
