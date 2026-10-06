#!/usr/bin/env python3
"""Check the vendored jQuery and every sample reference without network access."""
from __future__ import annotations

import base64
import hashlib
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SAMPLES = ROOT / "smartphonegame"
VENDOR = SAMPLES / "vendor/jquery-3.7.1.min.js"
SHA256_BASE64 = "/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo="
SCRIPT_SRC = re.compile(rb"<script\b[^>]*\bsrc\s*=\s*['\"]([^'\"]+)['\"]", re.I)
OLD_REFERENCE = re.compile(rb"jquery(?:[-/])(?:[12]\.\d+(?:\.\d+)?|3\.[0-4]\.\d+)(?:[/.-])", re.I)


def check() -> list[Path]:
    errors: list[str] = []
    if not VENDOR.is_file():
        errors.append(f"Missing approved library: {VENDOR.relative_to(ROOT)}")
    else:
        digest = base64.b64encode(hashlib.sha256(VENDOR.read_bytes()).digest()).decode()
        if digest != SHA256_BASE64:
            errors.append("Vendored library differs from the approved jQuery 3.7.1 release")
    libraries = sorted(SAMPLES.rglob("jquery*.js"))
    if libraries != [VENDOR]:
        errors.append("Expected exactly one vendored jQuery library; found: " + ", ".join(str(p.relative_to(ROOT)) for p in libraries))
    if not (SAMPLES / "vendor/jquery-LICENSE.txt").is_file():
        errors.append("Missing upstream jQuery license")
    pages: list[Path] = []
    for path in sorted(SAMPLES.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in {".html", ".js", ".appcache", ".json"}:
            continue
        data = path.read_bytes()  # Some historical examples are Shift-JIS; never transcode them.
        if path != VENDOR and OLD_REFERENCE.search(data):
            errors.append(f"Legacy jQuery reference: {path.relative_to(ROOT)}")
        if path.suffix.lower() != ".html":
            continue
        references = [s.decode("ascii") for s in SCRIPT_SRC.findall(data) if b"jquery" in s.lower()]
        if references:
            pages.append(path)
            if len(references) != 1:
                errors.append(f"Duplicate jQuery script tags: {path.relative_to(ROOT)}")
        for src in references:
            if ":" in src or src.startswith("/") or (path.parent / src).resolve() != VENDOR:
                errors.append(f"Non-local or incorrect jQuery path: {path.relative_to(ROOT)} -> {src}")
            elif not (path.parent / src).is_file():
                errors.append(f"Broken jQuery path: {path.relative_to(ROOT)} -> {src}")
    if len(pages) != 14:
        errors.append(f"Expected 14 existing jQuery examples, found {len(pages)}; review intentional additions/removals")
    manifest = SAMPLES / "ch5/1-appcahce/takarabako-game.appcache"
    entries = [line.strip() for line in manifest.read_text(encoding="ascii").splitlines() if line.strip() and not line.startswith("#") and line != "CACHE MANIFEST"]
    if "../../vendor/jquery-3.7.1.min.js" not in entries:
        errors.append("Treasure-game cache does not include the shared library")
    for entry in entries:
        if not (manifest.parent / entry).is_file():
            errors.append(f"Broken treasure-game cache entry: {entry}")
    if "# Version.1.000" in manifest.read_text(encoding="ascii"):
        errors.append("Treasure-game cache revision has not been bumped")
    if errors:
        raise AssertionError("\n".join(errors))
    print(f"PASS: {len(pages)} HTML references; one verified jQuery 3.7.1 library; all treasure-game cache entries resolve")
    return pages


if __name__ == "__main__":
    try:
        check()
    except (AssertionError, OSError, UnicodeError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        sys.exit(1)
