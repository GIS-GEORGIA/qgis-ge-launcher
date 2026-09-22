# Enterprise deployment · ცენტრალიზებული დაყენება

For managed Chrome or Edge fleets — a university lab, a company, a classroom —
where the Chrome Web Store is not an option.

მართვად მოწყობილობებზე (უნივერსიტეტის ლაბორატორია, კომპანია, საკლასო ოთახი),
სადაც Chrome Web Store ხელმისაწვდომი არაა.

---

## Why this exists

Chrome stopped accepting `.crx` files dragged into the browser on Windows and
macOS. A signed `.crx` is therefore useful in exactly one way: through the
`ExtensionSettings` / `ExtensionInstallForcelist` policies, which an
administrator applies to machines they manage. Those policies still install and
auto-update an extension hosted on your own server.

For everyone else — anyone installing on their own laptop — the route is the
Microsoft Edge Add-ons store, or **Load unpacked** from a GitHub release. See
[the install page](https://ext.qgis.ge/).

## 1. Create the signing key, once

```bash
openssl genrsa -out private/crx-key.pem 4096
```

The extension ID is derived from this key, so **back it up and keep it secret**.
Lose it and every managed install has to be re-pointed at a new ID; leak it and
someone else can sign a package that Chrome treats as yours. `private/` is
git-ignored, so the key never leaves your machine by accident.

## 2. Build the package

```bash
python tools/make_crx.py --key private/crx-key.pem --base-url https://qgis.ge/launcher/
```

This writes, into `dist/`:

| File | Purpose |
|---|---|
| `qgis-ge-launcher-<version>.crx` | the signed package |
| `updates.xml` | the update manifest Chrome polls |

and prints the extension ID. `--base-url` is the directory both files will be
served from; it is baked into `updates.xml` and into the packaged manifest's
`update_url`, so it has to match where you actually upload them.

`update_url` is injected only into the `.crx` copy. It must never appear in the
manifest uploaded to a store — both the Chrome Web Store and Edge Add-ons reject
a package that carries one.

## 3. Serve both files

Upload `qgis-ge-launcher-<version>.crx` and `updates.xml` to the directory you
passed as `--base-url`, over HTTPS.

**Serve the `.crx` with the right media type.** Some deployments fail silently
otherwise:

```nginx
location ~ \.crx$ {
    types { } default_type application/x-chrome-extension;
}
```

Apache:

```apache
AddType application/x-chrome-extension .crx
```

Static hosts that cannot set headers — GitHub Pages among them — are a poor fit
for this step. Use a server you control, which is why `qgis.ge` is the natural
home.

## 4. Apply the policy

Replace `EXTENSION_ID` with the id `make_crx.py` printed.

### Windows, Group Policy

`Computer Configuration → Administrative Templates → Google → Google Chrome →
Extensions → Configure extension management settings`, as one line of JSON:

```json
{"EXTENSION_ID":{"installation_mode":"normal_installed","update_url":"https://qgis.ge/launcher/updates.xml"}}
```

`normal_installed` installs it and lets the user disable it. Use
`force_installed` to make it mandatory and non-removable.

### Windows, registry

```
HKLM\SOFTWARE\Policies\Google\Chrome\ExtensionInstallForcelist
  1 = "EXTENSION_ID;https://qgis.ge/launcher/updates.xml"
```

### Microsoft Edge

The same policy under `Microsoft Edge` instead of `Google Chrome`, with
`HKLM\SOFTWARE\Policies\Microsoft\Edge\ExtensionInstallForcelist`. Edge accepts
a Chrome-format `.crx` and update manifest unchanged.

### Linux

```bash
sudo mkdir -p /etc/opt/chrome/policies/managed
sudo tee /etc/opt/chrome/policies/managed/qgis-ge-launcher.json <<'EOF'
{
  "ExtensionInstallForcelist": [
    "EXTENSION_ID;https://qgis.ge/launcher/updates.xml"
  ]
}
EOF
```

### macOS

Ship a configuration profile with the `ExtensionInstallForcelist` key under the
`com.google.Chrome` preference domain, same `id;update_url` string.

## 5. Check it worked

1. Restart Chrome on a managed machine.
2. Open `chrome://policy` and confirm the policy is listed and its status is OK.
3. Open `chrome://extensions` — the extension appears, marked as installed by
   your organisation's policy.

## 6. Shipping an update

1. Raise `version` in `manifest.json`.
2. Re-run `make_crx.py` with the **same key**.
3. Upload the new `.crx` and the regenerated `updates.xml`.

Chrome polls `updates.xml` roughly every five hours and updates whenever the
advertised version is higher than the installed one. Nothing is required of the
user.

## Building it in CI

`.github/workflows/release.yml` builds the `.crx` on a tag when — and only when
— a `CRX_PRIVATE_KEY` repository secret exists, and attaches it to the release
along with `updates.xml`. To enable it:

1. `Settings → Secrets and variables → Actions → New repository secret`
2. Name `CRX_PRIVATE_KEY`, value the full contents of `private/crx-key.pem`
   including the `-----BEGIN…` and `-----END…` lines.
3. Optionally add a `CRX_BASE_URL` variable; it defaults to
   `https://qgis.ge/launcher/`.

Skip this if you would rather the key never leaves your own machine — building
locally works exactly the same.
