import React from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import { ProjectOverviewSection } from '../components/about/ProjectOverviewSection';
import { ArchitectureWorkflowSection } from '../components/about/ArchitectureWorkflowSection';
import { DatasetProvenanceSection } from '../components/about/DatasetProvenanceSection';
import { ResearchFindingsSummarySection } from '../components/about/ResearchFindingsSummarySection';
import { ReproducibilityDossierSection } from '../components/about/ReproducibilityDossierSection';
import { LimitationsResponsibleUseSection } from '../components/about/LimitationsResponsibleUseSection';

export const About: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              About SamaDerma & Technical Dossier
            </h1>
            <StatusBadge variant="verified" size="sm">
              Verified Technical Dossier
            </StatusBadge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl leading-relaxed">
            Full research provenance, model architecture, dataset licensing, reproducibility guides, and scientific governance statements for the SamaDerma platform.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Link
            to="/analyze"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs shadow-sm transition-colors"
          >
            <span>Analyze Image</span>
          </Link>
          <Link
            to="/fairness"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-navy-900 font-semibold text-xs shadow-sm transition-colors border border-slate-200"
          >
            <span>Fairness Lab</span>
          </Link>
        </div>
      </div>

      {/* Section 1: Project Overview & Mission */}
      <ProjectOverviewSection />

      {/* Section 2: Model Architecture & Inference Workflow */}
      <ArchitectureWorkflowSection />

      {/* Section 3: Dataset Provenance, Demographics & Licensing */}
      <DatasetProvenanceSection />

      {/* Section 4: Summary of Completed Research Experiments */}
      <ResearchFindingsSummarySection />

      {/* Section 5: Reproducibility & Technical Provenance Dossier */}
      <ReproducibilityDossierSection />

      {/* Section 6: Limitations, Responsible Use & Governance */}
      <LimitationsResponsibleUseSection />
    </div>
  );
};
