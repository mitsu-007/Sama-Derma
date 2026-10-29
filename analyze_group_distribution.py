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

    print("\n" + "=" * 90)
    print(f"{grouping_name.upper()}: DIAGNOSTIC DISTRIBUTION")
    print("=" * 90)

    grouped_counts = defaultdict(lambda: defaultdict(int))

    for row in rows:
        group = row.get(column, "").strip() or "Missing/Unlabelled"
        disease = row.get("True_class", "").strip() or "Unknown"

        grouped_counts[group][disease] += 1

    diseases = sorted({
        row.get("True_class", "").strip()
        for row in rows
        if row.get("True_class", "").strip()
    })

    print(f"{'Group':24} {'Total':>7}", end="")

    for disease in diseases:
        print(f" | {disease[:14]:14}", end="")

    print()

    for group in sorted(grouped_counts):

        counts = grouped_counts[group]
        total = sum(counts.values())

        print(f"{group:24} {total:7d}", end="")

        for disease in diseases:
            count = counts.get(disease, 0)

            print(f" | {count:14d}", end="")

            results.append({
                "Grouping": grouping_name,
                "Skin_tone_group": group,
                "Disease_class": disease,
                "Count": count,
                "Group_total": total,
                "Within_group_percentage": (
                    100 * count / total if total else 0
                ),
            })

        print()


output_file = OUTPUT_DIR / "group_diagnostic_distribution.csv"

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
        "Count",
        "Group_total",
        "Within_group_percentage",
    ]

    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(results)

print("\nSaved diagnostic distribution to:")
print(output_file)