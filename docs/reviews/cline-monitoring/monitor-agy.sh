#!/usr/bin/env bash
#
# MindMosaic — AGY Workspace Design Completion Monitor
#
# Checks AGY's feat/workspace-design-completion-r1 branch every 20 minutes.
# READ-ONLY: never modifies AGY's worktree or branch.
#
# Usage:
#   ./monitor-agy.sh              # single check (append to log)
#   ./monitor-agy.sh --loop       # loop every 20 minutes (Ctrl-C to stop)
#
# Environment assumptions:
#   - Git worktree for AGY branch exists at AGY_WORKTREE (default C:/tmp/wt-workspace-design-r1)
#   - Main repo checkout at REPO_ROOT (default current directory)
#
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$(pwd)}"
AGY_WORKTREE="${AGY_WORKTREE:-C:/tmp/wt-workspace-design-r1}"
AGY_BRANCH="feat/workspace-design-completion-r1"
LOG_DIR="${REPO_ROOT}/docs/reviews/cline-monitoring"
MONITOR_LOG="${LOG_DIR}/MONITORING-LOG.md"
CHECK_LOG="${LOG_DIR}/checks.jsonl"

mkdir -p "${LOG_DIR}"

now_iso() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

now_local() {
  date +"%Y-%m-%d %H:%M:%S"
}

record_check() {
  local status="$1"   # still-working | completed | blocked | error
  local detail="$2"
  local ts
  ts=$(now_local)
  {
    echo "---"
    echo "## Monitoring Entry — ${ts} UTC"
    echo ""
    echo "| Field | Value |"
    echo "|---|---|"
    echo "| Check time | ${ts} |"
    echo "| AGY branch | ${AGY_BRANCH} |"
    echo "| Status | ${status} |"
    echo "| Detail | ${detail} |"
    echo ""
  } >> "${MONITOR_LOG}"

  # Also append a machine-readable line
  local sha ts_iso
  sha="n/a"
  if git -C "${AGY_WORKTREE}" rev-parse --verify "${AGY_BRANCH}" >/dev/null 2>&1; then
    sha=$(git -C "${AGY_WORKTREE}" rev-parse "${AGY_BRANCH}")
  fi
  ts_iso=$(now_iso)
  printf '%s|%s|%s|%s|%s\n' "${ts_iso}" "${AGY_BRANCH}" "${sha}" "${status}" "${detail}" >> "${CHECK_LOG}"
}

get_agy_info() {
  if ! git -C "${AGY_WORKTREE}" rev-parse --verify "${AGY_BRANCH}" >/dev/null 2>&1; then
    echo "ERROR: AGY branch ${AGY_BRANCH} not found in worktree ${AGY_WORKTREE}"
    return 1
  fi
  local sha ts msg clean untracked
  sha=$(git -C "${AGY_WORKTREE}" rev-parse "${AGY_BRANCH}")
  ts=$(git -C "${AGY_WORKTREE}" log -1 --format='%ci')
  msg=$(git -C "${AGY_WORKTREE}" log -1 --format='%s')
  ahead=$(git -C "${AGY_WORKTREE}" rev-list --count dev.."${AGY_BRANCH}" 2>/dev/null || echo "n/a")
  clean=$(git -C "${AGY_WORKTREE}" status --porcelain | wc -l | tr -d ' ')
  echo "sha=${sha}|ts=${ts}|msg=${msg}|ahead=${ahead}|dirty_files=${clean}"
}

check_completion_artifacts() {
  local missing=()
  for f in PROGRESS.md HANDOFF.md DEFECTS.md TEST-RESULTS.md DESIGN-MATRIX.md; do
    if [ ! -f "${AGY_WORKTREE}/docs/reviews/workspace-r1/${f}" ]; then
      missing+=("${f}")
    fi
  done
  if [ ${#missing[@]} -gt 0 ]; then
    echo "MISSING: ${missing[*]}"
    return 1
  fi
  echo "ALL_PRESENT"
  return 0
}

run_single_check() {
  local ts
  ts=$(now_iso)
  echo "[$(now_local)] AGY monitor check — branch ${AGY_BRANCH}"

  if ! info=$(get_agy_info); then
    record_check "error" "${info}"
    echo "ERROR: ${info}"
    return 1
  fi

  echo "  SHA: $(echo "${info}" | cut -d'|' -f1 | cut -d'=' -f2)"
  echo "  Commit: $(echo "${info}" | cut -d'|' -f3 | cut -d'=' -f2)"
  echo "  Ahead of dev: $(echo "${info}" | cut -d'|' -f4 | cut -d'=' -f2) commits"
  echo "  Dirty files: $(echo "${info}" | cut -d'|' -f5 | cut -d'=' -f2)"

  if artifact_status=$(check_completion_artifacts); then
    record_check "completed" "${artifact_status}"
    echo "  Completion: ALL required artifacts present — AGY has declared completion."
    return 0
  else
    record_check "still-working" "${artifact_status}"
    echo "  Completion: NOT declared — missing artifacts: ${artifact_status}"
    echo "  Remaining in read-only monitoring mode."
    return 0
  fi
}

if [ "${1:-}" = "--loop" ]; then
  echo "Starting AGY monitoring loop (20-minute interval). Press Ctrl-C to stop."
  while true; do
    run_single_check || true
    echo "Next check in 20 minutes..."
    sleep 1200
  done
else
  run_single_check || true
fi
