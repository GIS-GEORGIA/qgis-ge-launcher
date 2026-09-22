"""Render the product screenshots with headless Chrome.

Serves the repo over http:// and drives Chrome across dev/shots*.html, which
frame the real popup and options pages with the example list in
dev/demo-state.json.

Usage:  python tools/make_screenshots.py [--preset store|opera|all] [--browser PATH]

  store  1280x800 into docs/img/     — Edge Add-ons (also takes 640x480), the
                                       Chrome Web Store (also takes 640x400),
                                       and the install page at docs/index.html
  opera  612x408 into store/opera/   — Opera add-ons, which asks for 612x408 on
                                       a white background (800x600 maximum)

Opera's frame is much smaller, so it shows the popup at 1:1 beside a short
caption instead of shrinking it into a backdrop, where the text would be
unreadable.
"""
from __future__ import annotations

import argparse
import functools
import http.server
import pathlib
import shutil
import socket
import subprocess
import sys
import threading

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = {
    1: "popup-light.png",
    2: "popup-dark-search.png",
    3: "options.png",
}
PRESETS = {
    "store": {"page": "dev/shots.html", "out": ROOT / "docs" / "img", "size": (1280, 800)},
    "opera": {"page": "dev/shots-opera.html", "out": ROOT / "store" / "opera", "size": (612, 408)},
}

CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]


def find_browser(explicit: str | None) -> str:
    if explicit:
        return explicit
    for name in ("google-chrome", "chromium", "chrome"):
        found = shutil.which(name)
        if found:
            return found
    for path in CANDIDATES:
        if pathlib.Path(path).is_file():
            return path
    raise SystemExit(
        "error: no Chrome or Edge binary found; pass --browser PATH"
    )


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):  # noqa: D102 - silence the request log
        pass


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--preset", choices=[*PRESETS, "all"], default="store")
    ap.add_argument("--browser", help="path to a Chrome or Edge binary")
    args = ap.parse_args()

    presets = list(PRESETS) if args.preset == "all" else [args.preset]
    browser = find_browser(args.browser)
    port = free_port()
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    failures = 0
    try:
        for preset in presets:
            cfg = PRESETS[preset]
            out, (width, height) = cfg["out"], cfg["size"]
            out.mkdir(parents=True, exist_ok=True)
            for shot, name in SHOTS.items():
                target = out / name
                url = f"http://127.0.0.1:{port}/{cfg['page']}?shot={shot}"
                cmd = [
                    browser,
                    "--headless=new",
                    "--disable-gpu",
                    "--hide-scrollbars",
                    "--force-device-scale-factor=1",
                    f"--window-size={width},{height}",
                    "--virtual-time-budget=6000",
                    f"--screenshot={target}",
                    url,
                ]
                proc = subprocess.run(cmd, capture_output=True, text=True)
                if not target.is_file():
                    print(f"error: {target.relative_to(ROOT)} was not written", file=sys.stderr)
                    print(proc.stderr.strip()[:800], file=sys.stderr)
                    failures += 1
                    continue
                print(f"wrote {target.relative_to(ROOT)} ({width}x{height})")
    finally:
        server.shutdown()

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
