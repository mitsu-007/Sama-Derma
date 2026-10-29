import {
  SubgroupMetric,
  PriorityTestResult,
  HistoricalDiagnosisRecallItem,
  Phase10DiagnosisToneRecallItem,
} from '../types/fairness';

/**
 * Historical Subgroup Metrics (Exploratory Test Set: 1,051 images)
 * Sources:
 * - evaluation_results/skin_tone_fairness_results_fixed8.csv
 * - evaluation_results/fairness_confidence_intervals.csv
 */
export const historicalSubgroupMetrics: SubgroupMetric[] = [
  // Fitzpatrick scale
  {
    scale: 'Fitzpatrick',
    group: 'FST 3',
    n: 273,
    correct: 177,
    accuracy: 0.648352,
    macroF1: 0.403635,
    ci95: [0.590008, 0.702578],
    isSmallSample: false,
  },
  {
    scale: 'Fitzpatrick',
    group: 'FST 4',
    n: 483,
    correct: 344,
    accuracy: 0.712215,
    macroF1: 0.431882,
    ci95: [0.67029, 0.750792],
    isSmallSample: false,
  },
  {
    scale: 'Fitzpatrick',
    group: 'FST 5',
    n: 270,
    correct: 204,
    accuracy: 0.755556,
    macroF1: 0.465549,
    ci95: [0.700943, 0.802998],
    isSmallSample: false,
  },
  {
    scale: 'Fitzpatrick',
    group: 'FST 6',
    n: 25,
    correct: 18,
    accuracy: 0.72,
    macroF1: 0.394189,
    ci95: [0.52423, 0.857163],
    isSmallSample: true, // Small support notice
  },
  // Monk scale
  {
    scale: 'Monk',
    group: 'MST 4',
    n: 30,
    correct: 12,
    accuracy: 0.4,
    macroF1: 0.219059,
    ci95: [0.245904, 0.576799],
    isSmallSample: true,
  },
  {
    scale: 'Monk',
    group: 'MST 5',
    n: 248,
    correct: 163,
    accuracy: 0.657258,
    macroF1: 0.396725,
    ci95: [0.59619, 0.713528],
    isSmallSample: false,
  },
  {
    scale: 'Monk',
    group: 'MST 6',
    n: 374,
    correct: 272,
    accuracy: 0.727273,
    macroF1: 0.400026,
    ci95: [0.679996, 0.769928],
    isSmallSample: false,
  },
  {
    scale: 'Monk',
    group: 'MST 7',
    n: 314,
    correct: 232,
    accuracy: 0.738854,
    macroF1: 0.479563,
    ci95: [0.687589, 0.784344],
    isSmallSample: false,
  },
  {
    scale: 'Monk',
    group: 'MST 8',
    n: 84,
    correct: 63,
    accuracy: 0.75,
    macroF1: 0.463464,
    ci95: [0.647855, 0.830278],
    isSmallSample: false,
  },
  {
    scale: 'Monk',
    group: 'MST 9',
    n: 1,
    correct: 1,
    accuracy: 1.0,
    macroF1: 0.125,
    ci95: [0.206543, 1.0],
    isSmallSample: true, // Single sample! High variance warning
  },
];

/**
 * Historical Priority Disparity Statistical Tests
 * Source: evaluation_results/priority_fairness_tests.csv
 */
