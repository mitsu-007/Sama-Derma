import csv
from pathlib import Path
from collections import Counter, defaultdict

BASE_DIR = Path(__file__).resolve().parent
INPUT_FILE = BASE_DIR / "evaluation_results" / "test_predictions.csv"
OUTPUT_DIR = BASE_DIR / "evaluation_results"

OUTPUT_DIR.mkdir(exist_ok=True)

if not INPUT_FILE.exists():
    raise FileNotFoundError(f"Missing file: {INPUT_FILE}")

with open(INPUT_FILE, "r", encoding="utf-8-sig", newline="") as file:
    rows = list(csv.DictReader(file))

if not rows:
    raise ValueError("Prediction file is empty.")

TARGET_DIAGNOSIS = "Pigmentary Disorders"

comparisons = [
    ("Fitzpatrick", "FST 3"),
    ("Fitzpatrick", "FST 5"),
]

group_definitions = {
    "Fitzpatrick": "Fitzpatrick",
    "Monk": "Monk_skin_tone",
}

output_rows = []

for scale, group in comparisons:
    column = group_definitions[scale]

    subset = [
        row for row in rows
        if row.get(column, "").strip() == group
        and row.get("True_class", "").strip() == TARGET_DIAGNOSIS
    ]

    if not subset:
        print(f"\nNo matching records for {scale} {group}.")
        continue

    correct = sum(
        row["True_class"].strip() == row["Predicted_class"].strip()
        for row in subset
    )

    errors = [
        row for row in subset
        if row["True_class"].strip() != row["Predicted_class"].strip()
    ]

    print("\n" + "=" * 85)
    print(f"{TARGET_DIAGNOSIS} | {scale} | {group}")
    print("=" * 85)

    print(f"Total cases: {len(subset)}")
    print(f"Correct predictions: {correct}")
    print(f"Incorrect predictions: {len(errors)}")
    print(f"Recall: {correct / len(subset):.2%}")

    error_counts = Counter(
        row["Predicted_class"].strip()
        for row in errors
    )

    print("\nMost common incorrect predictions:")

    if not error_counts:
        print("No errors in this subgroup.")
    else:
        for predicted_class, count in error_counts.most_common():
            percentage = count / len(errors) * 100

            print(
                f"{predicted_class:35} "
                f"{count:4d} cases "
                f"({percentage:.2f}% of errors)"
            )

            output_rows.append({
                "Scale": scale,
                "Skin_tone_group": group,
                "True_class": TARGET_DIAGNOSIS,
                "Incorrect_prediction": predicted_class,
                "Error_count": count,
                "Total_errors": len(errors),
                "Percentage_of_errors": percentage,
            })

output_file = OUTPUT_DIR / "priority_error_analysis.csv"

with open(output_file, "w", encoding="utf-8", newline="") as file:
    fieldnames = [
        "Scale",
        "Skin_tone_group",
        "True_class",
        "Incorrect_prediction",
        "Error_count",
        "Total_errors",
        "Percentage_of_errors",
    ]

    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(output_rows)

print(f"\nResults saved to: {output_file}")
print("\nImportant: Error patterns alone do not establish why errors occur.")