
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
    BASE_DIR, "evaluation_results", "fairness_significance_tests.csv"
)

MIN_GROUP_SIZE = 10
Z = 1.96


def wilson_interval(correct, total):
    """Return a 95% Wilson confidence interval for a proportion."""
    if total == 0:
        return None, None

    p = correct / total
    z2 = Z * Z
    denominator = 1 + z2 / total
    center = (p + z2 / (2 * total)) / denominator

    margin = (
        Z * math.sqrt(
            p * (1 - p) / total + z2 / (4 * total * total)
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


def hypergeometric_probability(x, row1, row2, successes):
    """Probability of a 2x2 table outcome conditional on its margins."""
    if x < max(0, successes - row2) or x > min(row1, successes):
        return 0.0

    return math.exp(
        log_choose(row1, x)
        + log_choose(row2, successes - x)
        - log_choose(row1 + row2, successes)
    )


def fisher_exact_two_sided(a, b, c, d):
    """
    Two-sided Fisher exact p-value for:
        Group A: a correct, b incorrect
        Group B: c correct, d incorrect
    """
    row1 = a + b
    row2 = c + d
    successes = a + c

    lower = max(0, successes - row2)
    upper = min(row1, successes)

    observed = hypergeometric_probability(
        a, row1, row2, successes
    )

    probabilities = [
        hypergeometric_probability(
            x, row1, row2, successes
        )
        for x in range(lower, upper + 1)
    ]

    # Standard probability-based two-sided Fisher test.
    p_value = sum(
        p for p in probabilities
        if p <= observed + 1e-12
    )

    return min(1.0, p_value)


def holm_adjust(p_values):
    """Holm-Bonferroni adjusted p-values, preserving input order."""
    m = len(p_values)
    indexed = sorted(enumerate(p_values), key=lambda x: x[1])

    adjusted = [1.0] * m
    running_max = 0.0

    for rank, (original_index, p_value) in enumerate(indexed):
        candidate = min(1.0, (m - rank) * p_value)
        running_max = max(running_max, candidate)
        adjusted[original_index] = running_max

    return adjusted


# --------------------------------------------------
# Load counts by scale, diagnosis, and skin-tone group
# --------------------------------------------------

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
        predicted = row["Predicted_class"].strip()

        if not diagnosis or not predicted:
            continue

        is_correct = int(diagnosis == predicted)

        for scale, group in (
            ("Fitzpatrick", row["Fitzpatrick"].strip()),
            ("Monk", row["Monk_skin_tone"].strip()),
        ):
            if not group or group.lower() in {"nan", "none", "null"}:
                continue

            key = (scale, diagnosis, group)
            stats[key]["n"] += 1
            stats[key]["correct"] += is_correct


# --------------------------------------------------
# Pairwise comparisons within each diagnosis
# --------------------------------------------------

all_results = []

for scale in ("Fitzpatrick", "Monk"):

    diagnoses = sorted({
        diagnosis
        for s, diagnosis, _ in stats
        if s == scale
    })

    for diagnosis in diagnoses:

        eligible = []

        for (s, d, group), counts in stats.items():
            if s != scale or d != diagnosis:
                continue

            if counts["n"] < MIN_GROUP_SIZE:
                continue

            eligible.append({
                "group": group,
                "n": counts["n"],
                "correct": counts["correct"],
            })

        eligible.sort(key=lambda x: x["group"])

        # Compare all eligible group pairs for this diagnosis and scale.
        comparisons = []

        for g1, g2 in combinations(eligible, 2):
            a = g1["correct"]
            b = g1["n"] - a
            c = g2["correct"]
            d = g2["n"] - c

            recall1 = a / g1["n"]
            recall2 = c / g2["n"]

            ci1 = wilson_interval(a, g1["n"])
            ci2 = wilson_interval(c, g2["n"])

            p_value = fisher_exact_two_sided(a, b, c, d)

            comparisons.append({
                "Scale": scale,
                "Diagnosis": diagnosis,
                "Group_A": g1["group"],
                "N_A": g1["n"],
                "Correct_A": a,
                "Recall_A": round(recall1, 6),
                "CI_A_Lower": round(ci1[0], 6),
                "CI_A_Upper": round(ci1[1], 6),
                "Group_B": g2["group"],
                "N_B": g2["n"],
                "Correct_B": c,
                "Recall_B": round(recall2, 6),
                "CI_B_Lower": round(ci2[0], 6),
                "CI_B_Upper": round(ci2[1], 6),
                "Recall_Difference_A_minus_B": round(
                    recall1 - recall2, 6
                ),
                "P_Value": p_value,
            })

        adjusted = holm_adjust([
            item["P_Value"] for item in comparisons
        ])

        for item, adjusted_p in zip(comparisons, adjusted):
            item["Holm_Adjusted_P"] = round(adjusted_p, 8)
            item["Significant_after_Holm_0.05"] = (
                "Yes" if adjusted_p < 0.05 else "No"
            )
            all_results.append(item)


# --------------------------------------------------
# Print summary
# --------------------------------------------------

print("\n" + "=" * 115)
print("PAIRWISE RECALL COMPARISONS WITHIN DIAGNOSTIC CATEGORIES")
print("=" * 115)
print("Fisher's exact two-sided test; Holm correction.")
print(f"Minimum group support: {MIN_GROUP_SIZE}\n")

if not all_results:
    print("No eligible pairwise comparisons were found.")
else:
    for item in all_results:
        print(
            f"{item['Scale']:<12} | "
            f"{item['Diagnosis']:<30} | "
            f"{item['Group_A']} ({item['Correct_A']}/{item['N_A']}, "
            f"{item['Recall_A']:.1%}) vs "
            f"{item['Group_B']} ({item['Correct_B']}/{item['N_B']}, "
            f"{item['Recall_B']:.1%}) | "
            f"p={item['P_Value']:.5f} | "
            f"Holm p={item['Holm_Adjusted_P']:.5f}"
        )


# --------------------------------------------------
# Save all results
# --------------------------------------------------

os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

fieldnames = [
    "Scale",
    "Diagnosis",
    "Group_A",
    "N_A",
    "Correct_A",
    "Recall_A",
    "CI_A_Lower",
    "CI_A_Upper",
    "Group_B",
    "N_B",
    "Correct_B",
    "Recall_B",
    "CI_B_Lower",
    "CI_B_Upper",
    "Recall_Difference_A_minus_B",
    "P_Value",
    "Holm_Adjusted_P",
    "Significant_after_Holm_0.05",
]

with open(
    OUTPUT_FILE, "w", encoding="utf-8", newline=""
) as file:
    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()

    for item in all_results:
        writer.writerow(item)

print("\nResults saved to:")
print(OUTPUT_FILE)

print(
    "\nImportant: These are exploratory pairwise tests. The minimum "
    "support threshold is not a guarantee of adequate statistical power. "
    "Holm correction is applied separately within each diagnosis and "
    "skin-tone scale, not across every test in the entire analysis. "
    "The confidence intervals are individual Wilson intervals, not "
    "confidence intervals for the difference between recalls."
)
