# Performance test strategy (k6)

## Goals

Prove that critical HTTP paths stay within agreed latency and error budgets under controlled traffic. This does **not** replace functional API tests — it answers a different question.

## Suite split

| Scenario | Intent | Default profile | Gate |
| --- | --- | --- | --- |
| `smoke` | Freshness / health | 2 VUs × ~20s | Tight: fail rate &lt;2%, p95 &lt;800ms |
| `load` | Release confidence | Ramp to ~15 VUs | Fail rate &lt;5%, p95 &lt;1.2s, checks &gt;95% |
| `stress` | Find breaking point | Peak ~40 VUs | Looser: fail &lt;15%, p95 &lt;3s |
| `booking-lifecycle` | Realistic write+read | ~3 VUs on Restful Booker | Fail &lt;10%, p95 &lt;2s |

## Risk model

| Risk | How we catch it |
| --- | --- |
| Latency regression | p95 / p99 thresholds |
| Error spikes under concurrency | `http_req_failed` rate |
| Broken happy-path under load | `check()` assertions on status/body |
| Shared-env overload | Low default VUs + documented env overrides |

## CI quality gates

- PR / push: run **smoke** (fast signal)
- Optional / nightly: **load** (longer, still polite to public APIs)
- **Stress** and high VU booking runs stay manual / private-target only

## What we deliberately skip here

- Full browser-at-scale (not how capacity is measured)
- Soak tests lasting hours (add when you have a dedicated staging env)
- Protocol packs beyond HTTP (out of portfolio scope)

## Mapping to the rest of the portfolio

```text
UI e2e (Playwright)     → does the product work for a user?
UI Scout                → what did we forget to script?
API framework           → is the contract/auth correct?
k6 (this project)       → does it hold up when traffic rises?
```
