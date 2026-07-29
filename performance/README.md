# Performance (k6)

Load and capacity checks for the portfolio — complements functional API tests in `api-framework`.

| Layer | Project | Question |
| --- | --- | --- |
| Correctness | `api-framework` | Does the API return the right shape/status? |
| Capacity | **this project** | Does it stay fast/reliable under traffic? |

## What this shows

- **Smoke** — tiny VU count, tight thresholds (is it healthy?)
- **Load** — ramp stages + p95/p99 SLAs (is it acceptable under moderate load?)
- **Stress** — higher peak, looser thresholds (where does it struggle?)
- **Booking lifecycle** — create + get against Restful Booker (same API as `api-framework`, low VUs)
- **Thresholds as quality gates** — CI fails when error rate / latency budgets break
- **Think time** — not a perfect hammer; closer to real user pacing

## Targets

| Scenario | Default target | Why |
| --- | --- | --- |
| smoke / load / stress | `https://quickpizza.grafana.com` | Official Grafana/k6 demo app (replaces retired test-api.k6.io) |
| booking | `https://restful-booker.herokuapp.com` | Ties to the portfolio API story |

Override with `BASE_URL` / `BOOKING_URL`.

## Prerequisites

Install [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) **or** use Docker (scripts include `:docker` variants).

```bash
# Linux (Debian/Ubuntu) example
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

## Quick start

```bash
cd performance

# Preferred if k6 is installed
npm run demo          # smoke + load (recruiter-friendly)

# Or via Docker (no local k6 install)
npm run demo:docker
```

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run smoke` | Health smoke (~20s, 2 VUs) |
| `npm run load` | Load ramp with SLA thresholds |
| `npm run stress` | Higher peak, looser budgets |
| `npm run booking` | Restful Booker create+get (low VUs) |
| `npm run demo` | smoke + load showcase |

Docker mirrors: `smoke:docker`, `load:docker`, `stress:docker`, `booking:docker`, `demo:docker`.

### Useful env knobs

```bash
LOAD_PEAK_VUS=20 npm run load
STRESS_PEAK_VUS=50 npm run stress
BOOKING_VUS=2 npm run booking
BASE_URL=https://test-api.k6.io npm run smoke
```

## Layout

```text
performance/
├── lib/
│   ├── config.js      # URLs, stages, shared thresholds
│   ├── http.js        # GET/POST helpers + think time
│   └── journey.js     # shared QuickPizza user journey
├── scenarios/
│   ├── smoke.js
│   ├── load.js
│   ├── stress.js
│   └── booking-lifecycle.js
└── docs/test-strategy.md
```

## How to present (60s)

1. Run `npm run demo`
2. Point at the summary: **http_req_duration p95**, **http_req_failed**, **checks**
3. Talk track:
   - Functional tests prove *correctness*; k6 proves *capacity*
   - Thresholds are the contract with stakeholders (SLA as code)
   - Smoke for PR/CI; load for release confidence; stress for finding breaking points
4. Mention booking scenario ties to the same Restful Booker used in `api-framework`

## Interview talking points

1. **Smoke ≠ load ≠ stress** — different questions, different VU profiles and thresholds.
2. **Thresholds fail the build** — performance regressions become visible like test failures.
3. **Public demos need manners** — keep VUs modest on shared APIs; raise load against staging you own.
4. **Browser load ≠ HTTP load** — thousands of users are simulated via HTTP; real browsers are for UX timing (k6 browser), not mass capacity.

## Related

- API correctness: [`../api-framework`](../api-framework)
- Strategy notes: [`docs/test-strategy.md`](./docs/test-strategy.md)
