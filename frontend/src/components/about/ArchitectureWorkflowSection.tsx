import React from 'react';
import { Cpu, ShieldCheck, Server, Globe, Zap, HardDrive } from 'lucide-react';
import { AUDITED_LABEL_ORDER } from '../../types';

export const ArchitectureWorkflowSection: React.FC = () => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-navy-900">
              2. Model & Inference Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              End-to-end technical specifications from client preflight checks to GPU-accelerated PyTorch forward pass.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 self-start sm:self-auto">
          timm swin_base_patch4_window12_384
        </span>
      </div>

      {/* Visual Workflow Diagram */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Inference Execution Pipeline & Lifecycle
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 relative">
            <div className="flex items-center justify-between font-bold text-navy-900">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-teal-700" />
                <span>1. Client Preflight</span>
              </span>
              <span className="text-[10px] bg-slate-200/80 px-1.5 py-0.5 rounded font-mono">Browser</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Image selected locally. Verified in-memory for JPEG/PNG/WebP, file size $\le 12$ MB, and decoded canvas resolution $\le 40$ MP. Zero network transfer until preflight passes.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 relative">
            <div className="flex items-center justify-between font-bold text-navy-900">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-teal-700" />
                <span>2. FastAPI Bridge</span>
              </span>
              <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-mono">HTTP / HTTPS</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Transmitted to the configured FastAPI backend via <code>POST /api/predict</code> as multipart payload. Read directly into an in-memory buffer; <strong>strictly zero file persistence on disk or database storage</strong>.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 relative">
            <div className="flex items-center justify-between font-bold text-navy-900">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-teal-700" />
                <span>3. PyTorch Swin-B</span>
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">CUDA / GPU</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Image resized to $512 \times 512$ with verified normalization. Forward pass on NVIDIA RTX 3050 (6GB) executes in ~35ms, generating 8 raw output logits.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 relative">
            <div className="flex items-center justify-between font-bold text-navy-900">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-teal-700" />
                <span>4. Results Hydration</span>
              </span>
              <span className="text-[10px] bg-slate-200/80 px-1.5 py-0.5 rounded font-mono">UI View</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              FastAPI returns softmax-normalized uncalibrated scores summing to 100.0%. Results page renders 8-class distribution, calibration advisory, and Fairness Lab cross-reference.
            </p>
          </div>
        </div>
      </div>

      {/* Model Architecture & Preprocessing Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        {/* Architecture Specs */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between font-bold text-navy-900 text-sm">
            <span>Model Specifications</span>
            <span className="text-xs font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              PyTorch 2.11 + cu128
            </span>
          </div>
          <div className="space-y-2 font-mono text-[11px]">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Base Backbone:</span>
              <span className="text-navy-900 font-bold">swin_base_patch4_window12_384</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Input Resolution:</span>
              <span className="text-navy-900">512 × 512 × 3 (RGB)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Linear Head Dimensions:</span>
              <span className="text-navy-900">Linear(in=1024, out=8)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Channel Normalization (Mean):</span>
              <span className="text-navy-900">[0.5375, 0.4588, 0.4038]</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Channel Normalization (Std):</span>
              <span className="text-navy-900">[0.2163, 0.2037, 0.2014]</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-sans">Compute Device:</span>
              <span className="text-emerald-700 font-bold">NVIDIA GeForce RTX 3050 (6GB)</span>
            </div>
          </div>
        </div>

        {/* Checkpoint Provenance & Audited Mapping */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between font-bold text-navy-900 text-sm">
            <span>Checkpoint Provenance & Checksum</span>
            <ShieldCheck className="w-4 h-4 text-teal-700" />
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">
            The checkpoint file (<code>checkpoints/Swin_MC_best_model.pth</code>, 347.6 MB) was verified against the published Harvard Dataverse repository metadata:
          </p>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-navy-900 space-y-1">
            <div className="text-slate-500 text-[10px] font-sans uppercase font-bold">Cryptographic MD5 Hash</div>
            <div className="font-bold select-all">1071116c406f14625ccd653bf1fde094</div>
          </div>
          <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 leading-normal">
            <strong>Scientific Integrity Rule:</strong> Cryptographic checksums verify file binary integrity and provenance to the published artifact. A matching checksum does <em>not</em> prove model accuracy, generalizability, or clinical validity.
          </p>
        </div>
      </div>

      {/* Audited 8-Class Index Order */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
        <h4 className="font-bold text-navy-900 text-xs uppercase tracking-wider">
          Audited Semantic Output Label Mapping (Index 0 to 7)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          {AUDITED_LABEL_ORDER.map((category, idx) => (
            <div key={idx} className="p-2 rounded bg-white border border-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                {idx}
              </span>
              <span className="text-[11px] font-sans text-navy-900 truncate" title={category}>
                {category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
