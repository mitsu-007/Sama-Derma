import React from 'react';
import { ShieldCheck, Cpu, Layers, Info } from 'lucide-react';

/**
 * HeroInspectionPreview: Conceptual illustration of SamaDerma's image-processing
 * and fairness auditing pipeline.
 *
 * SCIENTIFIC INTEGRITY & ETHICAL SAFEGUARDS:
 * - This is an abstract, conceptual architectural representation.
 * - DOES NOT fabricate patient photos, medical scans, or simulated disease predictions.
 * - DOES NOT display fake probability percentages or unverified telemetry.
 * - Clearly labeled as a conceptual design illustration.
 */
export const HeroInspectionPreview: React.FC = () => {
  return (
    <div className="relative w-full rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm shadow-slate-900/5 overflow-hidden transition-all hover:shadow-md">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
            System Pipeline Architecture
          </span>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100/90 px-2.5 py-0.5 rounded-full border border-slate-200">
          Conceptual Illustration
        </span>
      </div>

      {/* Conceptual Workflow Schematic (SVG + Flex) */}
      <div className="space-y-5">
        {/* Stage Flow Nodes */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Step 1 Node */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 space-y-1.5 flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-navy-900 leading-tight">1. In-Memory Preflight</span>
            <span className="text-[10px] text-slate-500">Client validation</span>
          </div>

          {/* Step 2 Node */}
          <div className="rounded-xl border border-teal-200/80 bg-teal-50/40 p-3 space-y-1.5 flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-navy-900 leading-tight">2. Swin-B Inference</span>
            <span className="text-[10px] text-slate-500">512×512 resolution</span>
          </div>

          {/* Step 3 Node */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 space-y-1.5 flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-teal-800 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-navy-900 leading-tight">3. Disparity Audit</span>
            <span className="text-[10px] text-slate-500">Subgroup analysis</span>
          </div>
        </div>

        {/* Stylized Swin Transformer Window Attention Graphic (SVG) */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-900 p-4 text-white relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs text-teal-400 font-mono">
              <Cpu className="w-3.5 h-3.5" />
              <span>Hierarchical Vision Transformer Architecture</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              Shifted-Window Attention
            </span>
          </div>

          {/* Abstract Vector Lattice Graphic */}
          <div className="py-2 flex items-center justify-center">
            <svg
              className="w-full h-24 text-teal-400"
              viewBox="0 0 360 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Stylized diagram of hierarchical patch partitioning and shifted window self-attention"
            >
              {/* Input Patch Grid (512x512 conceptual) */}
              <g opacity="0.85">
                <rect x="10" y="10" width="60" height="60" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <path d="M10 30H70 M10 50H70 M30 10V70 M50 10V70" stroke="#0ea5e9" strokeWidth="0.8" opacity="0.6" strokeDasharray="2 2" />
                <text x="40" y="76" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                  512×512 Patch
                </text>
              </g>

              {/* Connecting Attention Lines */}
              <g stroke="#0d9488" strokeWidth="1.2" opacity="0.7">
                <path d="M72 30 C 100 30, 110 25, 130 25" strokeDasharray="3 3" />
                <path d="M72 50 C 100 50, 110 55, 130 55" strokeDasharray="3 3" />
              </g>

              {/* Swin-B Hierarchical Attention Windows */}
              <g opacity="0.95">
                <rect x="130" y="10" width="100" height="60" rx="8" fill="#0f172a" stroke="#0d9488" strokeWidth="1.5" />
                {/* 4 Shifted Windows */}
                <rect x="136" y="16" width="40" height="22" rx="3" fill="#134e4a" stroke="#14b8a6" strokeWidth="1" />
                <rect x="184" y="16" width="40" height="22" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
                <rect x="136" y="42" width="40" height="22" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
                <rect x="184" y="42" width="40" height="22" rx="3" fill="#134e4a" stroke="#14b8a6" strokeWidth="1" />
                <text x="180" y="76" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                  Shifted Windows (12×12)
                </text>
              </g>

              {/* Connecting Vector Lines */}
              <g stroke="#0d9488" strokeWidth="1.2" opacity="0.7">
                <path d="M232 40 L 265 40" markerEnd="url(#arrow)" />
              </g>

              {/* 8-Class Diagnostic Vector */}
              <g opacity="0.85">
                <rect x="268" y="10" width="80" height="60" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <rect x="274" y="16" width="68" height="4" rx="2" fill="#14b8a6" />
                <rect x="274" y="24" width="48" height="4" rx="2" fill="#0284c7" />
                <rect x="274" y="32" width="56" height="4" rx="2" fill="#64748b" />
                <rect x="274" y="40" width="38" height="4" rx="2" fill="#64748b" />
                <rect x="274" y="48" width="62" height="4" rx="2" fill="#64748b" />
                <text x="308" y="76" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                  8-Class Vector
                </text>
              </g>
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2.5 mt-1 font-mono">
            <span>Model: timm swin_base</span>
            <span className="text-teal-400">MD5: 1071116c</span>
          </div>
        </div>

        {/* Abstract Skin Tone Continuum Bar (Fitzpatrick / Monk Continuum) */}
        <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-navy-900">Dermatological Skin-Tone Continuum</span>
            <span className="text-[11px] text-slate-500 font-mono">Fitzpatrick & Monk Scales</span>
          </div>

          {/* Continuous gradient strip representing biological melanin diversity */}
          <div className="relative h-5 rounded-full overflow-hidden shadow-inner border border-slate-200">
            <div
              className="w-full h-full"
              style={{
                background:
                  'linear-gradient(to right, #F9E4D4 0%, #F3D0B5 20%, #D8A581 40%, #A56D46 65%, #6C4124 85%, #341F14 100%)',
              }}
              aria-hidden="true"
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-medium px-1">
            <span>Type I–II (Fair)</span>
            <span>Type III–IV (Medium / Olive)</span>
            <span>Type V–VI (Deep / Dark)</span>
          </div>
        </div>

        {/* Guardrail and Status Footnote */}
        <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Research Notice:</strong> Conceptual diagram representing image validation, vision transformer feature extraction, and subgroup evaluation. Real inferences output uncalibrated scores strictly on validated inputs.
          </p>
        </div>
      </div>
    </div>
  );
};
