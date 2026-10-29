
import csv
import math
import os
from collections import defaultdict
from itertools import combinations

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INPUT_FILE = os.path.join(
    BASE_DIR, "evaluation_results", "test_predictions.csv"
)

OUTPUT_FILE = os.path.join(
    BASE_DIR, "evaluation_results", "fairness_difference_analysis.csv"
)

MIN_GROUP_SIZE = 10
Z = 1.96


def wilson_interval(correct, total):
    """95% Wilson interval for a single proportion."""
    if total == 0:
        return float("nan"), float("nan")

    p = correct / total
    z2 = Z * Z
    denominator = 1 + z2 / total
    center = (p + z2 / (2 * total)) / denominator

    margin = (
        Z * math.sqrt(
            p * (1 - p) / total
            + z2 / (4 * total * total)
        ) / denominator
    )

    return max(0.0, center - margin), min(1.0, center + margin)


def log_choose(n, k):
    if k < 0 or k > n:
        return float("-inf")

    return (
        math.lgamma(n + 1)
        - math.lgamma(k + 1)
        - math.lgamma(n - k + 1)
    )


def hypergeom_probability(x, row1, row2, successes):
    low = max(0, successes - row2)
    high = min(row1, successes)

    if x < low or x > high:
        return 0.0

    return math.exp(
        log_choose(row1, x)
        + log_choose(row2, successes - x)
        - log_choose(row1 + row2, successes)
    )


def fisher_exact_two_sided(a, b, c, d):
    """Two-sided Fisher exact test for a 2x2 table."""
    row1 = a + b
    row2 = c + d
    successes = a + c

    low = max(0, successes - row2)
    high = min(row1, successes)

    observed = hypergeom_probability(
        a, row1, row2, successes
    )

    p_value = 0.0

    for x in range(low, high + 1):
        probability = hypergeom_probability(
            x, row1, row2, successes
        )

        if probability <= observed + 1e-12:
            p_value += probability

    return min(1.0, p_value)


def holm_adjust(p_values):
    """Holm-Bonferroni adjustment across all supplied tests."""
    m = len(p_values)

    if m == 0:
        return []

    ordered = sorted(
        enumerate(p_values),
        key=lambda item: item[1]
    )

    adjusted = [1.0] * m
    running_max = 0.0

    for rank, (original_index, p_value) in enumerate(ordered):
        value = min(1.0, (m - rank) * p_value)
        running_max = max(running_max, value)
        adjusted[original_index] = running_max

    return adjusted


def newcombe_difference_interval(a, n1, b, n2):
    """
    Newcombe-Wilson confidence interval for p1 - p2.
    Returns difference, lower bound, upper bound.
    """
    p1 = a / n1
    p2 = b / n2
    difference = p1 - p2

    low1, high1 = wilson_interval(a, n1)
    low2, high2 = wilson_interval(b, n2)

    lower = difference - math.sqrt(
        (p1 - low1) ** 2 + (high2 - p2) ** 2
    )

    upper = difference + math.sqrt(
        (high1 - p1) ** 2 + (p2 - low2) ** 2
    )

    return (
        difference,
        max(-1.0, lower),
        min(1.0, upper)
    )


# --------------------------------------------------
# Read prediction results
# --------------------------------------------------

if not os.path.exists(INPUT_FILE):
    raise FileNotFoundError(INPUT_FILE)

stats = defaultdict(lambda: {"n": 0, "correct": 0})

with open(
    INPUT_FILE, "r", encoding="utf-8-sig", newline=""
) as file:

    reader = csv.DictReader(file)

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
        prediction = row["Predicted_class"].strip()

        if not diagnosis or not prediction:
            continue

        correct = int(diagnosis == prediction)

        for scale, group in [
            ("Fitzpatrick", row["Fitzpatrick"].strip()),
            ("Monk", row["Monk_skin_tone"].strip()),
        ]:
            if not group or group.lower() in {
                "nan", "none", "null"
            }:
                continue

            entry = stats[(scale, diagnosis, group)]
            entry["n"] += 1
            entry["correct"] += correct


# --------------------------------------------------
# Generate pairwise comparisons
# --------------------------------------------------

results = []

