"""Empirical CPU vs CUDA inference latency benchmark for SamaDerma Swin-B.

Measures 10 consecutive single-image forward passes on CUDA (RTX 3050)
and 10 consecutive single-image forward passes on CPU (AMD Ryzen 5 / Host CPU).
Reports empirical statistics (mean, median, p95, min, max) and memory consumption.
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

import numpy as np
import torch
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import demo_inference


def run_benchmark(device_str: str, num_runs: int = 10) -> dict:
    print(f"\n--- Benchmarking on device: {device_str} ---")
    device = torch.device(device_str)

    # Instantiate engine with specified device
    engine = demo_inference.load_inference_engine()
    engine.model.to(device)
    engine.device = device
    engine.model.eval()

    # Create synthetic test image (512x512 RGB)
    synthetic_img = Image.new("RGB", (512, 512), color=(128, 100, 90))

    # Warmup
    print("Executing warmup pass...")
    if device.type == "cuda":
        torch.cuda.synchronize()
    demo_inference.predict_image(synthetic_img, engine)
    if device.type == "cuda":
        torch.cuda.synchronize()

    # Benchmark passes
    latencies = []
    print(f"Executing {num_runs} inference passes...")
    for i in range(num_runs):
        if device.type == "cuda":
            torch.cuda.synchronize()
        t0 = time.perf_counter()
        
        preds = demo_inference.predict_image(synthetic_img, engine)
        
        if device.type == "cuda":
            torch.cuda.synchronize()
        t1 = time.perf_counter()
        elapsed_ms = (t1 - t0) * 1000.0
        latencies.append(elapsed_ms)
        print(f"  Run {i+1:02d}: {elapsed_ms:.2f} ms (top class: {preds[0]['category']})")

    latencies = np.array(latencies)
    results = {
        "device": device_str,
        "runs": num_runs,
        "mean_ms": float(np.mean(latencies)),
        "median_ms": float(np.median(latencies)),
        "std_ms": float(np.std(latencies)),
        "min_ms": float(np.min(latencies)),
        "max_ms": float(np.max(latencies)),
        "p95_ms": float(np.percentile(latencies, 95)),
    }

    if device.type == "cuda":
        results["vram_allocated_mb"] = float(torch.cuda.memory_allocated() / (1024 * 1024))
        results["vram_reserved_mb"] = float(torch.cuda.memory_reserved() / (1024 * 1024))
        print(f"CUDA VRAM: {results['vram_allocated_mb']:.1f} MB allocated, {results['vram_reserved_mb']:.1f} MB reserved")

    print(f"Summary for {device_str}: mean={results['mean_ms']:.2f} ms, median={results['median_ms']:.2f} ms, min={results['min_ms']:.2f} ms, max={results['max_ms']:.2f} ms")
    return results


def main():
    benchmarks = {}
    
    if torch.cuda.is_available():
        cuda_device_name = torch.cuda.get_device_name(0)
        print(f"CUDA is available: {cuda_device_name}")
        benchmarks["cuda"] = run_benchmark("cuda", num_runs=10)
        benchmarks["cuda"]["device_name"] = cuda_device_name
    else:
        print("CUDA is NOT available.")

    benchmarks["cpu"] = run_benchmark("cpu", num_runs=10)
    benchmarks["cpu"]["device_name"] = os.environ.get("PROCESSOR_IDENTIFIER", "CPU")

    output_path = PROJECT_ROOT / "backend" / "benchmark_results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(benchmarks, f, indent=2)

    print(f"\nBenchmark saved to {output_path}")


if __name__ == "__main__":
    main()
