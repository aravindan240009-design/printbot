"""
Representative Load & Latency Benchmarking Harness for Xerox Cloud SaaS.
Measures p50, p95, p99 latencies and throughput across critical customer & hardware flows.
"""

import asyncio
import time
import statistics
import json
import hmac
import hashlib
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from typing import List, Dict, Any
from httpx import AsyncClient, ASGITransport
from services.api.main import app
from services.api.core.config import settings


def compute_metrics(latencies_ms: List[float], name: str) -> Dict[str, Any]:
    latencies_sorted = sorted(latencies_ms)
    count = len(latencies_sorted)
    p50 = latencies_sorted[int(count * 0.50)]
    p95 = latencies_sorted[min(count - 1, int(count * 0.95))]
    p99 = latencies_sorted[min(count - 1, int(count * 0.99))]
    return {
        "operation": name,
        "sample_count": count,
        "min_ms": round(latencies_sorted[0], 2),
        "mean_ms": round(statistics.mean(latencies_sorted), 2),
        "p50_ms": round(p50, 2),
        "p95_ms": round(p95, 2),
        "p99_ms": round(p99, 2),
        "max_ms": round(latencies_sorted[-1], 2),
    }


async def benchmark_pricing_quotes(client: AsyncClient, n_requests: int = 100) -> Dict[str, Any]:
    payload = {
        "page_count": 36,
        "options": {
            "copies": 2,
            "color_mode": "color",
            "paper_size": "A4",
            "duplex_mode": "duplex_long",
            "orientation": "portrait",
            "binding": "staple",
            "paper_gsm": 100,
        }
    }
    latencies: List[float] = []
    headers = {"X-Tenant-ID": "tenant-benchmark"}

    for _ in range(n_requests):
        t0 = time.perf_counter()
        res = await client.post("/api/v1/orders/quote", json=payload, headers=headers)
        t1 = time.perf_counter()
        assert res.status_code == 200
        latencies.append((t1 - t0) * 1000.0)

    return compute_metrics(latencies, "Instant Live Pricing Quote")


async def benchmark_order_creation(client: AsyncClient, n_requests: int = 50) -> Dict[str, Any]:
    latencies: List[float] = []
    headers = {"X-Tenant-ID": "tenant-benchmark"}

    for i in range(n_requests):
        payload = {
            "file_name": f"benchmark_doc_{i}.pdf",
            "file_size_bytes": 1024000,
            "page_count": 15,
            "options": {
                "copies": 1,
                "color_mode": "bw",
                "paper_size": "A4",
                "duplex_mode": "simplex",
                "orientation": "portrait",
                "binding": "none",
                "paper_gsm": 75,
            },
            "customer_email": f"bench_{i}@customer.com"
        }
        idem_key = f"idem_bench_{i}_{time.time()}"
        req_headers = {**headers, "Idempotency-Key": idem_key}

        t0 = time.perf_counter()
        res = await client.post("/api/v1/orders", json=payload, headers=req_headers)
        t1 = time.perf_counter()
        assert res.status_code == 201
        latencies.append((t1 - t0) * 1000.0)

    return compute_metrics(latencies, "Idempotent Order Creation")


async def benchmark_signed_webhooks(client: AsyncClient, n_requests: int = 50) -> Dict[str, Any]:
    latencies: List[float] = []

    for i in range(n_requests):
        ts = int(time.time())
        payload = {
            "event_id": f"evt_bench_{i}_{time.time()}",
            "event_type": "payment_intent.succeeded",
            "tenant_id": "tenant-benchmark",
            "payment_intent_id": f"pi_bench_{i}",
            "amount_cents": 250,
            "currency": "USD",
            "timestamp": ts,
        }
        raw_body = json.dumps(payload, sort_keys=True).encode("utf-8")
        secret_key = settings.WEBHOOK_SIGNING_SECRET.encode("utf-8")
        payload_to_sign = f"{ts}.".encode("utf-8") + raw_body
        sig = hmac.new(secret_key, payload_to_sign, hashlib.sha256).hexdigest()

        headers = {
            "Content-Type": "application/json",
            "X-Signature": sig,
            "X-Timestamp": str(ts),
        }

        t0 = time.perf_counter()
        res = await client.post("/api/v1/webhooks/payments", content=raw_body, headers=headers)
        t1 = time.perf_counter()
        assert res.status_code == 200
        latencies.append((t1 - t0) * 1000.0)

    return compute_metrics(latencies, "Signed HMAC Webhook Verification")


async def run_all_benchmarks():
    print("=" * 75)
    print("XEROX SAAS CLOUD PLATFORM - LATENCY & THROUGHPUT BENCHMARK")
    print("=" * 75)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        start_overall = time.perf_counter()

        quote_metrics = await benchmark_pricing_quotes(client, 100)
        order_metrics = await benchmark_order_creation(client, 50)
        webhook_metrics = await benchmark_signed_webhooks(client, 50)

        total_elapsed = time.perf_counter() - start_overall
        total_requests = 100 + 50 + 50
        overall_rps = total_requests / total_elapsed

    results = [quote_metrics, order_metrics, webhook_metrics]

    print(f"\nTotal Requests Executed: {total_requests}")
    print(f"Total Benchmark Duration: {total_elapsed:.3f} s")
    print(f"Sustained Throughput: {overall_rps:.1f} req/sec\n")

    print(f"{'Operation':<35} | {'Min (ms)':<8} | {'p50 (ms)':<8} | {'p95 (ms)':<8} | {'p99 (ms)':<8} | {'Max (ms)':<8}")
    print("-" * 88)
    for r in results:
        print(f"{r['operation']:<35} | {r['min_ms']:<8} | {r['p50_ms']:<8} | {r['p95_ms']:<8} | {r['p99_ms']:<8} | {r['max_ms']:<8}")
    print("=" * 75)


if __name__ == "__main__":
    asyncio.run(run_all_benchmarks())
