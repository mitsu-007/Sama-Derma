import React, { useState } from 'react';
import { Table } from 'lucide-react';
import { AUDITED_LABEL_ORDER, DiseaseCategory } from '../../types';
import {
  historicalDiagnosisRecallData,
  phase10DiagnosisRecallData,
} from '../../data/fairnessData';

export const DiagnosisToneMatrix: React.FC = () => {
  const [matrixSource, setMatrixSource] = useState<'historical' | 'phase10'>('phase10');
  const [selectedScale, setSelectedScale] = useState<'Fitzpatrick' | 'Monk'>('Fitzpatrick');

  const fitzpatrickGroups = ['FST 3', 'FST 4', 'FST 5', 'FST 6'];
  const monkGroups = ['MST 4', 'MST 5', 'MST 6', 'MST 7', 'MST 8', 'MST 9'];

  const activeGroups =
    matrixSource === 'phase10'
      ? fitzpatrickGroups
      : selectedScale === 'Fitzpatrick'
      ? fitzpatrickGroups
      : monkGroups;

  // Helper to lookup cell in Historical Test data
  const getHistoricalCell = (category: DiseaseCategory, group: string) => {
    return historicalDiagnosisRecallData.find(
      (item) =>
        item.diseaseClass === category &&
        item.group === group &&
        item.scale === (matrixSource === 'phase10' ? 'Fitzpatrick' : selectedScale)
    );
  };

  // Helper to lookup cell in Phase 10 Validation data
  const getPhase10Cell = (category: DiseaseCategory, group: string) => {
    return phase10DiagnosisRecallData.find(
      (item) => item.diseaseClass === category && item.fstGroup === group
    );
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-navy-900">
              E. Diagnosis-by-Skin-Tone Cross-Tabulation Matrix
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Per-class recall stratified across demographic tone annotations, with explicit support counts.
            </p>
          </div>
        </div>

        {/* Dataset Selector Toggle */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setMatrixSource('phase10')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                matrixSource === 'phase10'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              Phase 10 Paired Validation
            </button>
            <button
              type="button"
              onClick={() => setMatrixSource('historical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                matrixSource === 'historical'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              Historical Test (Exploratory)
            </button>
          </div>

          {matrixSource === 'historical' && (
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedScale('Fitzpatrick')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedScale === 'Fitzpatrick'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                FST
              </button>
              <button
                type="button"
                onClick={() => setSelectedScale('Monk')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedScale === 'Monk'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                MST
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Source Banner & Legend */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {matrixSource === 'phase10' ? (
            <>
              <span className="font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                Paired Validation Split
              </span>
              <span className="text-slate-600">
                880 images, 479 subjects. Displays Arm A Recall vs Arm B Recall and B − A delta.
              </span>
            </>
          ) : (
            <>
              <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                Historical Test Split
              </span>
              <span className="text-slate-600">
                1,051 images. Displays Original Checkpoint Recall (Correct / Support).
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
            <span>— : Zero cases</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300" />
            <span>$n \le 10$: Sparse cell</span>
          </span>
        </div>
      </div>

      {/* Cross-Tabulation Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <th className="py-3 px-4 sticky left-0 bg-slate-100 z-10 w-52">
                Diagnostic Category (8 Classes)
              </th>
              {activeGroups.map((group) => (
                <th key={group} className="py-3 px-4 text-center min-w-[130px]">
                  {group}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {AUDITED_LABEL_ORDER.map((category, rowIdx) => (
              <tr key={category} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-semibold text-navy-900 sticky left-0 bg-white z-10 border-r border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">#{rowIdx}</span>
                    <span>{category}</span>
                  </div>
                </td>

                {activeGroups.map((group) => {
                  if (matrixSource === 'phase10') {
                    const cell = getPhase10Cell(category, group);
                    if (!cell || cell.supportA === 0) {
                      return (
                        <td key={group} className="py-3 px-4 text-center text-slate-300 font-mono">
                          <span title="No cases observed in validation split">—</span>
                        </td>
                      );
                    }

                    const isSparse = cell.supportA <= 10;
                    const deltaPositive = cell.deltaBminusA > 0;
                    const deltaNegative = cell.deltaBminusA < 0;

                    return (
                      <td
                        key={group}
                        className={`py-2.5 px-3 text-center border-l border-slate-100 ${
                          isSparse ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex justify-center items-baseline gap-1.5 font-mono text-xs">
                            <span className="text-slate-700 font-medium" title="Arm A Recall">
                              {(cell.recallA * 100).toFixed(0)}%
                            </span>
                            <span className="text-slate-400 text-[10px]">vs</span>
                            <span className="font-bold text-navy-900" title="Arm B Recall">
                              {(cell.recallB * 100).toFixed(0)}%
                            </span>
                          </div>

                          <div className="flex justify-center items-center gap-1.5 text-[10px]">
                            <span className="text-slate-400 font-mono">
                              $n={cell.supportA}$
                            </span>
                            <span
                              className={`font-mono font-bold ${
                                deltaPositive
                                  ? 'text-teal-700'
                                  : deltaNegative
                                  ? 'text-rose-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {deltaPositive ? '+' : ''}
                              {(cell.deltaBminusA * 100).toFixed(1)} pp
                            </span>
                          </div>
                        </div>
                      </td>
                    );
                  } else {
                    // Historical Test Split Matrix
                    const cell = getHistoricalCell(category, group);
                    if (!cell || cell.support === 0) {
                      return (
                        <td key={group} className="py-3 px-4 text-center text-slate-300 font-mono">
                          <span title="No cases in test split">—</span>
                        </td>
                      );
                    }

                    const isSparse = cell.support <= 10;
                    const recallPct = (cell.recall * 100).toFixed(1);

                    return (
                      <td
                        key={group}
                        className={`py-2.5 px-3 text-center border-l border-slate-100 ${
                          isSparse ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-navy-900 font-mono text-xs block">
                            {recallPct}%
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {cell.correct}/{cell.support}
                          </span>
                          {isSparse && (
                            <span className="text-[9px] text-amber-700 uppercase font-semibold block">
                              Sparse ($n \le 10$)
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  }
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-slate-500 leading-relaxed space-y-1">
        <p>
          <strong>Scientific Reading Guide:</strong> Missing cells marked with <code>—</code> indicate zero ground-truth cases for that diagnosis/skin-tone intersection in the evaluated split. Sparse cells ($n \le 10$) have very high statistical variance. For example, Keratanisation Disorders has only 1 case in FST 3 ($0/1 = 0\%$) and 2 cases in FST 5 ($2/2 = 100\%$), which must not be interpreted as evidence of systematic algorithmic bias.
        </p>
      </div>
    </section>
  );
};
