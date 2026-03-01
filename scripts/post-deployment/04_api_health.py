import time
import sys
import argparse
import httpx
from typing import List

# Thresholds
LATENCY_WARNING_MS = 300
LATENCY_CRITICAL_MS = 800

DEFAULT_ENDPOINTS = [
    "https://app.questerix.com/",
    # Extensible architecture: Supabase Edge Functions / Auth endpoints could be appended here
]

def check_endpoints(endpoints: List[str]) -> bool:
    success = True
    print(f"Starting API Health & Latency Scan across {len(endpoints)} endpoints...\n")
    
    with httpx.Client(timeout=10.0) as client:
        for url in endpoints:
            print(f"Checking: {url}")
            try:
                start_time = time.perf_counter()
                response = client.get(url)
                end_time = time.perf_counter()
                
                latency_ms = (end_time - start_time) * 1000
                status_code = response.status_code
                
                print(f"  Status: {status_code} {response.reason_phrase}")
                print(f"  Latency: {latency_ms:.2f} ms")
                
                if status_code != 200:
                    print(f"  [ERROR] Expected 200 OK, got {status_code}")
                    success = False
                
                if latency_ms >= LATENCY_CRITICAL_MS:
                    print(f"  [CRITICAL] Latency exceeded critical threshold ({LATENCY_CRITICAL_MS}ms)!")
                    success = False
                elif latency_ms >= LATENCY_WARNING_MS:
                    print(f"  [WARNING] Latency elevated over warning threshold ({LATENCY_WARNING_MS}ms).")
                    
            except httpx.RequestError as exc:
                print(f"  [ERROR] Request failed: {exc}")
                success = False
            print("-" * 40)
            
    if not success:
        print("\n[FAIL] Health check completed with errors or latency spikes.")
    else:
        print("\n[PASS] All endpoints healthy and within latency limits.")
        
    return success

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="API Health & Latency Scanner")
    parser.add_argument("--urls", nargs="+", default=DEFAULT_ENDPOINTS, help="List of URLs to check")
    args = parser.parse_args()
    
    sys.exit(0 if check_endpoints(args.urls) else 1)
