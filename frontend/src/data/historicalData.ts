import { HistoricalTestSummary } from '../types';

/**
 * Historical Original Checkpoint Test Set Evaluation
 * Artifact source: evaluation_results/baseline_report.txt & priority_fairness_tests.csv
 *
 * CRITICAL SCIENTIFIC CAVEAT:
 * Upstream checkpoint selection used this test split as validation.
 * Therefore, these results are classified strictly as EXPLORATORY and cannot
 * serve as confirmatory evidence of model generalizability or causal bias.
 */
export const historicalTestSummary: HistoricalTestSummary = {
  evaluatedImages: 1051,
  accuracy: 0.706946,
  macroF1: 0.447159,
  checkpointMd5: '1071116c406f14625ccd653bf1fde094',
  status: 'exploratory',
  pigmentaryRecallFST3: 28 / 48, // 58.33%
  pigmentaryRecallFST5: 38 / 44, // 86.36%
  pigmentarySupportFST3: { correct: 28, total: 48 },
  pigmentarySupportFST5: { correct: 38, total: 44 },
  limitationNote:
    'Exploratory Test Evaluation: Upstream checkpoint selection utilized this test split as validation, and subgroup hypotheses were inspected on these same results. These findings do not establish causal bias or confirmatory performance.',
};
