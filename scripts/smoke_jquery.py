#!/usr/bin/env python3
"""Browser smoke tests. Requires agent-browser on PATH and an installed Chromium."""
from __future__ import annotations

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import shutil
import subprocess
import threading

from check_jquery import ROOT, check


class LocalOnlyHandler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        # Historical JSONP providers are outside this regression test. Do not call them.
        self.send_header("Content-Security-Policy", "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
        super().end_headers()

    def log_message(self, fmt: str, *args: object) -> None:
        pass


def main() -> None:
    pages = check()
    executable = shutil.which("agent-browser")
    if not executable:
        raise RuntimeError("Install agent-browser before running this test")
    chrome = os.environ.get("AGENT_BROWSER_EXECUTABLE_PATH") or shutil.which("google-chrome") or shutil.which("chromium")
    if not chrome:
        raise RuntimeError("Set AGENT_BROWSER_EXECUTABLE_PATH to a Chromium executable")
    command = [executable, "--session", "webapp-jquery-ci", "--executable-path", chrome]

    def browser(*args: str, expect: str | None = None) -> str:
        result = subprocess.run(command + list(args), text=True, capture_output=True, timeout=45)
        if result.returncode:
            raise RuntimeError(f"Browser command {args[0]} failed: {result.stdout}\n{result.stderr}")
        if expect is not None and expect not in result.stdout:
            raise AssertionError(f"Expected {expect!r}, received {result.stdout!r}")
        return result.stdout

    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(LocalOnlyHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}/"
    try:
        for page in pages:
            browser("open", base + page.relative_to(ROOT).as_posix())
            browser("eval", "(() => { if (!window.jQuery || jQuery.fn.jquery !== '3.7.1') throw Error('Wrong jQuery version'); if (document.querySelectorAll('script[src*=jquery]').length !== 1) throw Error('Duplicate script'); return 'PASS_LIBRARY'; })()", expect="PASS_LIBRARY")
            print(f"PASS library: {page.relative_to(ROOT)}", flush=True)

        browser("open", base + "smartphonegame/ch5/1-appcahce/takarabako-game.html")
        print(browser("snapshot", "-i"), flush=True)
        browser("eval", "(() => { playGame(); if (!$('#question').is(':visible')) throw Error('Question hidden'); openBox(atari); if (!$('#atari').is(':visible') || $('#question').is(':visible')) throw Error('Winning state broken'); playGame(); openBox((atari + 1) % 3); if (!$('#hazure').is(':visible')) throw Error('Losing state broken'); playGame(); if (!$('#question').is(':visible') || $('#atari').is(':visible') || $('#hazure').is(':visible')) throw Error('Retry broken'); return 'PASS_TREASURE'; })()", expect="PASS_TREASURE")
        print("PASS treasure game: initial, win, loss and retry states", flush=True)

        browser("open", base + "smartphonegame/ch3/2-jquery/jq-ajax-get.html")
        print(browser("snapshot", "-i"), flush=True)
        browser("click", "#btn")
        browser("wait", "--fn", "document.querySelector('#btn').textContent === '\u5148\u306b\u9032\u3080'")
        browser("eval", "(() => { if (document.querySelector('#msg img')) throw Error('Ajax message was not replaced'); return 'PASS_AJAX'; })()", expect="PASS_AJAX")
        print("PASS Ajax example: real click, local GET and DOM replacement", flush=True)

        browser("eval", "(() => { const payload = JSON.parse('{\"__proto__\":{\"webappPolluted\":true}}'); $.extend(true, {}, payload); if (({}).webappPolluted !== undefined) throw Error('Prototype polluted'); return 'PASS_PROTOTYPE'; })()", expect="PASS_PROTOTYPE")
        print("PASS regression: deep extend does not pollute Object.prototype", flush=True)
        print("NOTE: historic external JSONP services intentionally blocked; no claim of end-to-end compatibility for those providers", flush=True)
    finally:
        try:
            browser("close")
        finally:
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    main()
