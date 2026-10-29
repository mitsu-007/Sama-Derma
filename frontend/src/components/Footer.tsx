import React from 'react';
import { Shield, BookOpen, ExternalLink, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white mt-16 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Col 1: Platform & Mission */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
                S
              </div>
              <span className="font-bold text-navy-900 tracking-tight text-base">
                SamaDerma AI Research
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Investigating algorithmic fairness, skin-tone subgroup performance, and diagnostic balance in dermatological computer vision.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>MD5: 1071116c406f14625ccd653bf1fde094</span>
            </div>
          </div>

          {/* Col 2: Dataset Provenance & Safeguards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-teal-600" />
              Dataset & Provenance Notes
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-2">
              Reference dataset: DermaCon-IN clinical dermatology collection archived on Harvard Dataverse (DOI 10.7910/DVN/W7OUZM). Licensed under <strong>CC BY-NC-SA 4.0</strong>.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>Demographic Notice:</strong> Geographic provenance is unverified at the individual image level. Skin-tone annotations (FST / MST) reflect curated observational ratings.
            </p>
          </div>

          {/* Col 3: Research Integrity & Limitations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              Research Scope & Governance
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Strictly non-diagnostic educational demonstration. Softmax scores are uncalibrated model outputs. Subgroup disparities from historical test splits are exploratory.
            </p>
            <a
              href="https://doi.org/10.7910/DVN/W7OUZM"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900 transition-colors"
            >
              <span>Harvard Dataverse Record</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SamaDerma AI Research. For educational and scientific research purposes only.</p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-slate-400">Architecture: Swin-B 512×512 (8 Classes)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
