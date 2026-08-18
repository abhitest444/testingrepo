#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
#  QA Portfolio — Lint All
#
#  Runs TypeScript typecheck across all projects.
#  Usage: npm run lint
# ─────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FAILURES=0

lint_project() {
  local dir="$1"
  if [ -d "$ROOT_DIR/$dir" ] && [ -f "$ROOT_DIR/$dir/package.json" ]; then
    echo -e "🔍 Linting $dir/..."
    if (cd "$ROOT_DIR/$dir" && npm run lint --silent 2>&1); then
      echo -e "${GREEN}✅ $dir — passed${NC}"
    else
      echo -e "${RED}❌ $dir — failed${NC}"
      FAILURES=$((FAILURES + 1))
    fi
    echo ""
  fi
}

echo "🔍 Running typecheck across all projects..."
echo ""

lint_project "playwright-e2e"
lint_project "api-framework"
lint_project "ui-scout"

if [ $FAILURES -gt 0 ]; then
  echo -e "${RED}❌ $FAILURES project(s) failed typecheck${NC}"
  exit 1
else
  echo -e "${GREEN}✅ All projects passed typecheck${NC}"
fi