export const historicalPriorityTests: PriorityTestResult[] = [
  {
    scale: 'Fitzpatrick',
    diagnosis: 'Pigmentary Disorders',
    groupA: 'FST 3',
    groupAn: 48,
    groupACorrect: 28,
    groupARecall: 0.583333,
    groupACI95: [0.442813, 0.711503],
    groupB: 'FST 5',
    groupBn: 44,
    groupBCorrect: 38,
    groupBRecall: 0.863636,
    groupBCI95: [0.732905, 0.93597],
    differenceAminusBpp: -28.0303,
    pValue: 0.004867,
    holmAdjustedPValue: 0.024335,
  },
  {
    scale: 'Fitzpatrick',
    diagnosis: 'Inflammatory Disorders',
    groupA: 'FST 3',
    groupAn: 66,
    groupACorrect: 39,
    groupARecall: 0.590909,
    groupACI95: [0.470492, 0.701326],
    groupB: 'FST 5',
    groupBn: 101,
    groupBCorrect: 78,
    groupBRecall: 0.772277,
    groupBCI95: [0.68141, 0.843192],
    differenceAminusBpp: -18.1368,
    pValue: 0.015612,
    holmAdjustedPValue: 0.057293,
  },
  {
    scale: 'Fitzpatrick',
    diagnosis: 'Infectious Disorders',
    groupA: 'FST 3',
    groupAn: 105,
    groupACorrect: 72,
    groupARecall: 0.685714,
    groupACI95: [0.5917, 0.766619],
    groupB: 'FST 5',
    groupBn: 101,
    groupBCorrect: 82,
    groupBRecall: 0.811881,
    groupBCI95: [0.724779, 0.876129],
    differenceAminusBpp: -12.6167,
    pValue: 0.05362,
    holmAdjustedPValue: 0.10724,
  },
  {
    scale: 'Monk',
    diagnosis: 'Pigmentary Disorders',
    groupA: 'MST 5',
    groupAn: 38,
    groupACorrect: 23,
    groupARecall: 0.605263,
    groupACI95: [0.447179, 0.744019],
    groupB: 'MST 8',
    groupBn: 14,
    groupBCorrect: 12,
    groupBRecall: 0.857143,
    groupBCI95: [0.600586, 0.959906],
    differenceAminusBpp: -25.188,
    pValue: 0.107044,
    holmAdjustedPValue: 0.10724,
  },
  {
    scale: 'Monk',
    diagnosis: 'Inflammatory Disorders',
    groupA: 'MST 5',
    groupAn: 73,
    groupACorrect: 45,
    groupARecall: 0.616438,
    groupACI95: [0.501741, 0.719494],
    groupB: 'MST 8',
    groupBn: 34,
    groupBCorrect: 29,
    groupBRecall: 0.852941,
    groupBCI95: [0.698719, 0.935506],
    differenceAminusBpp: -23.6503,
    pValue: 0.014323,
    holmAdjustedPValue: 0.057293,
  },
];

/**
 * Historical Diagnosis-by-Skin-Tone Cross Tabulation (Test Split: 1,051 images)
 * Source: evaluation_results/per_class_skin_tone_recall.csv
 */
