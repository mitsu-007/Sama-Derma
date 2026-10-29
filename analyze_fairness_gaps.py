
import csv
import os
import math
from collections import defaultdict

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INPUT_FILE = os.path.join(
    BASE_DIR, "evaluation_results", "test_predictions.csv"
)

OUTPUT_FILE = os.path.join(
    BASE_DIR, "evaluation_results", "diagnosis_adjusted_fairness.csv"
)

MIN_GROUP_SIZE = 10

# Store counts by skin-tone scale, group, and diagnosis.
stats = defaultdict(
    lambda: {
        "total": 0,
        "correct": 0
    }
)

# Store overall group counts as well.
group_totals = defaultdict(
    lambda: {
        "total": 0,
        "correct": 0
    }
)

with open(
    INPUT_FILE,
    "r",
    encoding="utf-8-sig",
    newline=""
) as f:

    reader = csv.DictReader(f)

    required = {
        "True_class",
        "Predicted_class",
        "Fitzpatrick",
        "Monk_skin_tone",
    }

    missing = required - set(reader.fieldnames or [])

    if missing:
        raise ValueError(f"Missing columns: {sorted(missing)}")

    for row in reader:
        diagnosis = row["True_class"].strip()
        predicted = row["Predicted_class"].strip()

        if not diagnosis or not predicted:
            continue

        correct = int(diagnosis == predicted)

        for scale, group in [
            ("Fitzpatrick", row["Fitzpatrick"].strip()),
            ("Monk", row["Monk_skin_tone"].strip()),
        ]:
            if not group or group.lower() in {"nan", "none", "null"}:
                continue

            key = (scale, group, diagnosis)

            stats[key]["total"] += 1
            stats[key]["correct"] += correct

            group_key = (scale, group)
            group_totals[group_key]["total"] += 1
            group_totals[group_key]["correct"] += correct


# --------------------------------------------------
# Report subgroup performance within each diagnosis
# --------------------------------------------------

results = []

print("\n" + "=" * 105)
print("DIAGNOSIS-STRATIFIED SKIN-TONE PERFORMANCE")
print("=" * 105)

print(
    f"{'Scale':<13}"
    f"{'Group':<12}"
    f"{'Diagnosis':<32}"
    f"{'N':>7}"
    f"{'Correct':>10}"
    f"{'Recall':>12}"
)

for (scale, group, diagnosis), values in sorted(stats.items()):

    n = values["total"]
    correct = values["correct"]
    recall = correct / n

    results.append({
        "Scale": scale,
        "Group": group,
        "Diagnosis": diagnosis,
        "Support": n,
        "Correct": correct,
        "Recall": round(recall, 6),
        "Included_in_primary_comparison": (
            "Yes" if n >= MIN_GROUP_SIZE else "No"
        ),
    })

    print(
        f"{scale:<13}"
        f"{group:<12}"
        f"{diagnosis:<32}"
        f"{n:>7}"
        f"{correct:>10}"
        f"{recall * 100:>11.2f}%"
    )


# --------------------------------------------------
# Calculate within-diagnosis recall ranges
# --------------------------------------------------

print("\n" + "=" * 105)
print("RECALL RANGE ACROSS SKIN-TONE GROUPS")
print(f"Primary comparison: at least {MIN_GROUP_SIZE} cases per group/category")
print("=" * 105)

for scale in ["Fitzpatrick", "Monk"]:

    diagnoses = sorted({
        diagnosis
        for s, _, diagnosis in stats
        if s == scale
    })

    print(f"\n{scale.upper()}")

    for diagnosis in diagnoses:

        eligible = []

        for (s, group, d), values in stats.items():

            if s != scale or d != diagnosis:
                continue

            if values["total"] < MIN_GROUP_SIZE:
                continue

            recall = values["correct"] / values["total"]

            eligible.append({
                "group": group,
                "n": values["total"],
                "correct": values["correct"],
                "recall": recall,
            })

        if len(eligible) < 2:
            print(
                f"  {diagnosis}: insufficient groups with "
                f"at least {MIN_GROUP_SIZE} cases"
            )
            continue

        lowest = min(eligible, key=lambda x: x["recall"])
        highest = max(eligible, key=lambda x: x["recall"])

        gap = highest["recall"] - lowest["recall"]

        print(
            f"  {diagnosis}: "
            f"lowest={lowest['group']} ({lowest['recall']:.1%}, n={lowest['n']}), "
            f"highest={highest['group']} ({highest['recall']:.1%}, n={highest['n']}), "
            f"range={gap:.1%}"
        )


# --------------------------------------------------
# Save output
# --------------------------------------------------

os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

with open(
    OUTPUT_FILE,
    "w",
    encoding="utf-8",
    newline=""
) as f:

    fieldnames = [
        "Scale",
        "Group",
        "Diagnosis",
        "Support",
        "Correct",
        "Recall",
        "Included_in_primary_comparison",
    ]

    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(results)

print("\nDetailed results saved to:")
print(OUTPUT_FILE)

print(
    "\nInterpretation: These are descriptive, diagnosis-stratified "
    "comparisons. The minimum-support threshold is a screening rule, "
    "not a guarantee of statistical reliability. Diagnostic subtypes, "
    "image quality, and other confounders may still differ."
)
