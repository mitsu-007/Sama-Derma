import csv
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parent
INPUT_FILE = BASE_DIR / "evaluation_results" / "test_predictions.csv"
OUTPUT_DIR = BASE_DIR / "evaluation_results"

OUTPUT_DIR.mkdir(exist_ok=True)

if not INPUT_FILE.exists():
    raise FileNotFoundError(f"File not found: {INPUT_FILE}")

with open(INPUT_FILE, "r", encoding="utf-8-sig", newline="") as file:
    rows = list(csv.DictReader(file))

if not rows:
    raise ValueError("Prediction file is empty.")

MIN_SUPPORT = 10

group_definitions = {
    "Fitzpatrick": "Fitzpatrick",
    "Monk": "Monk_skin_tone",
}

# Group rows by skin-tone scale, group, and true diagnosis.
grouped = defaultdict(list)
all_diseases = sorted({
    row["True_class"].strip()
    for row in rows
    if row.get("True_class", "").strip()
})

for row in rows:
    disease = row.get("True_class", "").strip()

    if not disease:
        continue

    for grouping_name, column in group_definitions.items():
        group = row.get(column, "").strip() or "Missing/Unlabelled"
        grouped[(grouping_name, group, disease)].append(row)

results = []

for grouping_name, column in group_definitions.items():
    groups = sorted({
        row.get(column, "").strip() or "Missing/Unlabelled"
        for row in rows
    })

    print("\n" + "=" * 100)
    print(f"{grouping_name.upper()}: RECALL WITHIN EACH DIAGNOSIS")
    print("=" * 100)

    print(
        f"{'Skin-tone group':22} "
        f"{'Diagnosis':35} "
        f"{'Support':>8} "
        f"{'Correct':>8} "
        f"{'Recall':>10}"
    )

    for group in groups:
        for disease in all_diseases:
            subset = grouped.get((grouping_name, group, disease), [])

            if not subset:
                continue

            support = len(subset)
            correct = sum(
                row["True_class"].strip()
                == row["Predicted_class"].strip()
                for row in subset
            )
            recall = correct / support

            print(
                f"{group:22} "
                f"{disease:35} "
                f"{support:8d} "
                f"{correct:8d} "
                f"{recall:9.2%}"
            )

            results.append({
                "Grouping": grouping_name,
                "Skin_tone_group": group,
                "Diagnosis": disease,
                "Support": support,
                "Correct": correct,
                "Recall": recall,
            })

# Compare groups only within the same diagnosis.
print("\n" + "=" * 100)
print("WITHIN-DIAGNOSIS RECALL GAPS")
print("=" * 100)

print(
    f"{'Scale':12} {'Diagnosis':35} "
    f"{'Lowest group':18} {'Recall':>9} "
    f"{'Highest group':18} {'Recall':>9} "
    f"{'Gap':>9}"
)

for grouping_name, column in group_definitions.items():
    groups = sorted({
        row.get(column, "").strip() or "Missing/Unlabelled"
        for row in rows
    })

    for disease in all_diseases:
        valid = []

        for group in groups:
            subset = grouped.get((grouping_name, group, disease), [])

            if len(subset) < MIN_SUPPORT:
                continue

            correct = sum(
                row["True_class"].strip()
                == row["Predicted_class"].strip()
                for row in subset
            )

            valid.append({
                "group": group,
                "support": len(subset),
                "recall": correct / len(subset),
            })

        if len(valid) < 2:
            continue

        lowest = min(valid, key=lambda item: item["recall"])
        highest = max(valid, key=lambda item: item["recall"])
        gap = highest["recall"] - lowest["recall"]

        print(
            f"{grouping_name:12} "
            f"{disease:35} "
            f"{lowest['group']:18} "
            f"{lowest['recall']:8.2%} "
            f"{highest['group']:18} "
            f"{highest['recall']:8.2%} "
            f"{gap:8.2%}"
        )

# Save detailed per-group, per-diagnosis results.
output_file = OUTPUT_DIR / "diagnosis_adjusted_fairness.csv"

with open(output_file, "w", encoding="utf-8", newline="") as file:
    fieldnames = [
        "Grouping",
        "Skin_tone_group",
        "Diagnosis",
        "Support",
        "Correct",
        "Recall",
    ]

    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(results)

print("\nDetailed results saved to:", output_file)
print("\nInterpretation:")
print("- Recall comparisons use the same diagnosis within each skin-tone scale.")
print("- Groups with fewer than 10 examples are excluded from gap comparisons.")
print("- A 10-example threshold is only a screening rule, not proof of reliability.")
print("- These observational differences do not establish causation.")
print("- No multiple-comparison correction is applied to the displayed gaps.")
print("- This analysis does not establish clinical safety.")