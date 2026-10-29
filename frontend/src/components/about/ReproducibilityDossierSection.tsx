import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Copy, Check, FileCode, CheckCircle2 } from 'lucide-react';

export const ReproducibilityDossierSection: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [openDrawer, setOpenDrawer] = useState<'commands' | 'artifacts' | 'splits' | null>('commands');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleDrawer = (drawer: 'commands' | 'artifacts' | 'splits') => {
    setOpenDrawer(openDrawer === drawer ? null : drawer);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
          <Terminal className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-navy-900">
            5. Reproducibility & Technical Provenance Dossier
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Verification commands, local environment runtime steps, artifact trees, and audit hashes.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Drawer 1: Local Launch & Testing Commands */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleDrawer('commands')}
            className="w-full p-4 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-navy-900 hover:bg-slate-100/70 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-teal-700" />
              <span>Local Service Execution & Verification Test Commands</span>
            </div>
            {openDrawer === 'commands' ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {openDrawer === 'commands' && (
            <div className="p-4 pt-0 border-t border-slate-200 text-xs space-y-4">
              {/* Command 1: Backend */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-600 font-medium text-[11px]">
                  <span>Launch FastAPI Inference Backend (Port 8000 on CUDA):</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        '.\\.venv\\Scripts\\python.exe -m uvicorn backend.app:app --host 127.0.0.1 --port 8000',
                        'backend'
                      )
                    }
                    className="inline-flex items-center gap-1 text-teal-700 hover:underline"
                  >
                    {copiedKey === 'backend' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedKey === 'backend' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-navy-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                  <code>.\.venv\Scripts\python.exe -m uvicorn backend.app:app --host 127.0.0.1 --port 8000</code>
                </pre>
              </div>

              {/* Command 2: Frontend */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-600 font-medium text-[11px]">
                  <span>Launch React + Vite Frontend (Port 5173):</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard('cd frontend\nnpm run dev', 'frontend')
                    }
                    className="inline-flex items-center gap-1 text-teal-700 hover:underline"
                  >
                    {copiedKey === 'frontend' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedKey === 'frontend' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-navy-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                  <code>cd frontend; npm run dev</code>
                </pre>
              </div>

              {/* Command 3: Pytest Suite */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-600 font-medium text-[11px]">
                  <span>Execute Automated Backend Pytest Suite:</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        '.\\.venv\\Scripts\\python.exe -m pytest backend\\tests\\test_api.py -v -o pythonpath=.',
                        'pytest'
                      )
                    }
                    className="inline-flex items-center gap-1 text-teal-700 hover:underline"
                  >
                    {copiedKey === 'pytest' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedKey === 'pytest' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-navy-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                  <code>.\.venv\Scripts\python.exe -m pytest backend\tests\test_api.py -v -o pythonpath=.</code>
                </pre>
              </div>

              {/* Command 4: Checkpoint Hash */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-600 font-medium text-[11px]">
                  <span>Verify Model Checkpoint Cryptographic Hash:</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        'Get-FileHash -Algorithm MD5 checkpoints\\Swin_MC_best_model.pth',
                        'hash'
                      )
                    }
                    className="inline-flex items-center gap-1 text-teal-700 hover:underline"
                  >
                    {copiedKey === 'hash' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedKey === 'hash' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-navy-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                  <code>Get-FileHash -Algorithm MD5 checkpoints\Swin_MC_best_model.pth</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Drawer 2: Research Artifact Locations */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleDrawer('artifacts')}
            className="w-full p-4 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-navy-900 hover:bg-slate-100/70 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              <span>Immutable Research Artifact Locations & Manifest</span>
            </div>
            {openDrawer === 'artifacts' ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {openDrawer === 'artifacts' && (
            <div className="p-4 pt-0 border-t border-slate-200 text-xs font-mono space-y-2">
              <div className="p-2.5 rounded bg-white border border-slate-200 space-y-1">
                <span className="text-slate-500 font-sans block text-[10px] uppercase font-bold">Model Checkpoint</span>
                <span className="text-navy-900 select-all">checkpoints/Swin_MC_best_model.pth</span>
              </div>
              <div className="p-2.5 rounded bg-white border border-slate-200 space-y-1">
                <span className="text-slate-500 font-sans block text-[10px] uppercase font-bold">Historical Baseline Evaluation</span>
                <span className="text-navy-900 select-all">evaluation_results/baseline_report.txt</span>
              </div>
              <div className="p-2.5 rounded bg-white border border-slate-200 space-y-1">
                <span className="text-slate-500 font-sans block text-[10px] uppercase font-bold">Phase 10 Paired Comparison Metrics</span>
                <span className="text-navy-900 select-all">experiments/revision_05/runs_revision_05/validation_comparison.json</span>
              </div>
              <div className="p-2.5 rounded bg-white border border-slate-200 space-y-1">
                <span className="text-slate-500 font-sans block text-[10px] uppercase font-bold">10,000 Paired Bootstrap Uncertainty</span>
                <span className="text-navy-900 select-all">experiments/revision_05/runs_revision_05/paired_validation_uncertainty.json</span>
              </div>
              <div className="p-2.5 rounded bg-white border border-slate-200 space-y-1">
                <span className="text-slate-500 font-sans block text-[10px] uppercase font-bold">Scientific Phase 10 Comparison Dossier</span>
                <span className="text-navy-900 select-all">research_reports/PHASE_10_MATCHED_SAMPLING_COMPARISON.md</span>
              </div>
            </div>
          )}
        </div>

        {/* Drawer 3: Subject-Disjoint Partition Methodology */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleDrawer('splits')}
            className="w-full p-4 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-navy-900 hover:bg-slate-100/70 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              <span>Subject-Disjoint Partition Methodology & Leakage Prevention</span>
            </div>
            {openDrawer === 'splits' ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {openDrawer === 'splits' && (
            <div className="p-4 pt-0 border-t border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                In dermatological computer vision, patients frequently contribute multiple images across different lesion sites or clinic visits. Random image-level splitting causes severe data leakage because the neural network can recognize recurring patient-specific visual features.
              </p>
              <p>
                To eliminate data leakage, SamaDerma enforces <strong>patient-cluster-level partitioning</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-slate-700">
                <li>Training Set: 3,519 images across 1,917 patients ($Subject\_ID$).</li>
                <li>Validation Set: 880 images across 479 patients ($Subject\_ID$).</li>
                <li>Overlap: Exactly <strong>0 shared patients</strong> between training and validation.</li>
                <li>The official 1,051-image test split was completely isolated and not accessed during Phase 10 training or checkpoint selection.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
