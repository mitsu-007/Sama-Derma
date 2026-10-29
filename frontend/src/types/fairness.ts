import { DiseaseCategory } from './index';

export type ToneScale = 'Fitzpatrick' | 'Monk';

export interface SubgroupMetric {
  scale: ToneScale;
  group: string;
  n: number;
  correct: number;
  accuracy: number;
  macroF1: number;
  ci95?: [number, number]; // 95% Wilson score interval [lower, upper]
  isSmallSample?: boolean; // Flagged when n <= 30
}

export interface PriorityTestResult {
  scale: ToneScale;
  diagnosis: DiseaseCategory;
  groupA: string;
  groupAn: number;
  groupACorrect: number;
  groupARecall: number;
  groupACI95: [number, number];
  groupB: string;
  groupBn: number;
  groupBCorrect: number;
  groupBRecall: number;
  groupBCI95: [number, number];
  differenceAminusBpp: number;
  pValue: number;
  holmAdjustedPValue: number;
}

export interface HistoricalDiagnosisRecallItem {
  scale: ToneScale;
  group: string;
  diseaseClass: DiseaseCategory;
  support: number;
  correct: number;
  recall: number;
}

export interface Phase10DiagnosisToneRecallItem {
  diseaseClass: DiseaseCategory;
  fstGroup: string;
  supportA: number;
  correctA: number;
  recallA: number;
  supportB: number;
  correctB: number;
  recallB: number;
  deltaBminusA: number;
}
