import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldAlert, Cpu, Database, CheckCircle2 } from 'lucide-react';

export const MethodologySection: React.FC = () => {
  const [isLimitationsOpen, setIsLimitationsOpen] = useState(true);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-navy-900">
            F. Experimental Protocol, Statistical Rigor & Scientific Limitations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Reproducibility standards, sampling formulas, bootstrap specifications, and boundaries of inference.
          </p>
        </div>
      </div>

      {/* Protocol Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
          <div className="flex items-center gap-2 font-bold text-navy-900 text-xs">
            <CheckCircle2 className="w-4 h-4 text-teal-700" />
            <span>Subject-Disjoint Cohort Partition</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Derived strictly from training data: <strong>3,519 training images</strong> (1,917 subjects) and <strong>880 validation images</strong> (479 subjects). Verified zero subject overlap between splits (overlap = 0). The official test split was completely isolated and not accessed.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
          <div className="flex items-center gap-2 font-bold text-navy-900 text-xs">
            <Cpu className="w-4 h-4 text-teal-700" />
            <span>Sampling Strategies & Training Rule</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Common ImageNet-pretrained Swin-B initialization (SHA-256 <code>0f6f7d...</code>). Arm A: w = 1 / n_y. Arm B: (1 / n_y) · q_(y,g) with q_(y,g) = min(3, max(1, sqrt(n_y / n_(y,g)))) for cells with ≥ 20 unique subjects. 7 epochs, AdamW, cosine schedule. Checkpoint selection: validation macro F1 at epoch 7.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
          <div className="flex items-center gap-2 font-bold text-navy-900 text-xs">
            <CheckCircle2 className="w-4 h-4 text-teal-700" />
            <span>Paired Subject-Cluster Bootstrap</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            10,000 paired replicates (seed 20261028). Entire patient clusters (all images per subject) resampled simultaneously to preserve intra-subject clinical correlations. Quantifies validation-subject sampling uncertainty conditional on the fitted weights.
          </p>
        </div>
      </div>

      {/* Collapsible Scientific Limitations & Disclosures */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsLimitationsOpen(!isLimitationsOpen)}
          className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-amber-950 hover:bg-amber-100/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            <span>Explicit Scientific Limitations & Boundary Disclosures (5 Core Items)</span>
          </div>
          {isLimitationsOpen ? (
            <ChevronUp className="w-4 h-4 text-amber-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-amber-700" />
          )}
        </button>

        {isLimitationsOpen && (
          <div className="p-4 pt-0 border-t border-amber-200/60 text-xs text-amber-900/90 space-y-2.5 leading-relaxed">
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Non-Clinical Research Prototype:</strong> SamaDerma is an academic demonstration for representation fairness research. It is not approved by any regulatory body (FDA/CE) and must never be utilized for patient triage, dermatological screening, or medical diagnosis.
              </li>
              <li>
                <strong>Historical Checkpoint Leakage:</strong> As established in the Phase 1 & Phase 3 audits, upstream training of the original checkpoint used the official test split as its validation variable. Historical test results are therefore exploratory and cannot provide independent confirmatory evidence.
              </li>
              <li>
                <strong>Single Paired Training Seed:</strong> Phase 10 was executed with a single random seed (20261026). While the paired subject-cluster bootstrap properly quantifies validation sampling uncertainty for these fitted checkpoints, it does not capture variance across different training runs or random initializations.
              </li>
              <li>
                <strong>Intersectional Cell Sparsity:</strong> Certain diagnosis-by-skin-tone intersections contain very few cases (e.g., 1 case for Keratanisation Disorders in FST 3). Empirical metrics in these sparse cells have wide confidence intervals and must not be used to assert systematic bias.
              </li>
              <li>
                <strong>Non-Causal & Context-Specific:</strong> Observed subgroup disparities do not establish algorithmic causality. They reflect retrospective observations on a single clinical archive (DermaCon-IN, DOI 10.7910/DVN/W7OUZM) and may not generalize to different clinical environments, camera sensors, or patient populations.
              </li>
            </ol>
          </div>
        )}
      </div>
    </section>
  );
};