export const historicalDiagnosisRecallData: HistoricalDiagnosisRecallItem[] = [
  // Fitzpatrick FST 3
  { scale: 'Fitzpatrick', group: 'FST 3', diseaseClass: 'Infectious Disorders', support: 105, correct: 72, recall: 0.685714 },
  { scale: 'Fitzpatrick', group: 'FST 3', diseaseClass: 'Inflammatory Disorders', support: 66, correct: 39, recall: 0.590909 },
  { scale: 'Fitzpatrick', group: 'FST 3', diseaseClass: 'Keratanisation Disorders', support: 2, correct: 1, recall: 0.5 },
  { scale: 'Fitzpatrick', group: 'FST 3', diseaseClass: 'Neoplasms and tumors', support: 4, correct: 0, recall: 0.0 },
  { scale: 'Fitzpatrick', group: 'FST 3', diseaseClass: 'No Definite Diagnosis', support: 3, correct: 0, recall: 0.0 },
  { scale: 'Fitzpatrick', group: 'FST 3', diseaseClass: 'Other skin disorders', support: 3, correct: 0, recall: 0.0 },
  { scale: 'Fitzpatrick', group: 'FST 3', diseaseClass: 'Pigmentary Disorders', support: 48, correct: 28, recall: 0.583333 },
  { scale: 'Fitzpatrick', group: 'FST 3', diseaseClass: 'Skin Appendages Disorders', support: 42, correct: 37, recall: 0.880952 },

  // Fitzpatrick FST 4
  { scale: 'Fitzpatrick', group: 'FST 4', diseaseClass: 'Infectious Disorders', support: 201, correct: 160, recall: 0.79602 },
  { scale: 'Fitzpatrick', group: 'FST 4', diseaseClass: 'Inflammatory Disorders', support: 132, correct: 86, recall: 0.651515 },
  { scale: 'Fitzpatrick', group: 'FST 4', diseaseClass: 'Keratanisation Disorders', support: 5, correct: 0, recall: 0.0 },
  { scale: 'Fitzpatrick', group: 'FST 4', diseaseClass: 'Neoplasms and tumors', support: 4, correct: 1, recall: 0.25 },
  { scale: 'Fitzpatrick', group: 'FST 4', diseaseClass: 'No Definite Diagnosis', support: 2, correct: 0, recall: 0.0 },
  { scale: 'Fitzpatrick', group: 'FST 4', diseaseClass: 'Other skin disorders', support: 17, correct: 2, recall: 0.117647 },
  { scale: 'Fitzpatrick', group: 'FST 4', diseaseClass: 'Pigmentary Disorders', support: 71, correct: 53, recall: 0.746479 },
  { scale: 'Fitzpatrick', group: 'FST 4', diseaseClass: 'Skin Appendages Disorders', support: 51, correct: 42, recall: 0.823529 },

  // Fitzpatrick FST 5
  { scale: 'Fitzpatrick', group: 'FST 5', diseaseClass: 'Infectious Disorders', support: 101, correct: 82, recall: 0.811881 },
  { scale: 'Fitzpatrick', group: 'FST 5', diseaseClass: 'Inflammatory Disorders', support: 101, correct: 78, recall: 0.772277 },
  { scale: 'Fitzpatrick', group: 'FST 5', diseaseClass: 'Keratanisation Disorders', support: 5, correct: 0, recall: 0.0 },
  { scale: 'Fitzpatrick', group: 'FST 5', diseaseClass: 'Neoplasms and tumors', support: 4, correct: 1, recall: 0.25 },
  { scale: 'Fitzpatrick', group: 'FST 5', diseaseClass: 'No Definite Diagnosis', support: 1, correct: 0, recall: 0.0 },
  { scale: 'Fitzpatrick', group: 'FST 5', diseaseClass: 'Other skin disorders', support: 7, correct: 2, recall: 0.285714 },
  { scale: 'Fitzpatrick', group: 'FST 5', diseaseClass: 'Pigmentary Disorders', support: 44, correct: 38, recall: 0.863636 },
  { scale: 'Fitzpatrick', group: 'FST 5', diseaseClass: 'Skin Appendages Disorders', support: 7, correct: 3, recall: 0.428571 },

  // Fitzpatrick FST 6
  { scale: 'Fitzpatrick', group: 'FST 6', diseaseClass: 'Infectious Disorders', support: 12, correct: 9, recall: 0.75 },
  { scale: 'Fitzpatrick', group: 'FST 6', diseaseClass: 'Inflammatory Disorders', support: 8, correct: 7, recall: 0.875 },
  { scale: 'Fitzpatrick', group: 'FST 6', diseaseClass: 'Keratanisation Disorders', support: 2, correct: 1, recall: 0.5 },
  { scale: 'Fitzpatrick', group: 'FST 6', diseaseClass: 'Other skin disorders', support: 1, correct: 0, recall: 0.0 },
  { scale: 'Fitzpatrick', group: 'FST 6', diseaseClass: 'Pigmentary Disorders', support: 1, correct: 1, recall: 1.0 },
  { scale: 'Fitzpatrick', group: 'FST 6', diseaseClass: 'Skin Appendages Disorders', support: 1, correct: 0, recall: 0.0 },

  // Monk MST 4
  { scale: 'Monk', group: 'MST 4', diseaseClass: 'Infectious Disorders', support: 5, correct: 3, recall: 0.6 },
  { scale: 'Monk', group: 'MST 4', diseaseClass: 'Inflammatory Disorders', support: 8, correct: 2, recall: 0.25 },
  { scale: 'Monk', group: 'MST 4', diseaseClass: 'No Definite Diagnosis', support: 2, correct: 0, recall: 0.0 },
  { scale: 'Monk', group: 'MST 4', diseaseClass: 'Pigmentary Disorders', support: 8, correct: 2, recall: 0.25 },
  { scale: 'Monk', group: 'MST 4', diseaseClass: 'Skin Appendages Disorders', support: 7, correct: 5, recall: 0.714286 },

  // Monk MST 5
  { scale: 'Monk', group: 'MST 5', diseaseClass: 'Infectious Disorders', support: 102, correct: 71, recall: 0.696078 },
  { scale: 'Monk', group: 'MST 5', diseaseClass: 'Inflammatory Disorders', support: 73, correct: 45, recall: 0.616438 },
  { scale: 'Monk', group: 'MST 5', diseaseClass: 'Keratanisation Disorders', support: 2, correct: 1, recall: 0.5 },
  { scale: 'Monk', group: 'MST 5', diseaseClass: 'Neoplasms and tumors', support: 2, correct: 0, recall: 0.0 },
  { scale: 'Monk', group: 'MST 5', diseaseClass: 'No Definite Diagnosis', support: 2, correct: 0, recall: 0.0 },
  { scale: 'Monk', group: 'MST 5', diseaseClass: 'Other skin disorders', support: 2, correct: 0, recall: 0.0 },
  { scale: 'Monk', group: 'MST 5', diseaseClass: 'Pigmentary Disorders', support: 38, correct: 23, recall: 0.605263 },
  { scale: 'Monk', group: 'MST 5', diseaseClass: 'Skin Appendages Disorders', support: 27, correct: 23, recall: 0.851852 },

  // Monk MST 6
  { scale: 'Monk', group: 'MST 6', diseaseClass: 'Infectious Disorders', support: 156, correct: 126, recall: 0.807692 },
  { scale: 'Monk', group: 'MST 6', diseaseClass: 'Inflammatory Disorders', support: 98, correct: 64, recall: 0.653061 },
  { scale: 'Monk', group: 'MST 6', diseaseClass: 'Keratanisation Disorders', support: 2, correct: 0, recall: 0.0 },
  { scale: 'Monk', group: 'MST 6', diseaseClass: 'Neoplasms and tumors', support: 4, correct: 0, recall: 0.0 },
  { scale: 'Monk', group: 'MST 6', diseaseClass: 'Other skin disorders', support: 13, correct: 1, recall: 0.076923 },
  { scale: 'Monk', group: 'MST 6', diseaseClass: 'Pigmentary Disorders', support: 63, correct: 49, recall: 0.777778 },
  { scale: 'Monk', group: 'MST 6', diseaseClass: 'Skin Appendages Disorders', support: 38, correct: 32, recall: 0.842105 },

  // Monk MST 7
  { scale: 'Monk', group: 'MST 7', diseaseClass: 'Infectious Disorders', support: 125, correct: 103, recall: 0.824 },
  { scale: 'Monk', group: 'MST 7', diseaseClass: 'Inflammatory Disorders', support: 94, correct: 70, recall: 0.744681 },
  { scale: 'Monk', group: 'MST 7', diseaseClass: 'Keratanisation Disorders', support: 8, correct: 0, recall: 0.0 },
  { scale: 'Monk', group: 'MST 7', diseaseClass: 'Neoplasms and tumors', support: 6, correct: 2, recall: 0.333333 },
  { scale: 'Monk', group: 'MST 7', diseaseClass: 'No Definite Diagnosis', support: 2, correct: 0, recall: 0.0 },
  { scale: 'Monk', group: 'MST 7', diseaseClass: 'Other skin disorders', support: 11, correct: 2, recall: 0.181818 },
  { scale: 'Monk', group: 'MST 7', diseaseClass: 'Pigmentary Disorders', support: 41, correct: 34, recall: 0.829268 },
  { scale: 'Monk', group: 'MST 7', diseaseClass: 'Skin Appendages Disorders', support: 27, correct: 21, recall: 0.777778 },

  // Monk MST 8
  { scale: 'Monk', group: 'MST 8', diseaseClass: 'Infectious Disorders', support: 31, correct: 20, recall: 0.645161 },
  { scale: 'Monk', group: 'MST 8', diseaseClass: 'Inflammatory Disorders', support: 34, correct: 29, recall: 0.852941 },
  { scale: 'Monk', group: 'MST 8', diseaseClass: 'Keratanisation Disorders', support: 1, correct: 0, recall: 0.0 },
  { scale: 'Monk', group: 'MST 8', diseaseClass: 'Other skin disorders', support: 2, correct: 1, recall: 0.5 },
  { scale: 'Monk', group: 'MST 8', diseaseClass: 'Pigmentary Disorders', support: 14, correct: 12, recall: 0.857143 },
  { scale: 'Monk', group: 'MST 8', diseaseClass: 'Skin Appendages Disorders', support: 2, correct: 1, recall: 0.5 },

  // Monk MST 9
  { scale: 'Monk', group: 'MST 9', diseaseClass: 'Keratanisation Disorders', support: 1, correct: 1, recall: 1.0 },
];

