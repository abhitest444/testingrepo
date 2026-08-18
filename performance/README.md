# Performance (k6)

![k6](https://img.shields.io/badge/k6-0.54-7A0099)
![Docker](https://img.shields.io/badge/Docker-optional-blue)

Load and capacity checks for the portfolio — complements functional API tests in `api-framework`.

| Layer | Project | Question |
| --- | --- | --- |
| Correctness | `api-framework` | Does the API return the right shape/status? |
| Capacity | **this project** | Does it stay fast/reliable under traffic? |

## Requirements

| Requirement | Version | Notes |
| --- | --- | --- |
| Node.js | ≥ 20 | for npm scripts |
| k6 | ≥ 0.54 | or use Docker |
| Docker | ≥ 20 | optional — `npm run demo:docker` |

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

### Sample output

<details>
<summary>npm run smoke</summary>

```
          /\      |‾‾| /‾‾/  /‾‾/
     /\  /  \     |  |/  /  /  /
    /  \/    \    |     (  /  ‾‾\
   /          \   |  |\  \ |  (‾)  |
  / __________ \ |__| \__\ \_____/ .io

  execution: local
     script: scenarios/smoke.js
     output: stdout

  scenarios:
    (100.00%) 1 scenario, 2 max VUs, 30s max duration (including graceful stop):

    ✓ default: Up to 2 looping users for 20s

     data_received...........: 48 kB  2.4 kB/s
     data_sent...............: 12 kB  598 B/s
     http_req_blocked........: avg=1.2ms     min=0s       med=0s       max=15ms     p(90)=0s       p(95)=0s
     http_req_duration.......: avg=85ms      min=42ms     med=78ms     max=210ms    p(90)=120ms    p(95)=145ms
     http_req_failed.........: 0.00%  ✓ 0    ✗ 0
     http_reqs...............: 60     3.0/s

     ✓ http_req_duration p95 < 500ms
     ✓ http_req_failed < 5%

  ✓ checks.......................: 100.00%  ✓ 2    ✗ 0
  ✓ iteration_duration...........: avg=2.1s
  ✓ vus_max......................: 2

  running (20.0s), 0/2 VUs, 60 complete and 0 interrupted iterations
```

</details>

<details>
<summary>npm run load</summary>

```
  scenarios:
    (100.00%) 1 scenario, 10 max VUs, 1m30s max duration:

    ✓ default: Up to 10 looping users for 1m30s (ramping up/down)

     data_received...........: 2.4 MB 27 kB/s
     http_req_duration.......: avg=95ms   min=38ms   med=82ms   max=450ms   p(90)=155ms  p(95)=195ms
     http_req_failed.........: 0.50%  ✓ 149  ✗ 1
     http_reqs...............: 1500   16.7/s

     ✓ http_req_duration p95 < 500ms
     ✗ http_req_failed < 1% .............................................................. ✗ (1 failure)

  ✓ checks.......................: 99.33%  ✓ 3    ✗ 1
```

</details>

<details>
<summary>npm run demo (smoke + load combined)</summary>

```
# Runs smoke first, then load sequentially
# See individual outputs above for each scenario
✅ Demo complete — smoke passed, load passed with SLA thresholds
```

</details>

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

## Troubleshooting

<details>
<summary>k6 not found</summary>

```bash
# Option A: install k6
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Option B: use Docker
npm run demo:docker
```
</details>

<details>
<summary>Docker permission denied</summary>

```bash
# Add your user to the docker group (then re-login)
sudo usermod -aG docker $USER

# Or run with sudo (less ideal)
sudo npm run demo:docker
```
</details>

<details>
<summary>Thresholds failing on public APIs</summary>

- Public APIs (QuickPizza, Heroku) have variable latency — thresholds may be tight
- Adjust via env: `LOAD_THRESHOLD_P95=1000 npm run load`
- Or loosen thresholds in `lib/config.js` for demo runs
- Consider targeting staging you own for reliable CI
</details>

<details>
<summary>booking scenario returns 421 or errors</summary>

- Restful Booker on Heroku has a cold start — first request may fail
- The script retries internally, but if persistent, wait 30s and retry
- Check `BOOKING_URL` override if targeting a different instance
</details>

## Related

- API correctness: [`../api-framework`](../api-framework)
- Strategy notes: [`docs/test-strategy.md`](./docs/test-strategy.md)
