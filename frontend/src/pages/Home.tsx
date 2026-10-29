import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart2,
  Cpu,
  Layers,
  Lock,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { HeroInspectionPreview } from '../components/HeroInspectionPreview';
import { WorkflowCard } from '../components/WorkflowCard';
import {
  homeHighlightStats,
  platformWorkflowSteps,
  phase10SummaryHighlight,
} from '../data/homeHighlights';
import { AUDITED_LABEL_ORDER } from '../types';

export const Home: React.FC = () => {
  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Section: Product-First Two-Column Layout */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 lg:p-12 shadow-sm">
        {/* Subtle decorative atmospheric background */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-teal-50/60 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-24 w-80 h-80 rounded-full bg-slate-100/70 blur-3xl pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Product Value Proposition & Primary Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant="verified" size="sm">
                Swin-B Checkpoint Verified
              </StatusBadge>
              <StatusBadge variant="validation" size="sm">
                Empirical Fairness Audited
              </StatusBadge>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-navy-900 tracking-tight leading-[1.12]">
                Fairness-Aware Computer Vision in{' '}
                <span className="text-teal-700">Dermatological AI</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                SamaDerma is an open, reproducible research platform evaluating how vision transformers perform across diverse skin tones. Using verified neural checkpoints and paired statistical audits, we examine classification disparities with scientific transparency.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                to="/analyze"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 group"
              >
                <span>Launch Image Analysis</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/fairness"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy-900 font-semibold text-sm transition-colors border border-slate-200/60"
              >
                <BarChart2 className="w-4 h-4 text-teal-700" />
                <span>Explore Fairness Lab</span>
              </Link>
            </div>

            {/* Concise Privacy & Security Guardrail */}
            <div className="pt-2 flex items-start gap-2.5 text-xs text-slate-500 border-t border-slate-100">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Privacy by Design:</strong> Client preflight validation runs entirely within your browser memory. When submitted for analysis, images are processed in-memory by the configured backend with zero disk persistence, database retention, or third-party AI sharing.
              </p>
            </div>
          </div>

          {/* Right Column: Conceptual Architecture & Spectrum Visual */}
          <div className="lg:col-span-5 w-full">
            <HeroInspectionPreview />
          </div>
        </div>
      </section>

      {/* 2. Platform Workflow: 3-Step Guided Journey */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100 inline-block">
            End-to-End Methodology
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            How SamaDerma Audits Dermatological AI
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A three-stage research framework engineered for client-side privacy, vision transformer inference, and statistical fairness verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {platformWorkflowSteps.map((step) => (
            <WorkflowCard key={step.stepNumber} step={step} />
          ))}
        </div>
      </section>

      {/* 3. Verified Project Highlights (Curated Summary Strip) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-navy-900">
              Verified Project Benchmarks
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Curated core parameters verified against published model checkpoints and disjoint cohorts.
            </p>
          </div>
          <Link
            to="/about"
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 self-start sm:self-auto"
          >
            <span>Model Provenance & Specs</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {homeHighlightStats.map((stat) => (
            <MetricCard
              key={stat.id}
              label={stat.label}
              value={stat.value}
              subtitle={stat.subtitle}
              badge={{ text: stat.badgeText, variant: stat.badgeVariant }}
            />
          ))}
        </div>
      </section>

      {/* 4. Honest Summary of Phase 10 Experimental Findings */}
      <section className="rounded-2xl border border-teal-200/90 bg-gradient-to-r from-teal-50/50 via-white to-slate-50/50 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-navy-900">
                {phase10SummaryHighlight.title}
              </h3>
              <StatusBadge variant="validation" size="sm">
                Controlled Experiment
              </StatusBadge>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {phase10SummaryHighlight.description}
            </p>
            <p className="text-xs font-semibold text-slate-700 italic">
              {phase10SummaryHighlight.verdict}
            </p>
          </div>
        </div>

        <div className="border-t border-teal-100 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-mono">
            Validation Protocol: 880 images • 479 subjects • 10,000 paired bootstrap resamples
          </span>
          <Link
            to="/fairness"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs shadow-sm transition-colors shrink-0"
          >
            <span>{phase10SummaryHighlight.linkText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 5. Audited 8-Class Diagnostic Hierarchy */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-navy-900">
              Audited 8-Class Diagnostic Hierarchy
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Broad pathological disease categories classified by the Swin-B vision backbone.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 self-start sm:self-auto">
            Class Index: 0 through 7
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {AUDITED_LABEL_ORDER.map((category, index) => (
            <div
              key={category}
              className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-teal-200 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono text-teal-700 font-bold">
                <span>#{index}</span>
              </div>
              <span className="font-semibold text-navy-900 block truncate" title={category}>
                {category}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 6. System Architecture & Methodological Safeguards */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-navy-900">
            System Architecture & Methodological Safeguards
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Engineered for scientific reproducibility, non-clinical caution, and patient privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-semibold">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-navy-900 text-sm">Swin Transformer Base</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Configured with <code>swin_base_patch4_window12_384</code> adapted to 512×512 resolution. Strict MD5 check confirms published weights (<code>1071116c</code>).
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-semibold">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-navy-900 text-sm">Subject-Disjoint Splits</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cohort partitioning by Subject ID rather than raw image count. Training and validation sets maintain zero subject overlap, strictly guarding against data leakage.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-semibold">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-navy-900 text-sm">Client-Side Privacy</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Images are validated and decoded in memory. No diagnostic imagery or patient metadata is written to disk or transmitted to third-party endpoints.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Bottom Conversion Banner */}
      <section className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50/70 to-white p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1.5 text-center sm:text-left">
          <h3 className="text-lg sm:text-xl font-bold text-navy-900">
            Ready to explore dermatological image analysis?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
            Upload a dermatological image to inspect local in-memory preflight validation and Swin-B uncalibrated category scores with strict non-clinical safeguards.
          </p>
        </div>
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm shadow-sm transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
        >
          <span>Launch Image Analysis</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
};
