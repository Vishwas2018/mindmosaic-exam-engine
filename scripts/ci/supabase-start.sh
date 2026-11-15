#!/usr/bin/env bash
# Starts the local Supabase stack on a GitHub-hosted runner without the intermittent
#   "failed to bind host port 0.0.0.0:56322/tcp: address already in use"
# seen on PR #124 (run 43595025208, rls and e2e-auth both).
#
# Cause: supabase/config.toml publishes 56320-56329, which lies inside Linux's default ephemeral range
# (net.ipv4.ip_local_port_range = 32768 60999). Any outbound connection made earlier in the job (npm ci, apt,
# Docker image pulls) can be handed one of those ports as its source port, and Docker then cannot publish it.
#
# Fix: tell the kernel never to hand out 56320-56329 as ephemeral ports (ip_local_reserved_ports). That does not
# evict a socket that already holds a port, so if the start still fails the script prints who holds the ports,
# waits for short-lived connections to close, tears the half-started stack down and tries again.
set -euo pipefail

PORTS="56320-56329"
ATTEMPTS="${SUPABASE_START_ATTEMPTS:-3}"

reserve() {
  if [ "$(id -u)" -eq 0 ]; then
    sysctl -w "net.ipv4.ip_local_reserved_ports=${PORTS}" >/dev/null
  else
    sudo sysctl -w "net.ipv4.ip_local_reserved_ports=${PORTS}" >/dev/null
  fi
  echo "Reserved ports: $(cat /proc/sys/net/ipv4/ip_local_reserved_ports)"
}

holders() {
  echo "--- sockets on ${PORTS} ---"
  (sudo ss -Htanp 2>/dev/null || ss -Htan) | grep -E ':5632[0-9]\b' || echo "(none)"
}

if [ "${1:-}" = "--reserve-only" ]; then
  reserve
  exit 0
fi

reserve
for attempt in $(seq 1 "$ATTEMPTS"); do
  if supabase start; then
    exit 0
  fi
  echo "::warning::supabase start failed (attempt ${attempt}/${ATTEMPTS})"
  holders
  supabase stop --no-backup || true
  sleep $((attempt * 10))
done
echo "::error::supabase start failed after ${ATTEMPTS} attempts"
holders
exit 1
