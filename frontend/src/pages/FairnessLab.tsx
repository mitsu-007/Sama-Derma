import React from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import { ResearchOverview } from '../components/fairness/ResearchOverview';
import { HistoricalBaselineSection } from '../components/fairness/HistoricalBaselineSection';
import { Phase10ComparisonSection } from '../components/fairness/Phase10ComparisonSection';
import { SubgroupExplorer } from '../components/fairness/SubgroupExplorer';
import { DiagnosisToneMatrix } from '../components/fairness/DiagnosisToneMatrix';
import { MethodologySection } from '../components/fairness/MethodologySection';

export const FairnessLab: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Fairness Lab & Algorithmic Subgroup Audits
            </h1>
            <StatusBadge variant="validation" size="sm">
              Controlled Benchmark
            </StatusBadge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl leading-relaxed">
            Empirical investigation of classification parity across Fitzpatrick (FST) and Monk (MST) skin-tone annotations, comparing historical test benchmarks and Phase 10 paired validation experiments with subject-cluster bootstrap uncertainty.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Link
            to="/analyze"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs shadow-sm transition-colors"
          >
            <span>Run Image Analysis</span>
          </Link>
        </div>
      </div>

      {/* Section A: Research Overview & Principles */}
      <ResearchOverview />

      {/* Section B: Historical Baseline (Exploratory Test Evaluation) */}
      <HistoricalBaselineSection />

      {/* Section C: Phase 10 Controlled Comparison (Paired Validation Experiment) */}
      <Phase10ComparisonSection />

      {/* Section D: Interactive Subgroup Exploration (FST 3-6 & MST 4-9) */}
      <SubgroupExplorer />

      {/* Section E: Diagnosis-by-Skin-Tone Cross-Tabulation Matrix */}
      <DiagnosisToneMatrix />

      {/* Section F: Experimental Methodology & Scientific Limitations */}
      <MethodologySection />
    </div>
  );
};
