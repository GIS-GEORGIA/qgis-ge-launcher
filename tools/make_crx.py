"""Pack and sign a self-hosted .crx3, plus the updates.xml that feeds it.

This exists for enterprise deployment only. Chrome refuses a .crx dragged into
the browser from anywhere but the Web Store on Windows and macOS, so a signed
.crx is useful only through the ExtensionSettings / ExtensionInstallForcelist
policies — see docs/ENTERPRISE.md.

Usage:
    openssl genrsa -out private/crx-key.pem 4096      # once, keep it secret
    python tools/make_crx.py --key private/crx-key.pem \\
        --base-url https://qgis.ge/launcher/

Writes dist/qgis-ge-launcher-<version>.crx and dist/updates.xml, and prints the
extension ID derived from the key. The ID never changes as long as the key does
not, so keep the key backed up — losing it means every managed install has to
be re-pointed at a new ID.

Signing is done with the openssl CLI, so there is no Python dependency beyond
the standard library.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import struct
import subprocess
import sys
import zipfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from build import ROOT, DIST, collect, validate  # noqa: E402

CRX_MAGIC = b"Cr24"
CRX_VERSION = 3
SIGNATURE_CONTEXT = b"CRX3 SignedData\x00"


# ---------------------------------------------------------------- protobuf --

def varint(value: int) -> bytes:
    out = bytearray()
    while True:
        byte = value & 0x7F
        value >>= 7
        out.append(byte | (0x80 if value else 0))
        if not value:
            return bytes(out)


def field(number: int, payload: bytes) -> bytes:
    """One length-delimited protobuf field (wire type 2)."""
    return varint((number << 3) | 2) + varint(len(payload)) + payload


# ------------------------------------------------------------------ crypto --

def openssl(args: list[str], stdin: bytes | None = None) -> bytes:
    proc = subprocess.run(
        ["openssl", *args], input=stdin, capture_output=True, check=False,
    )
    if proc.returncode != 0:
        sys.exit(f"error: openssl {' '.join(args)} failed:\n{proc.stderr.decode(errors='replace')}")
    return proc.stdout


def public_key_der(key: pathlib.Path) -> bytes:
    return openssl(["rsa", "-in", str(key), "-pubout", "-outform", "DER"])


def sign(key: pathlib.Path, payload: bytes) -> bytes:
    return openssl(["dgst", "-sha256", "-sign", str(key)], stdin=payload)


def extension_id(pub_der: bytes) -> str:
    """Chrome's 32-character id: sha256 of the key, first 16 bytes, mapped a-p."""
    digest = hashlib.sha256(pub_der).digest()[:16]
    return "".join(chr(ord("a") + (b >> 4)) + chr(ord("a") + (b & 0xF)) for b in digest)


# ------------------------------------------------------------------- build --

def build_zip(update_url: str) -> bytes:
    """The packaged files, with update_url injected into the manifest.

    update_url must never appear in the manifest uploaded to a store — both the
    Chrome Web Store and Edge Add-ons reject it — so it is added only here.
    """
    files = collect()
    errors = validate(files)
    if errors:
        for e in errors:
            print(f"error: {e}", file=sys.stderr)
        sys.exit(1)

    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    manifest["update_url"] = update_url
    patched = json.dumps(manifest, indent=2, ensure_ascii=False).encode("utf-8")

    buffer = DIST / ".crx-payload.zip"
    DIST.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p in files:
            name = p.relative_to(ROOT).as_posix()
            if name == "manifest.json":
                z.writestr(name, patched)
            else:
                z.write(p, name)
    data = buffer.read_bytes()
    buffer.unlink()
    return data


def pack_crx(key: pathlib.Path, zip_data: bytes) -> tuple[bytes, str]:
    pub = public_key_der(key)
    crx_id = hashlib.sha256(pub).digest()[:16]

    signed_header_data = field(1, crx_id)                  # SignedData.crx_id
    payload = (
        SIGNATURE_CONTEXT
        + struct.pack("<I", len(signed_header_data))
        + signed_header_data
        + zip_data
    )
    signature = sign(key, payload)

    proof = field(1, pub) + field(2, signature)             # AsymmetricKeyProof
    header = field(2, proof) + field(10000, signed_header_data)

    crx = (
        CRX_MAGIC
        + struct.pack("<I", CRX_VERSION)
        + struct.pack("<I", len(header))
        + header
        + zip_data
    )
    return crx, extension_id(pub)


UPDATES_XML = """<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
  <app appid="{app_id}">
    <updatecheck codebase="{codebase}" version="{version}" />
  </app>
</gupdate>
"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", default="private/crx-key.pem",
                    help="RSA private key (default: private/crx-key.pem)")
    ap.add_argument("--base-url", required=True,
                    help="directory URL the .crx and updates.xml will be served from, "
                         "e.g. https://qgis.ge/launcher/")
    args = ap.parse_args()

    key = pathlib.Path(args.key)
    if not key.is_file():
        sys.exit(f"error: no key at {key}\n"
                 f"       create one with: openssl genrsa -out {key} 4096")

    base = args.base_url if args.base_url.endswith("/") else args.base_url + "/"
    version = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))["version"]
    crx_name = f"qgis-ge-launcher-{version}.crx"

    crx, app_id = pack_crx(key, build_zip(base + "updates.xml"))

    DIST.mkdir(parents=True, exist_ok=True)
    (DIST / crx_name).write_bytes(crx)
    (DIST / "updates.xml").write_text(
        UPDATES_XML.format(app_id=app_id, codebase=base + crx_name, version=version),
        encoding="utf-8",
    )

    print(f"extension id: {app_id}")
    print(f"wrote dist/{crx_name} ({len(crx) / 1024:.1f} KB)")
    print(f"wrote dist/updates.xml -> {base}{crx_name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
