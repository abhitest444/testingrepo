#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
#  QA Portfolio — Full Demo Tour
#
#  Usage:
#    npm run demo          # run everything
#    npm run demo:quick    # smoke only (fastest proof)
#    bash scripts/demo.sh  # same as npm run demo
# ─────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
QUICK_ONLY="${1:-}"

banner() {
  echo ""
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}${BOLD}  $1${NC}"
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

run_or_skip() {
  local dir="$1" label="$2" cmd="$3"
  if [ -d "$ROOT_DIR/$dir" ]; then
    banner "$label"
    (cd "$ROOT_DIR/$dir" && eval "$cmd")
  else
    echo -e "${RED}⚠ $dir/ not found — skipping${NC}"
  fi
}

echo -e "${BOLD}🚀 QA Portfolio — Demo Tour${NC}"
echo -e "   Running smoke tests across all projects..."
echo ""

# ─── 1. Playwright E2E (smoke) ──────────────────────────────
run_or_skip "playwright-e2e" \
  "1/4 — Playwright E2E (smoke:portfolio)" \
  "npm run test:smoke:portfolio"

# ─── 2. API Framework (smoke) ──────────────────────────────
run_or_skip "api-framework" \
  "2/4 — API Framework (Zod contracts + auth matrix)" \
  "npm run test:smoke"

# ─── 3. UI Scout (demo crawl) ──────────────────────────────
run_or_skip "ui-scout" \
  "3/4 — UI Scout (exploratory crawl)" \
  "npm run scout:demo"

# ─── 4. Performance (smoke) ──────────────────────────────
run_or_skip "performance" \
  "4/4 — Performance (k6 smoke)" \
  "npm run smoke"

# ─── Summary ─────────────────────────────────────────────────
echo ""
banner "✅ Demo complete"
echo -e "   ${GREEN}Playwright:${NC}  auth → cart → checkout → mock → API smoke"
echo -e "   ${GREEN}API:${NC}         contract schemas + auth matrix"
echo -e "   ${GREEN}UI Scout:${NC}    crawl + find issues across pages"
echo -e "   ${GREEN}Performance:${NC} smoke pass/fail with thresholds"
echo ""
echo -e "   ${BOLD}Next steps:${NC}"
echo -e "   npm run demo:quick          — just Playwright smoke (fastest)"
echo -e "   cd playwright-e2e && npm run test:chromium  — full browser portfolio"
echo -e "   cd performance && npm run load             — ramp up load test"
echo -e "   cd ui-scout && npm run scout:ui            — open Scout dashboard"
echo ""

if [ "$QUICK_ONLY" == "--quick" ]; then
  banner "⚡ Quick mode — only Playwright smoke ran"
fi