/**
 * Phase 10 Paired Validation: Diagnosis-by-Fitzpatrick Recall (880 images, 479 subjects)
 * Source: experiments/revision_05/runs_revision_05/paired_validation_uncertainty.json
 */
export const phase10DiagnosisRecallData: Phase10DiagnosisToneRecallItem[] = [
  // Infectious Disorders
  { diseaseClass: 'Infectious Disorders', fstGroup: 'FST 3', supportA: 73, correctA: 55, recallA: 0.753425, supportB: 73, correctB: 48, recallB: 0.657534, deltaBminusA: -0.09589 },
  { diseaseClass: 'Infectious Disorders', fstGroup: 'FST 4', supportA: 176, correctA: 150, recallA: 0.852273, supportB: 176, correctB: 135, recallB: 0.767045, deltaBminusA: -0.085227 },
  { diseaseClass: 'Infectious Disorders', fstGroup: 'FST 5', supportA: 105, correctA: 83, recallA: 0.790476, supportB: 105, correctB: 74, recallB: 0.704762, deltaBminusA: -0.085714 },
  { diseaseClass: 'Infectious Disorders', fstGroup: 'FST 6', supportA: 8, correctA: 7, recallA: 0.875, supportB: 8, correctB: 7, recallB: 0.875, deltaBminusA: 0.0 },

  // Inflammatory Disorders
  { diseaseClass: 'Inflammatory Disorders', fstGroup: 'FST 3', supportA: 73, correctA: 46, recallA: 0.630137, supportB: 73, correctB: 49, recallB: 0.671233, deltaBminusA: 0.041096 },
  { diseaseClass: 'Inflammatory Disorders', fstGroup: 'FST 4', supportA: 119, correctA: 78, recallA: 0.655462, supportB: 119, correctB: 71, recallB: 0.596639, deltaBminusA: -0.058824 },
  { diseaseClass: 'Inflammatory Disorders', fstGroup: 'FST 5', supportA: 58, correctA: 34, recallA: 0.586207, supportB: 58, correctB: 35, recallB: 0.603448, deltaBminusA: 0.017241 },
  { diseaseClass: 'Inflammatory Disorders', fstGroup: 'FST 6', supportA: 4, correctA: 3, recallA: 0.75, supportB: 4, correctB: 4, recallB: 1.0, deltaBminusA: 0.25 },

  // Keratanisation Disorders
  { diseaseClass: 'Keratanisation Disorders', fstGroup: 'FST 3', supportA: 1, correctA: 0, recallA: 0.0, supportB: 1, correctB: 0, recallB: 0.0, deltaBminusA: 0.0 },
  { diseaseClass: 'Keratanisation Disorders', fstGroup: 'FST 4', supportA: 8, correctA: 4, recallA: 0.5, supportB: 8, correctB: 4, recallB: 0.5, deltaBminusA: 0.0 },
  { diseaseClass: 'Keratanisation Disorders', fstGroup: 'FST 5', supportA: 2, correctA: 2, recallA: 1.0, supportB: 2, correctB: 2, recallB: 1.0, deltaBminusA: 0.0 },
  { diseaseClass: 'Keratanisation Disorders', fstGroup: 'FST 6', supportA: 1, correctA: 1, recallA: 1.0, supportB: 1, correctB: 1, recallB: 1.0, deltaBminusA: 0.0 },

  // Neoplasms and tumors
  { diseaseClass: 'Neoplasms and tumors', fstGroup: 'FST 3', supportA: 3, correctA: 0, recallA: 0.0, supportB: 3, correctB: 0, recallB: 0.0, deltaBminusA: 0.0 },
  { diseaseClass: 'Neoplasms and tumors', fstGroup: 'FST 4', supportA: 3, correctA: 0, recallA: 0.0, supportB: 3, correctB: 0, recallB: 0.0, deltaBminusA: 0.0 },
  { diseaseClass: 'Neoplasms and tumors', fstGroup: 'FST 5', supportA: 2, correctA: 2, recallA: 1.0, supportB: 2, correctB: 2, recallB: 1.0, deltaBminusA: 0.0 },

  // No Definite Diagnosis
  { diseaseClass: 'No Definite Diagnosis', fstGroup: 'FST 3', supportA: 1, correctA: 0, recallA: 0.0, supportB: 1, correctB: 0, recallB: 0.0, deltaBminusA: 0.0 },
  { diseaseClass: 'No Definite Diagnosis', fstGroup: 'FST 4', supportA: 3, correctA: 0, recallA: 0.0, supportB: 3, correctB: 0, recallB: 0.0, deltaBminusA: 0.0 },
  { diseaseClass: 'No Definite Diagnosis', fstGroup: 'FST 5', supportA: 2, correctA: 0, recallA: 0.0, supportB: 2, correctB: 0, recallB: 0.0, deltaBminusA: 0.0 },

  // Other skin disorders
  { diseaseClass: 'Other skin disorders', fstGroup: 'FST 3', supportA: 1, correctA: 0, recallA: 0.0, supportB: 1, correctB: 0, recallB: 0.0, deltaBminusA: 0.0 },
  { diseaseClass: 'Other skin disorders', fstGroup: 'FST 4', supportA: 21, correctA: 3, recallA: 0.142857, supportB: 21, correctB: 3, recallB: 0.142857, deltaBminusA: 0.0 },
  { diseaseClass: 'Other skin disorders', fstGroup: 'FST 5', supportA: 4, correctA: 0, recallA: 0.0, supportB: 4, correctB: 0, recallB: 0.0, deltaBminusA: 0.0 },

  // Pigmentary Disorders
  { diseaseClass: 'Pigmentary Disorders', fstGroup: 'FST 3', supportA: 31, correctA: 25, recallA: 0.806452, supportB: 31, correctB: 24, recallB: 0.774194, deltaBminusA: -0.032258 },
  { diseaseClass: 'Pigmentary Disorders', fstGroup: 'FST 4', supportA: 61, correctA: 49, recallA: 0.803279, supportB: 61, correctB: 44, recallB: 0.721311, deltaBminusA: -0.081967 },
  { diseaseClass: 'Pigmentary Disorders', fstGroup: 'FST 5', supportA: 35, correctA: 26, recallA: 0.742857, supportB: 35, correctB: 27, recallB: 0.771429, deltaBminusA: 0.028571 },
  { diseaseClass: 'Pigmentary Disorders', fstGroup: 'FST 6', supportA: 6, correctA: 6, recallA: 1.0, supportB: 6, correctB: 6, recallB: 1.0, deltaBminusA: 0.0 },

  // Skin Appendages Disorders
  { diseaseClass: 'Skin Appendages Disorders', fstGroup: 'FST 3', supportA: 30, correctA: 20, recallA: 0.666667, supportB: 30, correctB: 20, recallB: 0.666667, deltaBminusA: 0.0 },
  { diseaseClass: 'Skin Appendages Disorders', fstGroup: 'FST 4', supportA: 42, correctA: 33, recallA: 0.785714, supportB: 42, correctB: 32, recallB: 0.761905, deltaBminusA: -0.02381 },
  { diseaseClass: 'Skin Appendages Disorders', fstGroup: 'FST 5', supportA: 4, correctA: 2, recallA: 0.5, supportB: 4, correctB: 2, recallB: 0.5, deltaBminusA: 0.0 },
];
