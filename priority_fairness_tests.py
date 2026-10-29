import csv
import math
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
INPUT_FILE = BASE_DIR / "evaluation_results" / "test_predictions.csv"
OUTPUT_DIR = BASE_DIR / "evaluation_results"

OUTPUT_DIR.mkdir(exist_ok=True)

if not INPUT_FILE.exists():
    raise FileNotFoundError(f"Missing input file: {INPUT_FILE}")

with open(INPUT_FILE, "r", encoding="utf-8-sig", newline="") as file:
    rows = list(csv.DictReader(file))

if not rows:
    raise ValueError("Prediction file is empty.")


def wilson_interval(successes, total, z=1.959963984540054):
    if total == 0:
        return float("nan"), float("nan")

    p = successes / total
    denominator = 1 + z * z / total

    center = (p + z * z / (2 * total)) / denominator

    margin = (
        z
        * math.sqrt(
            p * (1 - p) / total
            + z * z / (4 * total * total)
        )
        / denominator
    )

    return max(0.0, center - margin), min(1.0, center + margin)


def log_combination(n, k):
    if k < 0 or k > n:
        return float("-inf")

    return (
        math.lgamma(n + 1)
        - math.lgamma(k + 1)
        - math.lgamma(n - k + 1)
    )


def fisher_exact_two_sided(success_a, failure_a, success_b, failure_b):
    row_a = success_a + failure_a
    row_b = success_b + failure_b
    total_success = success_a + success_b
    total = row_a + row_b

    if min(row_a, row_b) == 0:
        return 1.0

    denominator = log_combination(total, total_success)

    def probability(x):
        return math.exp(
            log_combination(row_a, x)
            + log_combination(row_b, total_success - x)
            - denominator
        )

    observed = probability(success_a)

    lower = max(0, total_success - row_b)
    upper = min(row_a, total_success)

    p_value = sum(
        probability(x)
        for x in range(lower, upper + 1)
        if probability(x) <= observed * (1 + 1e-12)
    )

    return min(1.0, p_value)


def holm_adjust(p_values):
    count = len(p_values)
    order = sorted(range(count), key=lambda i: p_values[i])
    adjusted = [0.0] * count
    running_max = 0.0

    for rank, index in enumerate(order):
        value = min(1.0, (count - rank) * p_values[index])
        running_max = max(running_max, value)
        adjusted[index] = running_max

    return adjusted


# Priority comparisons selected from the exploratory results.
comparisons = [
    {
        "diagnosis": "Pigmentary Disorders",
        "scale": "Fitzpatrick",
        "group_a": "FST 3",
        "group_b": "FST 5",
    },
    {
        "diagnosis": "Inflammatory Disorders",
        "scale": "Fitzpatrick",
        "group_a": "FST 3",
        "group_b": "FST 5",
    },
    {
        "diagnosis": "Infectious Disorders",
        "scale": "Fitzpatrick",
        "group_a": "FST 3",
        "group_b": "FST 5",
    },
    {
        "diagnosis": "Pigmentary Disorders",
        "scale": "Monk",
        "group_a": "MST 5",
        "group_b": "MST 8",
    },
    {
        "diagnosis": "Inflammatory Disorders",
        "scale": "Monk",
        "group_a": "MST 5",
        "group_b": "MST 8",
    },
]

scale_columns = {
    "Fitzpatrick": "Fitzpatrick",
    "Monk": "Monk_skin_tone",
}

results = []

for comparison in comparisons:
    diagnosis = comparison["diagnosis"]
    scale = comparison["scale"]
    column = scale_columns[scale]
    group_a = comparison["group_a"]
    group_b = comparison["group_b"]

    group_stats = {}

    for group in (group_a, group_b):
        subset = [
            row for row in rows
            if row.get(column, "").strip() == group
            and row.get("True_class", "").strip() == diagnosis
        ]

        total = len(subset)
        correct = sum(
            row.get("True_class", "").strip()
            == row.get("Predicted_class", "").strip()
            for row in subset
        )

        low, high = wilson_interval(correct, total)

        group_stats[group] = {
            "n": total,
            "correct": correct,
            "recall": correct / total if total else float("nan"),
            "ci_low": low,
            "ci_high": high,
        }

    a = group_stats[group_a]
    b = group_stats[group_b]

    if a["n"] == 0 or b["n"] == 0:
        print(f"Skipping comparison with empty group: {comparison}")
        continue

    p_value = fisher_exact_two_sided(
        a["correct"],
        a["n"] - a["correct"],
        b["correct"],
        b["n"] - b["correct"],
    )

    results.append({
        "Scale": scale,
        "Diagnosis": diagnosis,
        "Group_A": group_a,
        "A_n": a["n"],
        "A_correct": a["correct"],
        "A_recall": a["recall"],
        "A_CI95_low": a["ci_low"],
        "A_CI95_high": a["ci_high"],
        "Group_B": group_b,
        "B_n": b["n"],
        "B_correct": b["correct"],
        "B_recall": b["recall"],
        "B_CI95_low": b["ci_low"],
        "B_CI95_high": b["ci_high"],
        "Difference_A_minus_B_pp": 100 * (a["recall"] - b["recall"]),
        "P_value": p_value,
    })


adjusted = holm_adjust([result["P_value"] for result in results])

for result, adjusted_p in zip(results, adjusted):
    result["Holm_adjusted_p"] = adjusted_p

print("\n" + "=" * 120)
print("PRIORITY FAIRNESS COMPARISONS")
print("=" * 120)

for result in results:
    print(f"\n{result['Scale']} | {result['Diagnosis']}")
    print(
        f"{result['Group_A']}: "
        f"{result['A_correct']}/{result['A_n']} "
        f"({result['A_recall']:.2%}), "
        f"95% CI [{result['A_CI95_low']:.2%}, "
        f"{result['A_CI95_high']:.2%}]"
    )
    print(
        f"{result['Group_B']}: "
        f"{result['B_correct']}/{result['B_n']} "
        f"({result['B_recall']:.2%}), "
        f"95% CI [{result['B_CI95_low']:.2%}, "
        f"{result['B_CI95_high']:.2%}]"
    )
    print(
        f"Difference A-B: "
        f"{result['Difference_A_minus_B_pp']:.2f} percentage points"
    )
    print(f"Fisher exact p-value: {result['P_value']:.6f}")
    print(f"Holm-adjusted p-value: {result['Holm_adjusted_p']:.6f}")


output_file = OUTPUT_DIR / "priority_fairness_tests.csv"

with open(output_file, "w", encoding="utf-8", newline="") as file:
    writer = csv.DictWriter(file, fieldnames=list(results[0].keys()))
    writer.writeheader()
    writer.writerows(results)

print(f"\nResults saved to: {output_file}")
print("\nThese are exploratory comparisons selected after inspecting the same test set.")
print("P-values do not establish causality or clinical significance.")
print("Confidence intervals are unadjusted.")