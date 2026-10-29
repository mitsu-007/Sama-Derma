# Phase 4 — Training-only diagnosis and skin-tone support

## Objective

Quantify observed support for every training-only `(Main_class, Fitzpatrick, Monk_skin_tone)` combination to determine whether reweighting is defensible.

## Files inspected

- `data/metadata/train_split-1.csv`
- `data/metadata/test_split-1.csv` for split subject counts only; no test labels were used to derive the table below

## Commands executed

- Read the CSVs in memory using the project Python 3.11 environment and `csv.DictReader`/`collections.Counter`.
- Grouped training rows by diagnosis, Fitzpatrick group, and Monk group. No files were written by the counting command.

## Actual results

- Six of 4,399 training rows lack both tone annotations. All other nonzero combinations are listed below; any omitted combination has count zero.
- Counts are image rows, not unique subjects. Multiple images from a subject may contribute to a cell; a future validation split must still be grouped by subject.

| Main class | Fitzpatrick | Monk tone | Training images |
|---|---|---|---:|
| Infectious Disorders | FST 3 | MST 4 | 35 |
| Infectious Disorders | FST 3 | MST 5 | 278 |
| Infectious Disorders | FST 3 | MST 6 | 95 |
| Infectious Disorders | FST 4 | MST 4 | 1 |
| Infectious Disorders | FST 4 | MST 5 | 140 |
| Infectious Disorders | FST 4 | MST 6 | 455 |
| Infectious Disorders | FST 4 | MST 7 | 269 |
| Infectious Disorders | FST 5 | MST 5 | 3 |
| Infectious Disorders | FST 5 | MST 6 | 86 |
| Infectious Disorders | FST 5 | MST 7 | 308 |
| Infectious Disorders | FST 5 | MST 8 | 89 |
| Infectious Disorders | FST 6 | MST 8 | 49 |
| Inflammatory Disorders | Missing | Missing | 3 |
| Inflammatory Disorders | FST 3 | MST 4 | 44 |
| Inflammatory Disorders | FST 3 | MST 5 | 226 |
| Inflammatory Disorders | FST 3 | MST 6 | 82 |
| Inflammatory Disorders | FST 3 | MST 7 | 1 |
| Inflammatory Disorders | FST 4 | MST 5 | 87 |
| Inflammatory Disorders | FST 4 | MST 6 | 310 |
| Inflammatory Disorders | FST 4 | MST 7 | 207 |
| Inflammatory Disorders | FST 5 | MST 6 | 51 |
| Inflammatory Disorders | FST 5 | MST 7 | 191 |
| Inflammatory Disorders | FST 5 | MST 8 | 51 |
| Inflammatory Disorders | FST 6 | MST 8 | 28 |
| Inflammatory Disorders | FST 6 | MST 9 | 4 |
| Keratanisation Disorders | FST 3 | MST 5 | 4 |
| Keratanisation Disorders | FST 3 | MST 6 | 1 |
| Keratanisation Disorders | FST 4 | MST 5 | 7 |
| Keratanisation Disorders | FST 4 | MST 6 | 20 |
| Keratanisation Disorders | FST 4 | MST 7 | 6 |
| Keratanisation Disorders | FST 5 | MST 6 | 1 |
| Keratanisation Disorders | FST 5 | MST 7 | 11 |
| Keratanisation Disorders | FST 5 | MST 8 | 3 |
| Keratanisation Disorders | FST 6 | MST 8 | 5 |
| Neoplasms and tumors | Missing | Missing | 1 |
| Neoplasms and tumors | FST 3 | MST 4 | 2 |
| Neoplasms and tumors | FST 3 | MST 5 | 12 |
| Neoplasms and tumors | FST 3 | MST 6 | 2 |
| Neoplasms and tumors | FST 4 | MST 5 | 1 |
| Neoplasms and tumors | FST 4 | MST 6 | 12 |
| Neoplasms and tumors | FST 4 | MST 7 | 4 |
| Neoplasms and tumors | FST 5 | MST 7 | 6 |
| No Definite Diagnosis | FST 3 | MST 4 | 1 |
| No Definite Diagnosis | FST 3 | MST 5 | 7 |
| No Definite Diagnosis | FST 3 | MST 6 | 3 |
| No Definite Diagnosis | FST 4 | MST 6 | 8 |
| No Definite Diagnosis | FST 4 | MST 7 | 6 |
| No Definite Diagnosis | FST 5 | MST 6 | 5 |
| No Definite Diagnosis | FST 5 | MST 7 | 1 |
| Other skin disorders | Missing | Missing | 2 |
| Other skin disorders | FST 3 | MST 4 | 5 |
| Other skin disorders | FST 3 | MST 5 | 23 |
| Other skin disorders | FST 3 | MST 6 | 9 |
| Other skin disorders | FST 4 | MST 5 | 14 |
| Other skin disorders | FST 4 | MST 6 | 40 |
| Other skin disorders | FST 4 | MST 7 | 23 |
| Other skin disorders | FST 5 | MST 7 | 11 |
| Other skin disorders | FST 5 | MST 8 | 1 |
| Other skin disorders | FST 6 | MST 8 | 3 |
| Pigmentary Disorders | FST 3 | MST 4 | 7 |
| Pigmentary Disorders | FST 3 | MST 5 | 92 |
| Pigmentary Disorders | FST 3 | MST 6 | 48 |
| Pigmentary Disorders | FST 4 | MST 4 | 1 |
| Pigmentary Disorders | FST 4 | MST 5 | 23 |
| Pigmentary Disorders | FST 4 | MST 6 | 185 |
| Pigmentary Disorders | FST 4 | MST 7 | 122 |
| Pigmentary Disorders | FST 5 | MST 6 | 17 |
| Pigmentary Disorders | FST 5 | MST 7 | 118 |
| Pigmentary Disorders | FST 5 | MST 8 | 33 |
| Pigmentary Disorders | FST 6 | MST 8 | 19 |
| Pigmentary Disorders | FST 6 | MST 9 | 2 |
| Skin Appendages Disorders | FST 3 | MST 4 | 26 |
| Skin Appendages Disorders | FST 3 | MST 5 | 82 |
| Skin Appendages Disorders | FST 3 | MST 6 | 43 |
| Skin Appendages Disorders | FST 3 | MST 7 | 2 |
| Skin Appendages Disorders | FST 4 | MST 5 | 25 |
| Skin Appendages Disorders | FST 4 | MST 6 | 109 |
| Skin Appendages Disorders | FST 4 | MST 7 | 62 |
| Skin Appendages Disorders | FST 5 | MST 6 | 5 |
| Skin Appendages Disorders | FST 5 | MST 7 | 22 |
| Skin Appendages Disorders | FST 5 | MST 8 | 2 |
| Skin Appendages Disorders | FST 6 | MST 8 | 1 |

## Files created or changed

- Created this report and the accompanying phase reports/handoff.
- No source CSV or existing evaluation result was changed.

## Errors and failed attempts

- An initial PowerShell grouping view represented null category values as blank group keys. The counts were recomputed using Python with explicit `<missing>` values; the corrected table above reports six missing-tone rows.

## Scientific assumptions and unresolved questions

- Image count is only a proxy for independent sampling; effective support may be smaller due to repeated subjects.
- Sparse intersections (including cells with one to a few images) are not suitable for aggressive balancing.
- A first intervention should use one pre-specified skin-tone scale and capped weights, and should state how missing tone annotations are handled.

## Recommended next phase

Design an independent, subject-disjoint training/validation experiment and evaluate whether its scope is feasible on the available GPU without using the test set for any tuning.
