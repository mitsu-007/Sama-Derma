/**
 * SamaDerma Research Platform Type Definitions
 * Strictly enforces research safeguards and label mappings.
 */

export const AUDITED_LABEL_ORDER = [
  "Infectious Disorders",
  "Inflammatory Disorders",
  "Keratanisation Disorders",
  "Neoplasms and tumors",
  "No Definite Diagnosis",
  "Other skin disorders",
  "Pigmentary Disorders",
  "Skin Appendages Disorders",
] as const;

export type DiseaseCategory = typeof AUDITED_LABEL_ORDER[number];

export interface UncalibratedModelScore {
  classIndex: number;
  category: DiseaseCategory;
  score: number; // Uncalibrated softmax score (sums to 1.0)
}

export interface PredictionResult {
  topCategory: DiseaseCategory;
  topScore: number;
  scores: UncalibratedModelScore[];
  device: string;
  inferenceTimestamp: string;
  isDemonstrationData?: boolean;
}

/**
 * Historical Original Checkpoint Test Results (Exploratory)
 * Upstream checkpoint selection used this test split, so these are exploratory.
 */
export interface HistoricalTestSummary {
  evaluatedImages: number;
  accuracy: number; // 0.706946
  macroF1: number;   // 0.447159
  checkpointMd5: string;
  status: "exploratory";
  pigmentaryRecallFST3: number; // 28/48 = 0.5833
  pigmentaryRecallFST5: number; // 38/44 = 0.8636
  pigmentarySupportFST3: { correct: number; total: number };
  pigmentarySupportFST5: { correct: number; total: number };
  limitationNote: string;
}

/**
 * Phase 10 Paired Validation Comparison
 * Arm A (Standard Balanced) vs Arm B (Capped Tone-Aware Reweighting)
 */
export interface Phase10ArmMetrics {
  name: string;
  strategy: string;
  accuracy: number;
  macroF1: number;
  crossEntropyLoss: number;
  pigmentaryFST3Recall: number;
  pigmentaryFST3Support: { correct: number; total: number };
  pigmentaryFST5Recall: number;
  pigmentaryFST5Support: { correct: number; total: number };
  pigmentaryGapFST3MinusFST5: number; // percentage points
  infectiousRecall: number;
}

export interface Phase10ComparisonSummary {
  metricScope: "validation only; official test split was not read";
  sampleSize: number; // 880 validation images
  subjectCount: number; // 479 subjects (zero subject leakage)
  armA: Phase10ArmMetrics;
  armB: Phase10ArmMetrics;
  deltasBMinusA: {
    accuracyPp: number; // -4.43 pp
    macroF1: number;    // -0.0262
    crossEntropyLoss: number; // +0.0246
    pigmentaryGapPp: number; // -6.08 pp
    infectiousRecallDeltaPp: number; // -8.56 pp
  };
  bootstrap95CI: {
    pigmentaryGapChangePp: [number, number]; // [-18.94, +6.06] (crosses zero!)
    accuracyDeltaPp: [number, number];       // [-6.83, -2.10]
    macroF1Delta: [number, number];           // [-0.0475, -0.0064]
  };
  conclusion: string;
}
