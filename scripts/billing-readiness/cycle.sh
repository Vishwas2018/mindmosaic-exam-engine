#!/bin/bash
# One full billing regression cycle against the branch Preview. Usage: cycle.sh <n>
# Engines: Chromium (lifecycle, security, UI at desktop/tablet/mobile), then Firefox and WebKit (UI).
N="$1"
A=https://mindmosaic-exam-engine-git-feat-st-ec9b71-vishwas2018s-projects.vercel.app
ENVF=C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine/.env.local
L=C:/tmp/stripe-readiness/logs
cd /c/tmp/wt-stripe-billing-readiness || exit 1
echo "cycle $N commit $(git rev-parse --short=8 HEAD) start $(date -Is)" > $L/cycle$N.summary
run() { # name config-env spec-args...
  local name="$1"; shift
  node scripts/billing-readiness/run.mjs "$A" "$ENVF" "$@" > "$L/cycle$N-$name.log" 2>&1
  echo "$name exit=$?" >> $L/cycle$N.summary
}
run chromium-lifecycle -- e2e/hosted/s1-billing-lifecycle.spec.ts --workers=1
run chromium-security -- e2e/hosted/s2-billing-security.spec.ts --workers=1
run chromium-extended -- e2e/hosted/s4-billing-extended.spec.ts --workers=1
run chromium-ui -- e2e/hosted/s3-billing-ui.spec.ts --workers=1
XBROWSER=firefox run firefox-ui --config playwright.hosted.xbrowser.config.ts -- e2e/hosted/s3-billing-ui.spec.ts --workers=1
XBROWSER=webkit run webkit-ui --config playwright.hosted.xbrowser.config.ts -- e2e/hosted/s3-billing-ui.spec.ts --workers=1
echo "end $(date -Is)" >> $L/cycle$N.summary
