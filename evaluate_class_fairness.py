import csv
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parent

PREDICTIONS_FILE = (
    BASE_DIR / "evaluation_results" / "test_predictions.csv"
)

OUTPUT_DIR = BASE_DIR / "evaluation_results"
OUTPUT_DIR.mkdir(exist_ok=True)

with open(
    PREDICTIONS_FILE,
    "r",
    encoding="utf-8-sig",
    newline=""
) as file:
    rows = list(csv.DictReader(file))

if not rows:
    raise ValueError("No prediction records found.")

group_columns = {
    "Fitzpatrick": "Fitzpatrick",
    "Monk": "Monk_skin_tone",
}

results = []

for grouping_name, column in group_columns.items():

    grouped = defaultdict(list)

    for row in rows:
        group = row.get(column, "").strip() or "Missing/Unlabelled"
        disease = row.get("True_class", "").strip()

        if not disease:
            continue

        grouped[(group, disease)].append(row)

    all_diseases = sorted({
        row["True_class"].strip()
        for row in rows
        if row.get("True_class", "").strip()
    })

    print("\n" + "=" * 95)
    print(f"{grouping_name.upper()} — PER-CLASS RECALL")
    print("=" * 95)

    print(
        f"{'Group':22} "
        f"{'Diagnostic category':32} "
        f"{'N':>6} "
        f"{'Correct':>8} "
        f"{'Recall':>10}"
    )

    for group in sorted({
        row.get(column, "").strip() or "Missing/Unlabelled"
        for row in rows
    }):

        for disease in all_diseases:

            subset = grouped.get((group, disease), [])

            if not subset:
                continue

            total = len(subset)

            correct = sum(
                row["True_class"].strip()
                == row["Predicted_class"].strip()
                for row in subset
            )

            recall = correct / total

            print(
                f"{group:22} "
                f"{disease:32} "
                f"{total:6d} "
                f"{correct:8d} "
                f"{recall:9.2%}"
            )

            results.append({
                "Grouping": grouping_name,
                "Skin_tone_group": group,
                "Disease_class": disease,
                "Support": total,
                "Correct": correct,
                "Recall": recall,
            })


output_file = OUTPUT_DIR / "per_class_skin_tone_recall.csv"

with open(
    output_file,
    "w",
    encoding="utf-8",
    newline=""
) as file:

    fieldnames = [
        "Grouping",
        "Skin_tone_group",
        "Disease_class",
        "Support",
        "Correct",
        "Recall",
    ]

    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(results)

print("\nResults saved to:")
print(output_file)

print(
    "\nCaution: Recall estimates based on small subgroup counts "
    "are highly uncertain. These comparisons are exploratory, "
    "not proof that skin tone causes performance differences."
)