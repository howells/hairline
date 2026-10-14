#!/bin/bash
# Screenshot a route of the dev app. Uses a tall viewport, NOT --full:
# full-page capture restarts CSS animations and catches charts mid-reveal.
# usage: shot.sh <session> <hash-route> <out.png> [width=1440] [height=1400] [wait-ms=3000]
S=$1; R=$2; O=$3; W=${4:-1440}; H=${5:-1400}; T=${6:-3000}
agent-browser --session $S set viewport $W $H 2 >/dev/null
agent-browser --session $S open "about:blank" >/dev/null
agent-browser --session $S open "http://localhost:5199/#/$R" >/dev/null
agent-browser --session $S wait $T >/dev/null
# If the app failed to mount (e.g. mid-edit import errors), wait and reload, up to 5 times.
for attempt in 1 2 3 4 5; do
  N=$(agent-browser --session $S eval 'document.querySelectorAll("#root *").length' 2>/dev/null | tr -dc 0-9)
  [ "${N:-0}" -gt 5 ] && break
  sleep 4
  agent-browser --session $S eval 'location.reload()' >/dev/null
  agent-browser --session $S wait $T >/dev/null
done
agent-browser --session $S screenshot $O >/dev/null
agent-browser --session $S errors 2>&1 | grep -v "^$" | tail -5
