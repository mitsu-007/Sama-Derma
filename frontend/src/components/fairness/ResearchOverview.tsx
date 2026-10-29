import React from 'react';
import { BookOpen, AlertTriangle, Layers, BarChart2 } from 'lucide-react';

export const ResearchOverview: React.FC = () => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-navy-900">
            A. Subgroup Fairness Evaluation & Methodological Principles
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Scientific foundation for auditing demographic disparities in dermatological computer vision.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm text-slate-600 leading-relaxed">
        {/* Principle 1 */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
          <div className="flex items-center gap-2 text-navy-900 font-semibold">
            <Layers className="w-4 h-4 text-teal-700" />
            <span>Why Aggregate Accuracy Is Insufficient</span>
          </div>
          <p>
            An overall test accuracy of <strong>70.69%</strong> obscures acute performance discrepancies within clinical subgroups. In high-stakes medical AI, models can achieve satisfactory aggregate scores while severely underperforming on specific demographic groups or rare pathology categories. Evaluating disaggregated subgroup performance is mandatory to uncover masked clinical risks.
          </p>
        </div>

        {/* Principle 2 */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
          <div className="flex items-center gap-2 text-navy-900 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Observed Disparity vs Demonstrated Bias</span>
          </div>
          <p>
            A measurable difference in subgroup accuracy or recall (e.g., FST 3 vs FST 5 Pigmentary Disorders) indicates an <em>empirical observational disparity</em>, <strong>not causal algorithmic bias</strong>. Disparities in non-randomized observational cohorts may reflect differential disease prevalence, image acquisition lighting, disease stage variations, or demographic confounding rather than intrinsic model prejudice.
          </p>
        </div>

        {/* Principle 3 */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
          <div className="flex items-center gap-2 text-navy-900 font-semibold">
            <BarChart2 className="w-4 h-4 text-teal-700" />
            <span>Sample Support & Statistical Uncertainty</span>
          </div>
          <p>
            Subgroup metrics without sample support counts ($n$) are mathematically misleading. When a subgroup or diagnosis cell contains fewer than 30 subjects, empirical estimates suffer extreme sampling variance. Confidence intervals (such as 95% Wilson score intervals or paired cluster-bootstraps) are essential to distinguish true performance differences from stochastic sampling noise.
          </p>
        </div>

        {/* Principle 4 */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
          <div className="flex items-center gap-2 text-navy-900 font-semibold">
            <BookOpen className="w-4 h-4 text-teal-700" />
            <span>Educational Research Governance</span>
          </div>
          <p>
            SamaDerma is an experimental research platform investigating fair representation algorithms. It does not provide medical devices, clinical diagnostic advice, or automated treatment recommendations. All metrics and confidence bounds presented here reflect offline retrospective analyses of curated benchmark splits.
          </p>
        </div>
      </div>
    </section>
  );
};