for scale in ("Fitzpatrick", "Monk"):

    diagnoses = sorted({
        diagnosis
        for s, diagnosis, _ in stats
        if s == scale
    })

    for diagnosis in diagnoses:

        eligible = []

        for (s, d, group), values in stats.items():

            if s != scale or d != diagnosis:
                continue

            if values["n"] < MIN_GROUP_SIZE:
                continue

            eligible.append({
                "group": group,
                "n": values["n"],
                "correct": values["correct"],
            })

        eligible.sort(key=lambda x: x["group"])

        for g1, g2 in combinations(eligible, 2):

            a = g1["correct"]
            n1 = g1["n"]
            b = g2["correct"]
            n2 = g2["n"]

            p1 = a / n1
            p2 = b / n2

            difference, ci_low, ci_high = (
                newcombe_difference_interval(a, n1, b, n2)
            )

            p_value = fisher_exact_two_sided(
                a, n1 - a, b, n2 - b
            )

            results.append({
                "Scale": scale,
                "Diagnosis": diagnosis,
                "Group_A": g1["group"],
                "N_A": n1,
                "Correct_A": a,
                "Recall_A": p1,
                "Group_B": g2["group"],
                "N_B": n2,
                "Correct_B": b,
                "Recall_B": p2,
                "Difference_A_minus_B": difference,
                "Difference_pp": difference * 100,
                "Difference_CI95_Lower": ci_low,
                "Difference_CI95_Upper": ci_high,
                "P_Value": p_value,
            })


# --------------------------------------------------
# Correct across the entire family of generated tests
# --------------------------------------------------

adjusted_p_values = holm_adjust([
    row["P_Value"] for row in results
])

for row, adjusted in zip(results, adjusted_p_values):
    row["Holm_Adjusted_P_Global"] = adjusted
    row["Significant_after_global_Holm_0.05"] = (
        "Yes" if adjusted < 0.05 else "No"
    )


# --------------------------------------------------
# Print selected comparisons
# --------------------------------------------------

print("\nGLOBAL MULTIPLE-COMPARISON ANALYSIS")
print("=" * 105)
print(f"Total pairwise tests: {len(results)}")
print("Holm correction applied across all generated tests.")
print("Difference = recall of Group A minus recall of Group B.")
print("Difference confidence intervals are unadjusted 95% intervals.\n")

selected = [
    row for row in results
    if row["Diagnosis"] in {
        "Pigmentary Disorders",
        "Inflammatory Disorders",
        "Infectious Disorders",
    }
]

for row in selected:
    print(
        f"{row['Scale']:<12} | "
        f"{row['Diagnosis']:<28} | "
        f"{row['Group_A']} ({row['Correct_A']}/{row['N_A']}) vs "
        f"{row['Group_B']} ({row['Correct_B']}/{row['N_B']}) | "
        f"Difference={row['Difference_pp']:+.2f} pp | "
        f"95% CI=[{row['Difference_CI95_Lower']*100:+.2f}, "
        f"{row['Difference_CI95_Upper']*100:+.2f}] pp | "
        f"p={row['P_Value']:.5f} | "
        f"global Holm p={row['Holm_Adjusted_P_Global']:.5f}"
    )

print("\nGlobally adjusted significant comparisons:")

significant = [
    row for row in results
    if row["Significant_after_global_Holm_0.05"] == "Yes"
]

if not significant:
    print("None at the 0.05 threshold.")
else:
    for row in significant:
        print(
            f"{row['Scale']} | {row['Diagnosis']} | "
            f"{row['Group_A']} vs {row['Group_B']} | "
            f"global Holm p={row['Holm_Adjusted_P_Global']:.5f}"
        )


# --------------------------------------------------
# Save all comparisons
# --------------------------------------------------

os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

fieldnames = list(results[0].keys()) if results else [
    "Scale", "Diagnosis", "Group_A", "N_A", "Correct_A",
    "Recall_A", "Group_B", "N_B", "Correct_B", "Recall_B",
    "Difference_A_minus_B", "Difference_pp",
    "Difference_CI95_Lower", "Difference_CI95_Upper",
    "P_Value", "Holm_Adjusted_P_Global",
    "Significant_after_global_Holm_0.05",
]

with open(
    OUTPUT_FILE, "w", encoding="utf-8", newline=""
) as file:
    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()

    for row in results:
        writer.writerow(row)

print("\nSaved:", OUTPUT_FILE)
print(
    "\nCaution: Global Holm correction covers all comparisons generated "
    "by this script, not analyses conducted outside it. Confidence "
    "intervals are not multiplicity-adjusted. These observational "
    "results cannot establish that skin tone caused performance differences."
)
