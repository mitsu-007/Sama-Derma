import csv
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parent
PREDICTIONS_FILE = BASE_DIR / "evaluation_results" / "test_predictions.csv"
OUTPUT_DIR = BASE_DIR / "evaluation_results"

OUTPUT_DIR.mkdir(exist_ok=True)

if not PREDICTIONS_FILE.exists():
    raise FileNotFoundError(f"Predictions file not found: {PREDICTIONS_FILE}")

with open(PREDICTIONS_FILE, "r", encoding="utf-8-sig", newline="") as file:
    rows = list(csv.DictReader(file))

if not rows:
    raise ValueError("The predictions file is empty.")

ALL_LABELS = sorted({
    row["True_class"].strip()
    for row in rows
    if row.get("True_class", "").strip()
})

if len(ALL_LABELS) != 8:
    raise ValueError(
        f"Expected 8 diagnostic classes, found {len(ALL_LABELS)}: {ALL_LABELS}"
    )


def calculate_metrics(group_rows):
    total = len(group_rows)
    correct = sum(int(row["Correct"]) for row in group_rows)
    accuracy = correct / total if total else 0.0

    f1_scores = []

    for label in ALL_LABELS:
        tp = sum(
            1 for row in group_rows
            if row["True_class"].strip() == label
            and row["Predicted_class"].strip() == label
        )

        actual = sum(
            1 for row in group_rows
            if row["True_class"].strip() == label
        )

        predicted = sum(
            1 for row in group_rows
            if row["Predicted_class"].strip() == label
        )

        precision = tp / predicted if predicted else 0.0
        recall = tp / actual if actual else 0.0

        f1 = (
            2 * precision * recall / (precision + recall)
            if precision + recall else 0.0
        )

        f1_scores.append(f1)

    macro_f1 = sum(f1_scores) / len(ALL_LABELS)

    return {
        "n": total,
        "correct": correct,
        "accuracy": accuracy,
        "macro_f1_all_8_classes": macro_f1,
    }


group_definitions = {
    "Fitzpatrick": "Fitzpatrick",
    "Monk": "Monk_skin_tone",
}

all_results = []

for grouping_name, column in group_definitions.items():
    groups = defaultdict(list)

    for row in rows:
        value = row.get(column, "").strip()
        groups[value if value else "Missing/Unlabelled"].append(row)

    print("\n" + "=" * 85)
    print(f"{grouping_name.upper()} SKIN-TONE EVALUATION")
    print("=" * 85)

    print(
        f"{'Group':25} {'N':>6} {'Accuracy':>12} "
        f"{'Macro F1 (8)':>15} {'Correct':>10}"
    )

    for group_name, group_rows in sorted(groups.items()):
        metrics = calculate_metrics(group_rows)

        print(
            f"{group_name:25} "
            f"{metrics['n']:6d} "
            f"{metrics['accuracy']:11.2%} "
            f"{metrics['macro_f1_all_8_classes']:15.4f} "
            f"{metrics['correct']:10d}"
        )

        all_results.append({
            "Grouping": grouping_name,
            "Skin_tone_group": group_name,
            **metrics,
        })


output_file = OUTPUT_DIR / "skin_tone_fairness_results_fixed8.csv"

with open(output_file, "w", encoding="utf-8", newline="") as file:
    fieldnames = [
        "Grouping",
        "Skin_tone_group",
        "n",
        "correct",
        "accuracy",
        "macro_f1_all_8_classes",
    ]

    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(all_results)

print("\nResults saved to:", output_file)
print("\nInterpretation safeguards:")
print("- All subgroups use the same eight diagnostic classes.")
print("- Missing classes receive an F1 score of zero.")
print("- Small groups have highly uncertain metrics.")
print("- Differences do not establish that skin tone caused the gap.")
print("- This analysis is not clinical validation.")