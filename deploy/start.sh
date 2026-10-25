#!/bin/sh
set -eu
umask 077
rm -f /tmp/pocket-monkey-process-failed
/usr/bin/supervisord -n -c /app/supervisord.conf &
manager=$!
trap 'kill -TERM "$manager" 2>/dev/null || true' TERM INT
status=0
while kill -0 "$manager" 2>/dev/null; do
    status=0
    wait "$manager" || status=$?
done
if [ -f /tmp/pocket-monkey-process-failed ]; then
    exit 1
fi
exit "$status"