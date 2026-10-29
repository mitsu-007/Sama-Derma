
import csv
import math
import os
from collections import defaultdict

# --------------------------------------------------
# Configuration
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INPUT_FILE = os.path.join(
    BASE_DIR,
    "evaluation_results",
    "test_predictions.csv"
)

OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "evaluation_results",
    "fairness_confidence_intervals.csv"
)

# 95% confidence interval
Z = 1.96


# --------------------------------------------------
# Wilson confidence interval
# --------------------------------------------------

def wilson_interval(correct, total, z=Z):
    """
    Calculate a 95% Wilson confidence interval
    for a binomial proportion.
    """

    if total == 0:
        return None, None

    p = correct / total
    z_squared = z * z

    denominator = 1 + z_squared / total

    center = (
        p + z_squared / (2 * total)
    ) / denominator

    margin = (
        z
        * math.sqrt(
            (p * (1 - p) / total)
            + (z_squared / (4 * total * total))
        )
        / denominator
    )

    lower = max(0.0, center - margin)
    upper = min(1.0, center + margin)

    return lower, upper


# --------------------------------------------------
# Load test predictions
# --------------------------------------------------

if not os.path.exists(INPUT_FILE):
    raise FileNotFoundError(
        f"Could not find input file: {INPUT_FILE}"
    )

groups = {
    "Fitzpatrick": defaultdict(
        lambda: {"total": 0, "correct": 0}
    ),
    "Monk": defaultdict(
        lambda: {"total": 0, "correct": 0}
    ),
}

with open(
    INPUT_FILE,
    "r",
    encoding="utf-8-sig",
    newline=""
) as file:

    reader = csv.DictReader(file)

    required_columns = {
        "True_class",
        "Predicted_class",
        "Fitzpatrick",
        "Monk_skin_tone",
    }

    missing = required_columns - set(reader.fieldnames or [])

    if missing:
        raise ValueError(
            f"Missing required columns: {sorted(missing)}"
        )

    for row in reader:

        is_correct = (
            row["True_class"].strip()
            == row["Predicted_class"].strip()
        )

        subgroup_values = {
            "Fitzpatrick": row["Fitzpatrick"].strip(),
            "Monk": row["Monk_skin_tone"].strip(),
        }

        for scale, group_name in subgroup_values.items():

            if not group_name or group_name.lower() in {
                "nan", "none", "null"
            }:
                continue

            stats = groups[scale][group_name]

            stats["total"] += 1

            if is_correct:
                stats["correct"] += 1


# --------------------------------------------------
# Calculate confidence intervals
# --------------------------------------------------

results = []

for scale in ["Fitzpatrick", "Monk"]:

    print("\n" + "=" * 90)
    print(f"{scale.upper()} — ACCURACY WITH 95% CONFIDENCE INTERVALS")
    print("=" * 90)

    print(
        f"{'Group':<15}"
        f"{'N':>8}"
        f"{'Correct':>10}"
        f"{'Accuracy':>13}"
        f"{'95% CI Lower':>17}"
        f"{'95% CI Upper':>17}"
    )

    for group_name, stats in sorted(
        groups[scale].items(),
        key=lambda item: int(
            item[0].split()[-1]
        ) if item[0].split()[-1].isdigit()
        else item[0]
    ):

        total = stats["total"]
        correct = stats["correct"]

        accuracy = correct / total

        lower, upper = wilson_interval(
            correct,
            total
        )

        result = {
            "Scale": scale,
            "Group": group_name,
            "N": total,
            "Correct": correct,
            "Accuracy": round(accuracy, 6),
            "CI95_Lower": round(lower, 6),
            "CI95_Upper": round(upper, 6),
        }

        results.append(result)

        print(
            f"{group_name:<15}"
            f"{total:>8}"
            f"{correct:>10}"
            f"{accuracy * 100:>12.2f}%"
            f"{lower * 100:>16.2f}%"
            f"{upper * 100:>16.2f}%"
        )


# --------------------------------------------------
# Save results
# --------------------------------------------------

os.makedirs(
    os.path.dirname(OUTPUT_FILE),
    exist_ok=True
)

with open(
    OUTPUT_FILE,
    "w",
    encoding="utf-8",
    newline=""
) as file:

    fieldnames = [
        "Scale",
        "Group",
        "N",
        "Correct",
        "Accuracy",
        "CI95_Lower",
        "CI95_Upper",
    ]

    writer = csv.DictWriter(
        file,
        fieldnames=fieldnames
    )

    writer.writeheader()
    writer.writerows(results)


print("\nResults saved to:")
print(OUTPUT_FILE)

print(
    "\nInterpretation note: These intervals quantify sampling "
    "uncertainty under a binomial model. They do not account for "
    "all dataset, diagnostic-mix, or model-evaluation limitations."
)

