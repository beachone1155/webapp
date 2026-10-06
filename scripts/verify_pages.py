#!/usr/bin/env python3
"""Verify a master deployment, not merely its source tree. Uses read-only requests."""
from __future__ import annotations

import json
import os
from pathlib import Path
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from check_jquery import ROOT, VENDOR, check

API = "https://api.github.com/repos/beachone1155/webapp/pages/builds/latest"
PUBLIC = "https://beachone1155.github.io/webapp/"


def get(url: str, *, authenticated: bool = False) -> tuple[int, bytes]:
    headers = {"User-Agent": "webapp-jquery-security-check", "Cache-Control": "no-cache"}
    if authenticated:
        token = os.environ.get("GH_TOKEN")
        if not token:
            raise RuntimeError("GH_TOKEN with Pages read permission is required")
        headers.update({"Authorization": "Bearer " + token, "Accept": "application/vnd.github+json"})
    try:
        with urlopen(Request(url, headers=headers), timeout=15) as response:
            return response.status, response.read()
    except HTTPError as exc:
        return exc.code, exc.read()


def main() -> None:
    expected = os.environ.get("GITHUB_SHA")
    if not expected:
        raise RuntimeError("Set GITHUB_SHA to the master commit to verify")
    pages = check()
    assets: list[Path] = pages + [VENDOR, ROOT / "smartphonegame/ch5/1-appcahce/takarabako-game.appcache"]
    deleted = [f"smartphonegame/ch5/1-appcahce/jquery-{v}.min.js" for v in ("1.7.2", "1.8.2")]
    deadline = time.monotonic() + 300
    pending: list[str] = []
    while time.monotonic() < deadline:
        pending = []
        try:
            status, body = get(API, authenticated=True)
            if status != 200:
                raise RuntimeError(f"Pages build API returned HTTP {status}")
            build = json.loads(body)
            if build.get("commit") != expected or build.get("status") != "built":
                pending.append(f"Pages build: commit={build.get('commit')} status={build.get('status')}")
            else:
                for path in assets:
                    relative = path.relative_to(ROOT).as_posix()
                    status, body = get(PUBLIC + relative)
                    if status != 200 or body != path.read_bytes():
                        pending.append(f"Not yet matching deployed bytes: {relative} (HTTP {status})")
                for relative in deleted:
                    status, _ = get(PUBLIC + relative)
                    if status != 404:
                        pending.append(f"Old asset still served: {relative} (HTTP {status})")
                if not pending:
                    print(f"PASS: GitHub Pages built commit {expected}", flush=True)
                    print(f"PASS: {len(pages)} published HTML files, jQuery library and cache manifest match the tested commit byte-for-byte", flush=True)
                    for relative in deleted:
                        print(f"PASS: HTTP 404 {PUBLIC}{relative}", flush=True)
                    return
        except (URLError, TimeoutError) as exc:
            pending.append(f"Transient network error: {exc}")
        print("PENDING: " + "; ".join(pending), flush=True)
        time.sleep(10)
    raise RuntimeError("Deployment verification timed out: " + "; ".join(pending))


if __name__ == "__main__":
    main()
