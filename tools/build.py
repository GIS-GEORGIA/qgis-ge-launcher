"""Package the extension into dist/qgis-ge-launcher-<version>.zip.

That ZIP is exactly what you upload to the Chrome Web Store, the Microsoft Edge
Add-ons dashboard, or the Opera add-ons site. It is also what you unzip to load
via chrome://extensions -> "Load unpacked".

Usage:  python tools/build.py [--check]
        --check  validate only, write nothing
"""
from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

# Everything the packaged extension needs, and nothing else.
INCLUDE_FILES = ["manifest.json", "LICENSE"]
INCLUDE_DIRS = ["src", "icons", "_locales"]
SKIP_SUFFIXES = {".map"}


def collect() -> list[pathlib.Path]:
    files: list[pathlib.Path] = []
    for name in INCLUDE_FILES:
        p = ROOT / name
        if p.exists():
            files.append(p)
    for name in INCLUDE_DIRS:
        for p in sorted((ROOT / name).rglob("*")):
            if p.is_file() and p.suffix not in SKIP_SUFFIXES:
                files.append(p)
    return files


def check_no_private_links() -> list[str]:
    """Refuse to package a personal link that leaked back into the defaults.

    private/never-publish.txt holds one URL per line (see private/README.md).
    It lives in the git-ignored private/ folder and is never packaged, so a
    fresh clone simply skips this check. It is deliberately a separate file
    from private/links.json, which gets overwritten whenever the user exports
    their list again from the options page.
    """
    blocklist = ROOT / "private" / "never-publish.txt"
    if not blocklist.is_file():
        return []

    banned = [
        line.strip()
        for line in blocklist.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    ]
    defaults = (ROOT / "src" / "defaults.js").read_text(encoding="utf-8")
    shipped = set(re.findall(r"'(https?://[^']+)'", defaults))

    return [
        f"private link present in src/defaults.js: {url}"
        for url in sorted(set(banned) & shipped)
    ]


def validate(files: list[pathlib.Path]) -> list[str]:
    errors: list[str] = []
    manifest_path = ROOT / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    if manifest.get("manifest_version") != 3:
        errors.append("manifest_version must be 3")

    # Every icon and page the manifest points at must be in the package.
    packaged = {p.relative_to(ROOT).as_posix() for p in files}
    referenced = set(manifest.get("icons", {}).values())
    referenced |= set(manifest.get("action", {}).get("default_icon", {}).values())
    referenced.add(manifest.get("action", {}).get("default_popup", ""))
    referenced.add(manifest.get("options_ui", {}).get("page", ""))
    for ref in sorted(r for r in referenced if r):
        if ref not in packaged:
            errors.append(f"manifest references missing file: {ref}")

    # Every __MSG_x__ placeholder needs an entry in every locale.
    keys = {
        v[6:-2]
        for v in (
            manifest.get("name", ""),
            manifest.get("description", ""),
            manifest.get("action", {}).get("default_title", ""),
            manifest.get("commands", {}).get("_execute_action", {}).get("description", ""),
        )
        if v.startswith("__MSG_")
    }
    for locale_dir in sorted((ROOT / "_locales").iterdir()):
        msgs = json.loads((locale_dir / "messages.json").read_text(encoding="utf-8"))
        for key in sorted(keys):
            if key not in msgs:
                errors.append(f"_locales/{locale_dir.name}: missing message '{key}'")

    default_locale = manifest.get("default_locale")
    if default_locale and not (ROOT / "_locales" / default_locale).is_dir():
        errors.append(f"default_locale '{default_locale}' has no _locales folder")

    errors += check_no_private_links()

    # Inline scripts and event handlers are blocked by the MV3 content security
    # policy, and would fail silently at runtime rather than at package time.
    inline_handler = re.compile(r"<[^>]*\son[a-z]+\s*=", re.I)
    for page in sorted((ROOT / "src").glob("*.html")):
        text = page.read_text(encoding="utf-8")
        if re.search(r"<script(?![^>]*\ssrc=)", text, re.I):
            errors.append(f"src/{page.name}: inline <script> is blocked by the MV3 CSP")
        if inline_handler.search(text):
            errors.append(f"src/{page.name}: inline event handler is blocked by the MV3 CSP")
        if "javascript:" in text:
            errors.append(f"src/{page.name}: javascript: URL is blocked by the MV3 CSP")

    return errors


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="validate only")
    args = ap.parse_args()

    files = collect()
    errors = validate(files)
    if errors:
        for e in errors:
            print(f"error: {e}", file=sys.stderr)
        return 1

    version = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))["version"]
    print(f"validated {len(files)} files, version {version}")
    if args.check:
        return 0

    DIST.mkdir(parents=True, exist_ok=True)
    out = DIST / f"qgis-ge-launcher-{version}.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p in files:
            z.write(p, p.relative_to(ROOT).as_posix())
    print(f"wrote {out.relative_to(ROOT)} ({out.stat().st_size / 1024:.1f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
