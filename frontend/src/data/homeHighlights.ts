/**
 * Curated Project Highlights and Architecture Facts for SamaDerma Home Page.
 * Strictly references verified evaluation results and research artifacts.
 *
 * NOTE ON RESEARCH INTEGRITY:
 * 1. Historical test split evaluation (1,051 images) is EXPLORATORY because
 *    upstream checkpoint selection utilized this split as validation.
 * 2. Phase 10 validation comparison (880 images, 479 subjects) is a CONTROLLED
 *    experiment derived exclusively from training data with zero subject leakage.
 *    The intervention is classified as INCONCLUSIVE because the 95% bootstrap CI crosses zero
 *    and overall accuracy regressed.
 */

export interface HomeHighlightStat {
  id: string;
  label: string;
  value: string;
  subtitle: string;
  badgeText: string;
  badgeVariant: 'verified' | 'exploratory' | 'validation' | 'neutral';
  tooltip?: string;
}

export const homeHighlightStats: HomeHighlightStat[] = [
  {
    id: 'architecture',
    label: 'Vision Backbone',
    value: 'Swin-B',
    subtitle: 'Hierarchical vision transformer with 512×512 resolution and 8 disease categories',
    badgeText: 'Checkpoint Verified',
    badgeVariant: 'verified',
    tooltip: 'Strict MD5 checksum verification confirms published state dict weights (1071116c).',
  },
  {
    id: 'test-cohort',
    label: 'Archival Test Split',
    value: '1,051',
    subtitle: 'Evaluated images across 8 disease classes on local CUDA hardware',
    badgeText: 'Exploratory Cohort',
    badgeVariant: 'exploratory',
    tooltip: 'Exploratory baseline: upstream checkpoint selection assigned test split to validation.',
  },
  {
    id: 'subgroup-focus',
    label: 'Evaluated Skin Tones',
    value: 'FST III – VI',
    subtitle: 'Fitzpatrick scale and Monk skin-tone subgroup performance parity tracking',
    badgeText: 'Subgroup Audited',
    badgeVariant: 'validation',
    tooltip: 'Evaluates diagnostic recall parity across darker and lighter skin-tone categories.',
  },
  {
    id: 'validation-cohort',
    label: 'Validation Cohort',
    value: '479 Subjects',
    subtitle: '880 validation images with zero subject leakage to training data',
    badgeText: 'Disjoint Protocol',
    badgeVariant: 'validation',
    tooltip: 'Subject-level disjoint partitioning guards strictly against identity data leakage.',
  },
];

export interface WorkflowStep {
  stepNumber: string;
  title: string;
  category: string;
  description: string;
  technicalDetail: string;
  iconName: 'ShieldCheck' | 'Cpu' | 'Scale';
}

export const platformWorkflowSteps: WorkflowStep[] = [
  {
    stepNumber: '01',
    title: 'Preflight & Privacy Ingestion',
    category: 'Client-Side Guardrails',
    description: 'Images are decoded and inspected strictly in your browser memory. Guardrails reject invalid encodings, oversized payloads (>12 MB), or excessive resolutions (>40 MP).',
    technicalDetail: 'Zero network upload • In-memory validation • Client canvas decode',
    iconName: 'ShieldCheck',
  },
  {
    stepNumber: '02',
    title: 'Multi-Class Vision Transformer',
    category: 'Swin-B Model Pipeline',
    description: 'The validated image is preprocessed (512×512 RGB, standardized channel normalization) and evaluated across 8 audited dermatological disease categories.',
    technicalDetail: '8 Uncalibrated softmax scores • Swin Base 384->512 • Strict class order',
    iconName: 'Cpu',
  },
  {
    stepNumber: '03',
    title: 'Subgroup Fairness Auditing',
    category: 'Fairness Evaluation',
    description: 'Diagnostic performance is evaluated across Fitzpatrick (FST) and Monk (MST) skin-tone cohorts. Disparities are audited with paired subject bootstrap confidence intervals.',
    technicalDetail: 'Paired cluster bootstrapping • Transparent negative reporting • Non-causal audit',
    iconName: 'Scale',
  },
];

export const phase10SummaryHighlight = {
  title: 'Honest Research Disclosure: Phase 10 Intervention Inconclusive',
  description:
    'In our controlled Phase 10 validation experiment (880 images, 479 subjects), capped Fitzpatrick tone reweighting (Arm B) narrowed the point-estimated Pigmentary Disorders FST 3–5 gap from +6.36 pp to +0.28 pp. However, a 10,000-replicate paired subject-bootstrap 95% confidence interval is [-18.94 to +6.06] percentage points (crossing zero). Furthermore, overall accuracy dropped by -4.43 pp and Infectious Disorders recall dropped by -8.56 pp.',
  verdict: 'In adherence to scientific integrity, we do not claim the fairness intervention was successful.',
  linkText: 'Explore Complete Paired Validation Data in Fairness Lab',
};
