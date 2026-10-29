# Phase 3 — Checkpoint provenance and label mapping

## Objective

Verify checkpoint identity, architecture compatibility, semantic class order, and upstream training/selection procedure before considering training.

## Files and sources inspected

- Local `checkpoints/Swin_MC_best_model.pth`, `evaluate_model.py`, `app.py`, and `test_model.py`
- Official Harvard Dataverse dataset API metadata for DOI `10.7910/DVN/W7OUZM`
- The dataset's externally linked code repository, including `train_swin_mc.py` and `Infer_Swin_MC.ipynb`

## Commands executed

- Loaded the checkpoint with `torch.load(..., weights_only=True)` and strict-loaded it into the exact `timm` Swin model used by the evaluator.
- Printed output-head tensor shapes and derived train/test label sets from local metadata.
- Computed local MD5 with `Get-FileHash` and compared it with official Dataverse API metadata.
- Read the published training script and inference notebook through the dataset's linked source repository.

## Actual results

- The local checkpoint is 347,677,793 bytes. Its MD5 is `1071116c406f14625ccd653bf1fde094`, exactly matching the Swin checkpoint's published Harvard Dataverse file metadata. The checkpoint provenance is therefore verified to the published artifact.
- The 329-entry state dictionary strict-loads successfully into `swin_base_patch4_window12_384`, configured for 512×512 inputs and eight classes. The head tensors have shapes `(8, 1024)` and `(8,)`.
- The published training script and inference notebook both derive labels by sorting unique `Main_class` names. Local train and test label sets match. The verified index order is:
  0. Infectious Disorders
  1. Inflammatory Disorders
  2. Keratanisation Disorders
  3. Neoplasms and tumors
  4. No Definite Diagnosis
  5. Other skin disorders
  6. Pigmentary Disorders
  7. Skin Appendages Disorders
- Published training details: ImageNet-pretrained Swin Base; 512×512 resize; random horizontal flip and ±15° rotation during training; normalization mean `[0.53749797, 0.45875554, 0.40382471]`, std `[0.21629889, 0.20366619, 0.20136241]`; inverse-class-frequency `WeightedRandomSampler`; batch size 84; cross-entropy with label smoothing 0.1; AdamW with learning rate 1e-4 and weight decay 1e-4; cosine schedule `T_max=30`, minimum LR 1e-6; 40 epochs in the published invocation; best checkpoint selected by validation accuracy.
- **Critical finding:** the published script assigns `test_split.csv` to its `val_csv` variable and uses `val_acc` to select the best checkpoint. Thus the published test split was used for checkpoint selection. Existing 1,051-row evaluation results are not an untouched held-out evaluation, even though local evaluation does not train on those rows.
- The upstream script includes `torch.seed = 42`, an assignment rather than a call to seed PyTorch. Reproducibility of that training run is therefore not established by this line.

## Files created or changed

- Created this report and the accompanying phase reports/handoff.
- No model, data, existing evaluation artifact, or project script was modified.

## Errors and failed attempts

- Initial web access to Dataverse metadata was unavailable through the sandboxed PowerShell request; a read-only request was approved and succeeded. It returned the exact published checkpoint hash.

## Scientific assumptions and unresolved questions

- The code source is the official repository linked from the Dataverse release. The matching local checkpoint hash confirms the binary, not that every historical training run followed every line of the current public source exactly.
- Since the checkpoint was trained on all official training rows, an internal validation split carved from those same rows is not independent if this checkpoint is used as the starting weights.
- The existing test split cannot be described as confirmatory for this checkpoint, and prior analysis also selected fairness hypotheses after examining those results.

## Recommended next phase

Document training-only subgroup support and prepare an experiment that uses a fresh initialization and subject-disjoint train/validation data. Treat any eventual comparison on the existing test split as exploratory; a new independent test cohort is required for confirmation.
