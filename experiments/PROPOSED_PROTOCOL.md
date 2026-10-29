# Proposed protocol — Swin Fitzpatrick/diagnosis reweighting

**Status:** specified and prepared; no full training has started.

## Objective

Compare a standard diagnosis-class-balanced Swin fine-tuning arm with a matched arm that increases sampling probability for sufficiently represented underrepresented Fitzpatrick groups within diagnosis. The previously observed FST 3/FST 5 gap motivates the study, but the existing test set is contaminated by upstream checkpoint selection and the hypothesis was selected after viewing that test set. Any result on it remains exploratory.

## Data split

- Source only: `data/metadata/train_split-1.csv` (SHA-256 recorded in `experiment_config.json`).
- Splitter: `StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=20261026)`, validation fold 0, scikit-learn 1.9.1.
- Group by `Subject_ID`; stratify by `Main_class`.
- Observed split: 3,519 training images / 1,917 subjects and 880 validation images / 479 subjects; no subject or image overlap. All eight labels occur in both partitions. Rare validation supports are small, so per-class and subgroup metrics must include support.
- The split script does not open the official test metadata. The source train CSV remains unchanged; the generated manifest contains only training-row identifiers/metadata plus the partition assignment.

## Fresh initialization

Use `swin_base_patch4_window12_384` at 512×512 with timm tag `ms_in22k_ft_in1k`, replacing the 1,000-way classifier with the verified eight-class head. The local cache was checked and has no matching Swin weights. The official Swin release lists the requested asset as 348 MB. C: has 122.5 GiB free, so storage is sufficient. No weight download was attempted; a sandboxed HEAD request could not verify reachability from this machine. Before training, fetch only after the download endpoint is reachable and record a local SHA-256. Reset the same seed before constructing each arm and verify identical initial classifier-head tensors.

## Matched training arms

Both arms use the same split, fresh pretrained backbone, identical classifier initialization, seed, augmentation, optimizer, schedule, precision, batch order policy, validation rule, and maximum epoch count. The only planned difference is the per-image sampling weight.

**Arm A — standard class-balanced baseline**

For image `i` with diagnosis `y`, use `w_i = 1 / n_y`, where `n_y` is the number of images for class `y` in the training partition. Draw one replacement-sampled epoch of `N_train` images. This matches the published project's inverse-class-frequency sampler style.

**Arm B — capped Fitzpatrick/diagnosis reweighting**

For a training-only diagnosis/tone cell `(y,g)`, mark the cell eligible only if it contains at least 20 distinct subjects in the training partition. Let `n_y` be training images in diagnosis `y` and `n_(y,g)` be training images in that diagnosis/tone cell. For eligible cells:

`q_(y,g) = min(3, max(1, sqrt(n_y / n_(y,g))))`

For ineligible cells or missing Fitzpatrick labels, use `q=1`. Arm A uses `w_i^A = 1/n_y`, so each diagnosis has total sampler mass 1. For Arm B, form `r_i = (1/n_y) * q_(y,g)`, then normalize within each diagnosis by the **sum** of its raw weights: `w_i^B = r_i / sum_{j:y_j=y} r_j`. This also gives each diagnosis total sampler mass 1, matching Arm A, while applying a capped, square-root correction to eligible tone groups. Counts and eligibility are computed only on the training partition. No synthetic samples are created.

The 20-subject support threshold is a pre-specified safeguard; cells below it retain baseline weight. Under the generated training partition, 16 of 32 observed diagnosis/FST cells meet the threshold. Sparse examples and missing tones remain in both arms at baseline weight.

## Common training settings

- Seed: `20261026`; record Python, NumPy, PyTorch CPU/CUDA, DataLoader/sampler seeds.
- Model: Swin Base patch4/window12/384, 512×512 images, eight verified labels.
- Training augmentation: resize 512×512, random horizontal flip, random rotation ±15°, tensor conversion, official normalization mean `[0.53749797, 0.45875554, 0.40382471]`, std `[0.21629889, 0.20366619, 0.20136241]`.
- Validation transform: resize, tensor conversion, same normalization; no random augmentation.
- Batch size 2; gradient accumulation 4 (effective batch 8); fp16 autocast with GradScaler; AdamW (`lr=1e-4`, `weight_decay=1e-4`); cross entropy with label smoothing 0.1; cosine schedule stepped per epoch (`T_max=12`, `eta_min=1e-6`).
- Maximum 12 epochs per arm. Save only under a new `experiments/runs/<arm_id>/` directory. Never load or overwrite the existing DermaCon checkpoint.

## Validation and stopping

- Primary checkpoint metric: eight-class validation macro F1.
- Save the checkpoint with the best validation macro F1. Treat differences under 0.002 as ties and choose the lower validation cross-entropy loss.
- Stop an arm after four epochs without at least 0.002 macro-F1 improvement, or at 12 epochs, whichever comes first.
- Report validation loss, accuracy, macro F1, each class's precision/recall/F1/support, Fitzpatrick subgroup accuracy and macro F1/support, and diagnosis-by-Fitzpatrick recall/support. Include Pigmentary Disorders FST 3/FST 5 recalls and supports as a pre-specified exploratory endpoint.
- No thresholds, weights, epochs, or checkpoint choices may use test results.

## Pre-training smoke benchmark

`benchmark_smoke.py` uses a small slice of training images only, random initialization (`pretrained=False`), two warm-up and five measured batch-2 steps, and saves no weights. It includes image decode/transforms and the training step. The resulting throughput estimate is for planning only; it is not a convergence or full-epoch guarantee.

The observed median was 0.371 seconds per batch of two (about 5.40 images/second), with peak allocated/reserved VRAM of 3.54/3.84 GiB. One 3,519-image epoch is therefore approximately 10.8 minutes of training-step time. Twelve epochs for each of two arms are approximately 4.3 hours before validation, startup, checkpoint writes, and run variability; reserve about 5–6 hours if both arms reach the maximum.

## Test policy and interpretation

Do not evaluate the existing test set during preparation or model selection. If run later, evaluate the frozen arms once and report it as exploratory, because upstream checkpoint selection used this test split and the fairness hypothesis arose from prior analysis of it. Confirmatory evaluation requires a new independent cohort.
