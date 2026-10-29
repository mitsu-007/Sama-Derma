# Phase 1 — Project and data audit

## Objective

Establish the current project state and confirm split integrity without changing any existing artifacts.

## Files inspected

- `AGENTS.md`, `README.md`, `PROJECT_STATUS.md`
- Root Python scripts and the three metadata CSVs in `data/metadata/`
- Existing baseline and fairness result files in `evaluation_results/`
- `checkpoints/Swin_MC_best_model.pth` (metadata only in this phase)

## Commands executed

- PowerShell directory/file listings; `Get-Content` for project guidance and status.
- PowerShell `Import-Csv` to inspect CSV headers, count rows and distinct `Subject_ID`s, and check overlap.
- Read-only searches of project Python and Markdown files for model, training, label-order, and evaluation behavior.

## Actual results

- `README.md` and `PROJECT_STATUS.md` describe the earlier starter scaffold and are stale relative to the present checkpoint and evaluation outputs.
- Metadata columns identify `Subject_ID`, `Image_name`, `Disease_label`, `Main_class`, `Fitzpatrick`, and `Monk_skin_tone`.
- Training split: 4,399 image rows, 2,396 distinct subjects, no missing subject IDs.
- Test split: 1,051 image rows, 606 distinct subjects, no missing subject IDs.
- No validation CSV is present. Training and test subject sets have zero overlap.
- Six training rows are missing both tone annotations.
- Existing baseline report: accuracy 0.706946 and macro F1 0.447159 on 1,051 test rows. Existing priority result: FST 3 Pigmentary Disorders recall 28/48 (58.33%); FST 5 recall 38/44 (86.36%). These were exploratory results and are not independent confirmation.

## Files created or changed

- Created this report and the companion phase reports and handoff under `research_reports/`.
- No existing files, datasets, checkpoints, or evaluation outputs were changed.

## Errors and failed attempts

- `rg` is not installed in this PowerShell environment; PowerShell listing and `Select-String` were used instead.
- Initial call to the virtual-environment Python launcher failed, but this could not be reproduced when invoking it directly; see Phase 2.

## Scientific assumptions and unresolved questions

- The present train/test subject disjointness is measured from the supplied CSVs. It does not establish whether upstream model selection used the test split; that was investigated in Phase 3.
- Existing fairness comparisons were selected after inspecting the same test results, and should be treated as exploratory.

## Recommended next phase

Verify the local environment, checkpoint identity, and upstream training/inference sources before any model training.
