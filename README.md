# QGIS.GE Launcher — სწრაფი ბმულები / Quick Links

ბრაუზერის გაფართოება, რომელიც ერთი დაჭერით გხსნით თქვენს `qgis.ge` საიტებს, GitHub
ორგანიზაციებსა და რეპოებს. სია სრულად რედაქტირებადია, ინტერფეისი ორენოვანია
(ქართული / English), ღია და მუქი თემით.

A browser extension that opens your `qgis.ge` sites, GitHub organisations and repos
in one click. The list is fully editable, the UI is bilingual (Georgian / English),
and it follows your light/dark theme.

მუშაობს ყველა Chromium-ზე დაფუძნებულ ბრაუზერში — Chrome, Edge, Brave, Opera,
Vivaldi, Arc, Yandex. · Works in every Chromium-based browser.

---

## რას აკეთებს · What it does

| | |
|---|---|
| 🔎 | **ძებნა** — დაიწყეთ წერა და სია ფილტრდება სახელით, ბმულით ან საძიებო სიტყვით · type to filter by title, URL or keyword |
| ⌨️ | **კლავიატურა** — `Alt+Shift+G` გახსნის ფანჯარას, ისრები ნავიგაციისთვის, `Enter` გასახსნელად, `Alt+1…9` პირველი ცხრა ბმულისთვის |
| ⭐ | **რჩეულები** — ხშირად გამოყენებული ბმულები ზემოთ · pin what you use most |
| ✏️ | **რედაქტირება** — დაამატეთ, წაშალეთ, გადაალაგეთ ბმულები და ჯგუფები · add, remove and reorder links and groups |
| 🌓 | **თემა** — ღია / მუქი / სისტემის მიხედვით · light / dark / follow system |
| 🔁 | **სინქრონიზაცია** — `chrome.storage.sync`-ით სია მოგყვებათ პროფილზე შესვლისას |
| 🔒 | **პრივატულობა** — არანაირი ქსელური მოთხოვნა, ანალიტიკა ან ნებართვა `storage`-ის გარდა |

## დაყენება · Install

### მაღაზიიდან · From the store

გამოქვეყნების შემდეგ ბმულები აქ დაემატება. · Links will be added here once published.

### ხელით (დეველოპერის რეჟიმი) · Manually (developer mode)

```bash
python tools/build.py
```

ეს შექმნის `dist/qgis-ge-launcher-<version>.zip`-ს. შემდეგ:

1. გახსენით `chrome://extensions` (Edge-ზე `edge://extensions`).
2. ჩართეთ **Developer mode** / **დეველოპერის რეჟიმი**.
3. **Load unpacked** და აირჩიეთ რეპოს ძირეული საქაღალდე (არა `dist/`).

ZIP თავად საჭიროა მხოლოდ მაღაზიაში ასატვირთად.

## საჯარო და პირადი ბმულები · Public and private links

`src/defaults.js` განზრახ მოკლეა — მასში მხოლოდ საჯარო QGIS GEORGIA-ს ბმულებია,
რადგან სწორედ ეს ჩანს მაღაზიიდან დამყენებელთან.

პირადი ბმულები ცალკე დევს, `private/` საქაღალდეში, რომელიც `.gitignore`-შია და
პაკეტშიც არ ხვდება:

| ფაილი | დანიშნულება |
|---|---|
| `private/links.json` | სრული სია options-გვერდის **Export (JSON)**-ის ფორმატში — დაყენების შემდეგ ერთხელ **Import (JSON)**-ით ჩაიტვირთება და `chrome.storage.sync` სხვა პროფილებზეც გადაიტანს |
| `private/never-publish.txt` | თითო ბმული ხაზზე; `tools/build.py` აგებას შეაჩერებს, თუ რომელიმე მათგანი `src/defaults.js`-ში აღმოჩნდება |

`private/` საქაღალდის გარეშეც (სუფთა clone, CI) შემოწმება უბრალოდ გამოტოვდება და
აგება ნორმალურად გაგრძელდება. დეტალები — `private/README.md`.

`src/defaults.js` deliberately ships only public QGIS GEORGIA links, because that
is what someone installing from the store sees. Personal links live in the
git-ignored, never-packaged `private/` folder and are imported once from the
options page; `tools/build.py` fails the build if one ever leaks back into the
defaults.

## პროექტის აგებულება · Layout

```
manifest.json          MV3 manifest — მხოლოდ "storage" ნებართვა
_locales/{en,ka}/      მაღაზიის სახელი და აღწერა
src/
  defaults.js          საწყისი ჯგუფები და ბმულები (მხოლოდ საჯარო)
  store.js             chrome.storage-ის გარსი + მიგრაცია + URL-ის ვალიდაცია
  i18n.js              KA/EN სტრიქონები ინტერფეისისთვის
  popup.html/css/js    ბმულების ფანჯარა
  options.html/css/js  რედაქტორი
  ui.css               საერთო თემა და კომპონენტები
icons/                 16/32/48/128 px
dev/                   ბრაუზერში გასაშვები ასლები (chrome.* შიმით) — არ იფუთება
private/               პირადი ბმულები — gitignore, არ იფუთება, არ ქვეყნდება
tools/
  build.py             ვალიდაცია + ZIP
  make_icons.py        ხატულების გენერაცია (Pillow)
  make_dev_pages.py    dev/ გვერდების რეგენერაცია src/-იდან
```

## შემუშავება · Development

```bash
python -m http.server 8123
```

შემდეგ გახსენით `http://localhost:8123/dev/popup.html` ან `dev/options.html`.
`dev/chrome-shim.js` ცვლის `chrome.storage`/`chrome.tabs`-ს `localStorage`-ით, ასე რომ
ორივე გვერდი ჩვეულებრივ ჩანართში მუშაობს, გაფართოების დაყენების გარეშე.

`src/*.html`-ის შეცვლის შემდეგ:

```bash
python tools/make_dev_pages.py
```

გამოშვებამდე შემოწმება · Validate before release:

```bash
python tools/build.py --check
```

## გამოშვება · Release

1. აწიეთ `version` `manifest.json`-ში.
2. `git tag v1.0.1 && git push --tags` — GitHub Actions ააწყობს ZIP-ს და მიაბამს release-ს.
3. ატვირთეთ ZIP:
   - [Microsoft Edge Add-ons](https://partner.microsoft.com/dashboard/microsoftedge) — უფასო, **მთავარი მაღაზია**
   - [Opera add-ons](https://addons.opera.com/developer/) — უფასო
   - [Chrome Web Store](https://chrome.google.com/webstore/devconsole) — ერთჯერადი $5

`store/LISTING.md`-ში გამზადებულია Partner Center-ის ყველა ველი.

> **Chrome Web Store და საქართველო.** $5-ის გადახდა Google-ის სავაჭრო სისტემაზე
> გადის, რომლის ქვეყნების სიაში საქართველო არ არის, ამიტომ რეგისტრაცია ვერ
> სრულდება. Chrome-ის გუნდი
> [აღიარებს შეზღუდვას](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/FWK5U6_EJr8)
> და ამბობს, რომ რეგიონებს აფართოებს, თარიღის გარეშე. მანამდე Chrome-ის,
> Brave-ის, Vivaldi-ის და Arc-ის მომხმარებლებისთვის რჩება GitHub Releases-იდან
> ჩამოტვირთვა და „Load unpacked“.

## ლიცენზია · License

[MIT](LICENSE) © Giorgi Kapanadze / GIS GEORGIA
