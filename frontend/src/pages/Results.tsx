import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Cpu,
  ArrowLeft,
  Info,
  Layers,
  BarChart3,
  ExternalLink,
  RefreshCw,
  FileText,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Table as TableIcon,
  BookOpen,
  Stethoscope,
} from 'lucide-react';
import { ApiPredictionResponse } from '../api/inference';
import { StatusBadge } from '../components/StatusBadge';
import { getDiseaseTaxonomy } from '../data/diseaseTaxonomy';
import { REFERENCE_DEMONSTRATION, ReferenceDemonstrationData } from '../data/referenceDemonstration';

interface LocationState {
  prediction?: ApiPredictionResponse;
  imageMeta?: {
    fileName: string;
    fileSize: string;
    dimensions: string;
    format: string;
    previewUrl?: string;
    isReferenceDemonstration?: boolean;
  };
}

export const Results: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState | undefined;

  // View mode state for accessible table vs bar chart
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Fallback state for reference demonstration if user navigates directly
  const [demoData, setDemoData] = useState<ReferenceDemonstrationData | null>(null);

  // Active prediction and image metadata (from navigation state or loaded demonstration)
  const activePrediction = state?.prediction || demoData?.prediction;
  const activeMeta = state?.imageMeta || demoData?.imageMeta;
  const isDemo = Boolean(demoData || state?.imageMeta?.isReferenceDemonstration);

  // Handle direct navigation without a prediction
  if (!activePrediction) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center border border-slate-200">
          <Info className="w-8 h-8 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-navy-900 tracking-tight">
            No Active Inference Results
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            No image prediction is currently active in your session. To inspect a clinical image with the verified Swin-B vision transformer, select or drop an image on the Analyze page.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/analyze"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Analyze Page</span>
          </Link>

          <button
            onClick={() => setDemoData(REFERENCE_DEMONSTRATION)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy-900 font-semibold text-sm transition-colors border border-slate-200"
          >
            <BookOpen className="w-4 h-4 text-teal-700" />
            <span>Load Reference Evaluation</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 pt-2">
          Loading the reference evaluation displays genuine offline model outputs on a curated DermaCon-IN sample case for platform evaluation.
        </p>
      </div>
    );
  }

  // Calculate score parameters
  const topCategory = activePrediction.predicted_category;
  const topScore = activePrediction.predicted_score;
  const formattedTopPercent = (topScore * 100).toFixed(2);

  // Rule 1: Calculate and display the difference between the top two model scores in percentage points
  const runnerUpScore = activePrediction.scores.length > 1 ? activePrediction.scores[1].uncalibrated_score : 0;
  const runnerUpCategory = activePrediction.scores.length > 1 ? activePrediction.scores[1].category : '';
  const diffMarginPp = ((topScore - runnerUpScore) * 100).toFixed(2);

  // Retrieve traceable medical taxonomy reference
  const taxonomy = getDiseaseTaxonomy(topCategory);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Historical Reference Demonstration Notice (Per Rule 3) */}
      {isDemo && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 sm:p-5 text-indigo-950 shadow-sm space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-900">
              <BookOpen className="w-4 h-4 text-indigo-700 shrink-0" />
              <span>Historical Demonstration Case (Offline Benchmark)</span>
            </div>
            <StatusBadge variant="validation" size="sm">
              Fixed Reference Output
            </StatusBadge>
          </div>
          <p className="text-xs text-indigo-900/90 leading-relaxed">
            <strong>Demonstration Provenance:</strong> This view displays a fixed, documented model evaluation generated by the genuine Swin-B checkpoint (<code>1071116c406f14625ccd653bf1fde094</code>) evaluated on CUDA under PyTorch 2.11. This is an offline reference record from the DermaCon-IN repository, not a live user-uploaded inference.
          </p>
          <div className="pt-1 flex items-center justify-between text-xs text-indigo-800">
            <span>Sample Reference: <code>DERMACON_IN_REF_CASE_0002.jpg</code></span>
            <Link to="/analyze" className="font-semibold underline hover:text-indigo-950">
              Analyze a live image instead →
            </Link>
          </div>
        </div>
      )}

      {/* Top Header & Navigation Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Model Inspection Results
            </h1>
            <StatusBadge variant="verified" size="sm">
              Live PyTorch Output
            </StatusBadge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Genuine uncalibrated outputs from the verified <code>swin_base_patch4_window12_384</code> model.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Link
            to="/analyze"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Analyze Another Image</span>
          </Link>

          <Link
            to="/fairness"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-600" />
            <span>Fairness Lab</span>
          </Link>
        </div>
      </div>

      {/* Top Scoring Category Highlight Banner */}
      <div className="rounded-2xl border border-teal-300 ring-1 ring-teal-200/60 bg-gradient-to-b from-teal-50/40 via-white to-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            Top-Scoring Model Category (Not a Diagnosis)
          </span>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] font-semibold text-teal-800">
              Rank #1 of 8
            </span>
            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
              <Cpu className="w-3 h-3 text-slate-500" />
              <span>{activePrediction.device.toUpperCase()}</span>
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
            {topCategory}
          </h2>

          <div className="flex flex-wrap items-baseline gap-2 pt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-teal-700 font-mono tracking-tight">
              {formattedTopPercent}%
            </span>
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500">
              Uncalibrated model score
            </span>
          </div>
        </div>

        {/* Rule 1: Difference between the top two model scores */}
        <div className="pt-3 border-t border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-navy-900">
              Difference between the top two model scores:
            </span>
            <span className="font-mono font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded border border-teal-200">
              +{diffMarginPp} percentage points
            </span>
          </div>
          <span className="text-slate-500 text-[11px]">
            Rank #1 ({topCategory}: {formattedTopPercent}%) vs Rank #2 ({runnerUpCategory}: {(runnerUpScore * 100).toFixed(2)}%)
          </span>
        </div>

        {/* Input Image Metadata Snippet */}
        {activeMeta && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-medium">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono text-slate-700">{activeMeta.fileName}</span>
            </div>
            <div className="text-slate-500">
              Resolution: <strong className="text-navy-900 font-mono">{activeMeta.dimensions}</strong>
            </div>
            <div className="text-slate-500">
              Format: <strong className="text-navy-900">{activeMeta.format}</strong>
            </div>
            <div className="text-slate-500">
              File Size: <strong className="text-navy-900 font-mono">{activeMeta.fileSize}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Main Section: Complete 8-Class Distribution with Bar Chart / Accessible Table Switcher */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm space-y-0">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-700" />
            <h3 className="font-bold text-navy-900 text-sm sm:text-base">
              Diagnostic Category Distribution (8 Audited Classes)
            </h3>
          </div>

          {/* Accessible View Toggle (NHS Standard: Dual View) */}
          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Distribution presentation mode"
              className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium text-slate-600 shadow-sm"
            >
              <button
                type="button"
                onClick={() => setViewMode('chart')}
                aria-pressed={viewMode === 'chart'}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'chart'
                    ? 'bg-teal-700 text-white font-semibold'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Bar Chart</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-pressed={viewMode === 'table'}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-teal-700 text-white font-semibold'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Accessible Table</span>
              </button>
            </div>

            <span className="text-xs font-mono text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200 hidden sm:inline-block">
              Softmax Sum: 100.0%
            </span>
          </div>
        </div>

        {/* View Mode 1: Accessible Horizontal Bar Chart with Non-Color-Only Ranking Cues */}
        {viewMode === 'chart' && (
          <div className="divide-y divide-slate-100 p-2 sm:p-4 space-y-1">
            {activePrediction.scores.map((item, idx) => {
              const percent = (item.uncalibrated_score * 100).toFixed(2);
              const isTop = idx === 0;
              const rank = idx + 1;

              return (
                <div
                  key={item.category}
                  className={`p-3.5 sm:p-4 rounded-xl transition-colors ${
                    isTop
                      ? 'bg-teal-50/40 border border-teal-300 shadow-sm ring-1 ring-teal-200/50'
                      : 'hover:bg-slate-50/70 border border-transparent'
                  }`}
                >
                  {/* Text Line: Non-Color-Only Rank Badge, Class Index, Category Name, Score */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {/* Non-color-only Rank Cue */}
                      <span
                        className={`font-mono text-xs px-2 py-0.5 rounded font-bold border ${
                          isTop
                            ? 'bg-teal-800 text-white border-teal-900'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                        title={`Ranking position #${rank}`}
                      >
                        #{rank}
                      </span>

                      <span
                        className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
                        title={`Audited class index ${item.class_index}`}
                      >
                        Class {item.class_index}
                      </span>

                      <span
                        className={`text-sm sm:text-base font-bold ${
                          isTop ? 'text-navy-900 font-extrabold' : 'text-slate-800'
                        }`}
                      >
                        {item.category}
                      </span>

                      {isTop && (
                        <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider hidden sm:inline-block bg-teal-100/70 px-2 py-0.5 rounded border border-teal-200">
                          Top Category
                        </span>
                      )}
                    </div>

                    {/* Numeric Score */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
                        raw: {item.uncalibrated_score.toFixed(4)}
                      </span>
                      <span
                        className={`font-mono text-sm sm:text-base font-bold ${
                          isTop ? 'text-teal-800 font-extrabold' : 'text-navy-900'
                        }`}
                      >
                        {percent}%
                      </span>
                    </div>
                  </div>

                  {/* Accessible Visual Bar */}
                  <div
                    className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/60"
                    role="progressbar"
                    aria-label={`${item.category} uncalibrated score`}
                    aria-valuenow={parseFloat(percent)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTop
                          ? 'bg-gradient-to-r from-teal-600 to-teal-800'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.max(1, Math.min(100, item.uncalibrated_score * 100))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View Mode 2: Accessible Semantic Data Table (NHS Standard) */}
        {viewMode === 'table' && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <caption className="sr-only">
                Audited 8-Class Model Score Distribution from Swin-B vision transformer
              </caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th scope="col" className="py-2.5 px-3">Rank</th>
                  <th scope="col" className="py-2.5 px-3">Class Index</th>
                  <th scope="col" className="py-2.5 px-3">Diagnostic Category</th>
                  <th scope="col" className="py-2.5 px-3 text-right">Uncalibrated Score (%)</th>
                  <th scope="col" className="py-2.5 px-3 text-right font-mono">Raw Softmax</th>
                  <th scope="col" className="py-2.5 px-3 text-right">Difference vs Top (pp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activePrediction.scores.map((item, idx) => {
                  const percent = (item.uncalibrated_score * 100).toFixed(2);
                  const isTop = idx === 0;
                  const deltaVsTop = isTop ? '0.00 pp (Rank #1)' : `-${((topScore - item.uncalibrated_score) * 100).toFixed(2)} pp`;

                  return (
                    <tr
                      key={item.category}
                      className={isTop ? 'bg-teal-50/50 font-semibold' : 'hover:bg-slate-50/50'}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs border ${
                            isTop
                              ? 'bg-teal-800 text-white border-teal-900'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        Class {item.class_index}
                      </td>
                      <th scope="row" className="py-2.5 px-3 font-medium text-navy-900">
                        {item.category}
                        {isTop && (
                          <span className="ml-2 text-[10px] text-teal-800 font-bold uppercase tracking-wider bg-teal-100 px-1.5 py-0.5 rounded">
                            Top
                          </span>
                        )}
                      </th>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-navy-900">
                        {percent}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        {item.uncalibrated_score.toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {deltaVsTop}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rule 2: Clinical Condition Dossier with Reliable, Traceable Medical References */}
      {taxonomy && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-700" />
              <h3 className="text-base sm:text-lg font-bold text-navy-900">
                Clinical Condition Reference & Educational Dossier
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
              {taxonomy.icd11ChapterReference}
            </span>
          </div>

          {/* Mandatory Rule 2 Disclaimer: Distinguish general info from model predictions */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Scope & Model Boundary Notice (Not an Individual Diagnosis)</span>
            </div>
            <p className="leading-relaxed">
              This educational overview describes the general dermatological disease group as cataloged in peer-reviewed clinical reference literature. The Swin-B vision transformer in SamaDerma predicts <strong>broad category labels from the DermaCon-IN repository</strong>. The model <strong>DOES NOT</strong> diagnose or differentiate individual conditions within this category, and inclusion of a disease in the literature examples below does not imply that this model can identify it.
            </p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                General Clinical Overview
              </h4>
              <p className="text-slate-700 leading-relaxed">
                {taxonomy.generalDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <h5 className="font-bold text-navy-900 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-600" />
                  Representative Conditions in Medical Literature
                </h5>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  {taxonomy.representativeConditions.map((cond) => (
                    <li key={cond}>{cond}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <h5 className="font-bold text-navy-900 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  Common Clinical Morphology Patterns
                </h5>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  {taxonomy.clinicalMorphology.map((morph) => (
                    <li key={morph}>{morph}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-teal-50/40 border border-teal-200/70 text-xs text-slate-600 leading-relaxed">
              <strong className="text-teal-900">Research & Educational Notes: </strong>
              {taxonomy.educationalNotes}
            </div>

            {/* Traceable Literature Sources */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Source Attribution:</span>
              {taxonomy.literatureSources.map((src) => (
                <span key={src} className="italic">
                  • {src}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Educational & Methodological Explanations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Softmax Calibration Warning */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-navy-900 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Why Softmax Scores Are Not Calibrated Probabilities</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The values shown above are uncalibrated softmax scores produced by normalizing final model logits across the eight closed-world training categories.
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed">
            <li>
              <strong>Mathematical Sum:</strong> Scores sum to 100% by mathematical definition, not because the model possesses certainty.
            </li>
            <li>
              <strong>Uncalibrated:</strong> A 70% model score does not mean there is a 70% clinical probability that the diagnosis is correct.
            </li>
            <li>
              <strong>Closed World:</strong> Conditions outside the eight training categories will be forced into one of these labels.
            </li>
          </ul>
        </div>

        {/* Bridge to Fairness Lab */}
        <div className="rounded-2xl border border-teal-200 bg-teal-50/30 p-6 space-y-3 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
              <Sliders className="w-4 h-4 text-teal-700 shrink-0" />
              <span>Cross-Reference with Fairness Lab</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              How does the model perform for <strong>{topCategory}</strong> across different skin-tone annotations?
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              In historical test benchmarks, diagnostic accuracy and recall varied across Fitzpatrick and Monk skin-tone groups (for example, the observed FST 3 vs FST 5 Pigmentary Disorders gap).
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/fairness"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              <span>Explore Fairness Lab Data</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary Technical Specifications Area */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-700" />
            <h3 className="font-bold text-navy-900 text-sm">
              Technical Audit & Provenance Details
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            MD5: 1071116c406f14625ccd653bf1fde094
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] block">
              Model Architecture
            </span>
            <span className="font-mono text-navy-900 font-bold block truncate">
              swin_base_patch4_window12_384
            </span>
            <span className="text-slate-500 text-[11px] block">
              512 × 512 input resolution
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] block">
              Active Compute Device
            </span>
            <span className="font-mono text-teal-700 font-bold block">
              {activePrediction.device.toUpperCase()}
            </span>
            <span className="text-slate-500 text-[11px] block">
              PyTorch 2.11 + cu128
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] block">
              Channel Normalization
            </span>
            <span className="font-mono text-slate-700 text-[11px] block">
              μ: [0.537, 0.459, 0.404]
            </span>
            <span className="font-mono text-slate-700 text-[11px] block">
              σ: [0.216, 0.204, 0.201]
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] block">
              Inference Timestamp
            </span>
            <span className="font-mono text-navy-900 text-[11px] block truncate">
              {new Date(activePrediction.timestamp).toISOString()}
            </span>
            <span className="text-slate-500 text-[11px] block">
              Zero image file persistence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
