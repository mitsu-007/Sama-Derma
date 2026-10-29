import { Phase10ComparisonSummary } from '../types';

/**
 * Phase 10 Paired Validation Experiment Results
 * Source artifacts: experiments/revision_05/runs_revision_05/validation_comparison.json
 * and paired_validation_uncertainty.json
 *
 * PROTOCOL & INTEGRITY:
 * - Common Initialization: Official ImageNet-pretrained Swin-B (SHA-256 0f6f7d28cb...)
 * - Split: 880 validation images across 479 subjects with ZERO subject leakage to training.
 * - Official test split was NOT touched.
 * - Seed 20261026, 7 epochs each, identical scheduler/optimizer/transforms.
 * - The only experimental variable was the sampling policy (Arm A balanced vs Arm B capped tone reweighting).
 *
 * SCIENTIFIC CONCLUSION:
 * While the point-estimated FST 3 vs FST 5 Pigmentary Disorders gap decreased, the 95% paired
 * subject-cluster bootstrap interval includes zero ([-18.94, +6.06] pp). Furthermore, overall
 * accuracy, macro F1, and Infectious Disorders recall regressed under Arm B.
 * DO NOT claim the fairness intervention was successful.
 */
export const phase10Comparison: Phase10ComparisonSummary = {
  metricScope: 'validation only; official test split was not read',
  sampleSize: 880,
  subjectCount: 479,
  armA: {
    name: 'Arm A (Standard Class Balanced)',
    strategy: 'Inverse class frequency weighting (1 / n_y)',
    accuracy: 0.714773, // 71.48%
    macroF1: 0.492250,  // 0.4923
    crossEntropyLoss: 1.180483,
    pigmentaryFST3Recall: 25 / 31, // 80.65%
    pigmentaryFST3Support: { correct: 25, total: 31 },
    pigmentaryFST5Recall: 26 / 35, // 74.29%
    pigmentaryFST5Support: { correct: 26, total: 35 },
    pigmentaryGapFST3MinusFST5: 6.36, // +6.36 pp
    infectiousRecall: 0.814917, // 81.49% (295/362)
  },
  armB: {
    name: 'Arm B (Capped Tone-Aware Reweighting)',
    strategy: 'Capped Fitzpatrick cell factor (q_y,g <= 3) normalized per class',
    accuracy: 0.670455, // 67.05%
    macroF1: 0.466028,  // 0.4660
    crossEntropyLoss: 1.205075,
    pigmentaryFST3Recall: 24 / 31, // 77.42%
    pigmentaryFST3Support: { correct: 24, total: 31 },
    pigmentaryFST5Recall: 27 / 35, // 77.14%
    pigmentaryFST5Support: { correct: 27, total: 35 },
    pigmentaryGapFST3MinusFST5: 0.28, // +0.28 pp
    infectiousRecall: 0.729282, // 72.93% (264/362)
  },
  deltasBMinusA: {
    accuracyPp: -4.43,
    macroF1: -0.0262,
    crossEntropyLoss: 0.0246,
    pigmentaryGapPp: -6.08,
    infectiousRecallDeltaPp: -8.56,
  },
  bootstrap95CI: {
    pigmentaryGapChangePp: [-18.94, 6.06], // Crosses zero!
    accuracyDeltaPp: [-6.83, -2.10],
    macroF1Delta: [-0.0475, -0.0064],
  },
  conclusion:
    'The paired validation comparison shows that while the subgroup gap point-estimate narrowed, the 95% bootstrap interval includes zero ([-18.94, +6.06] pp). The intervention caused a -4.43 pp drop in overall accuracy and an -8.56 pp drop in Infectious Disorders recall. These results do not establish fairness improvement.',
};
