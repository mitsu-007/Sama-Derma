import React from 'react';
import { Database, ExternalLink, Shield, CheckCircle } from 'lucide-react';

export const DatasetProvenanceSection: React.FC = () => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-navy-900">
              3. Dataset Provenance, Demographics & Licensing
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Verified clinical archive documentation, demographic boundaries, and licensing constraints.
            </p>
          </div>
        </div>
        <a
          href="https://doi.org/10.7910/DVN/W7OUZM"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-navy-900 text-xs font-semibold transition-colors self-start sm:self-auto border border-slate-200"
        >
          <span>Harvard Dataverse Archive</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm leading-relaxed">
        {/* Dataset Details & License */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
          <div className="flex items-center gap-2 font-bold text-navy-900">
            <Shield className="w-4 h-4 text-teal-700" />
            <span>Dataset Identity & Legal License</span>
          </div>
          <div className="text-slate-600 space-y-2 text-xs">
            <p>
              <strong>Dataset:</strong> DermaCon-IN Clinical Dermatology Benchmark.
            </p>
            <p>
              <strong>Archive Identifier:</strong> Harvard Dataverse DOI <code>10.7910/DVN/W7OUZM</code>. Published and indexed in NeurIPS Datasets and Benchmarks Track.
            </p>
            <p>
              <strong>License:</strong> Distributed under <strong>Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)</strong>.
            </p>
            <p className="text-slate-500 text-[11px]">
              Usage Restrictions: Commercial deployment or proprietary monetization of the dataset is prohibited. Derivative works must preserve attribution and inherit share-alike terms.
            </p>
          </div>
        </div>

        {/* Demographics: Knowns vs Unknowns */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
          <div className="flex items-center gap-2 font-bold text-navy-900">
            <CheckCircle className="w-4 h-4 text-teal-700" />
            <span>Demographic Provenance: Facts vs Unknowns</span>
          </div>
          <div className="text-slate-600 space-y-2 text-xs">
            <p>
              <strong>Verified Origin:</strong> Collected from outpatient clinical dermatology departments across medical institutes in India, capturing conditions prevalent in South Asian clinical practice.
            </p>
            <p>
              <strong>Untracked Details:</strong> Individual patient nationality, state/district of residence, socio-economic background, and clinical comorbidities are <strong>not recorded</strong> in the image metadata.
            </p>
            <p className="text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 text-[11px] leading-normal font-medium">
              <strong>Vital Demographic Boundary:</strong> Skin-tone annotations (Fitzpatrick FST and Monk MST) represent visual phenotypic pigmentation ratings. They <em>must never be equated</em> with patient nationality, race, ethnicity, or genetic ancestry.
            </p>
          </div>
        </div>
      </div>

      {/* Cohort Partition & Imbalance Notes */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-xs">
        <h4 className="font-bold text-navy-900 uppercase tracking-wider text-[11px]">
          Split Geometry & Subgroup Representation
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-sans block text-[10px]">Training Split</span>
            <span className="text-navy-900 font-bold text-sm">4,399 Images</span>
            <span className="text-slate-500 font-sans block text-[10px] mt-0.5">2,396 Distinct Patients</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-sans block text-[10px]">Phase 10 Validation Split</span>
            <span className="text-navy-900 font-bold text-sm">880 Images</span>
            <span className="text-slate-500 font-sans block text-[10px] mt-0.5">479 Distinct Patients (0 overlap)</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-sans block text-[10px]">Official Test Split</span>
            <span className="text-navy-900 font-bold text-sm">1,051 Images</span>
            <span className="text-slate-500 font-sans block text-[10px] mt-0.5">606 Distinct Patients (0 overlap)</span>
          </div>
        </div>
        <p className="text-slate-500 text-[11px] leading-relaxed">
          <strong>Representation Skew:</strong> The dataset exhibits acute class imbalance: Infectious Disorders accounts for 419 of the 1,051 test images (39.9%), while Neoplasms accounts for 12 cases (1.1%) and No Definite Diagnosis for 6 cases (0.6%). Skin tones are concentrated in FST 3–5 and MST 5–7, while FST 6 ($n=25$) and MST 9 ($n=1$) have very limited representation.
        </p>
      </div>
    </section>
  );
};
