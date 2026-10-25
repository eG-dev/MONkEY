import os
import sys
from pathlib import Path
from supervisor import childutils

while True:
    headers, payload = childutils.listener.wait(sys.stdin, sys.stdout)
    event = childutils.get_headers(payload.splitlines()[0])
    childutils.listener.ok(sys.stdout)
    if event.get("processname") in {"backend", "web"}:
        Path("/tmp/pocket-monkey-process-failed").touch()
        print('{"level":"Error","event":"application_process_failed"}', file=sys.stderr, flush=True)
        childutils.getRPCInterface(os.environ).supervisor.shutdown()