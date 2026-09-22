# Store listing copy

Paste-ready text for the Chrome Web Store, Microsoft Edge Add-ons and Opera
add-ons dashboards. Keep it in sync with `_locales/*/messages.json`.

---

## Name (max 45 chars)

```
QGIS.GE Launcher — Quick Links
```

## Short description / summary (max 132 chars)

**EN**
```
One-click access to your qgis.ge sites, GitHub orgs and repos. Editable list, bilingual UI, no tracking, no network requests.
```

**KA**
```
ერთი დაჭერით წვდომა qgis.ge საიტებზე, GitHub ორგანიზაციებსა და რეპოებზე. რედაქტირებადი სია, ორენოვანი, თვალყურის დევნების გარეშე.
```

## Detailed description

**EN**
```
QGIS.GE Launcher puts the sites and repositories you open every day one click away.

WHAT YOU GET
• A grid (or list) of your links, grouped the way you want
• Instant search — start typing to filter by title, URL or keyword
• Pin the links you use most so they sit at the top
• Keyboard first: Alt+Shift+G opens the popup, arrows navigate, Enter opens,
  Alt+1…9 jumps straight to one of the first nine links
• Light and dark themes, following your system by default
• Bilingual interface: Georgian and English, switchable at any time

YOUR LIST, NOT OURS
It ships with a handful of QGIS GEORGIA links so the popup is not empty on the
first run — everything after that is yours. Add your own links, rename them in
both languages, pick a colour, reorder them, create your own groups, and export
or import the whole list as JSON.

PRIVACY
This extension makes no network requests at all. It asks for a single
permission — "storage" — to remember your own link list. No analytics, no ads,
no tracking, no access to your browsing history or the content of your tabs.
It does not even download site favicons.

OPEN SOURCE
MIT licensed. Source, issues and releases:
https://github.com/GIS-GEORGIA/qgis-ge-launcher
```

**KA**
```
QGIS.GE Launcher ერთი დაჭერის მანძილზე გიახლოებთ იმ საიტებსა და რეპოზიტორიებს, რომლებსაც ყოველდღე ხსნით.

რას იღებთ
• თქვენი ბმულების ბადე (ან სია), თქვენთვის სასურველად დაჯგუფებული
• მყისიერი ძებნა — დაიწყეთ წერა და სია გაიფილტრება სახელით, ბმულით ან საძიებო სიტყვით
• რჩეულები — ხშირად გამოყენებული ბმულები ყოველთვის ზემოთ
• კლავიატურა უპირველესად: Alt+Shift+G ხსნის ფანჯარას, ისრები ნავიგაციისთვის,
  Enter გასახსნელად, Alt+1…9 პირველი ცხრა ბმულისთვის
• ღია და მუქი თემა, ნაგულისხმევად სისტემის მიხედვით
• ორენოვანი ინტერფეისი: ქართული და ინგლისური, ნებისმიერ დროს გადართვადი

სია თქვენია
თავდაპირველად შიგნით რამდენიმე QGIS GEORGIA-ს ბმულია, რომ ფანჯარა ცარიელი არ იყოს —
დანარჩენი უკვე თქვენზეა. დაამატეთ საკუთარი ბმულები, დაარქვით სახელი ორივე ენაზე,
აირჩიეთ ფერი, გადაალაგეთ, შექმენით საკუთარი ჯგუფები და საჭიროების შემთხვევაში
გაიტანეთ ან შემოიტანეთ მთელი სია JSON-ად.

პრივატულობა
გაფართოება არცერთ ქსელურ მოთხოვნას არ აგზავნის. ითხოვს მხოლოდ ერთ ნებართვას —
"storage" — რომ თქვენივე ბმულების სია დაიმახსოვროს. არანაირი ანალიტიკა, რეკლამა
ან თვალყურის დევნება; არც ისტორიაზე და არც ჩანართების შიგთავსზე წვდომა.
საიტების ხატულებსაც კი არ ჩამოტვირთავს.

ღია კოდი
MIT ლიცენზია. კოდი, issue-ები და გამოშვებები:
https://github.com/GIS-GEORGIA/qgis-ge-launcher
```

## Category

`Productivity` → `Workflow & Planning`

## Language

Primary: English. Also list Georgian (ka).

## Privacy practices (Chrome Web Store form)

- **Single purpose**: "Provides a popup of user-configured bookmarks-style
  buttons for opening the user's own websites and GitHub repositories."
- **Note for review**: the extension ships no personal data of its own. The
  handful of default links are public QGIS GEORGIA project pages.
- **Permission justification — `storage`**: "Stores the user's own list of links
  and their UI preferences (language, theme, layout). No other data is stored."
- **Host permissions**: none requested.
- **Remote code**: "No, I am not using remote code." All scripts are bundled.
- **Data usage**: tick *nothing*. The extension collects no user data.
- **Privacy policy URL**:
  `https://github.com/GIS-GEORGIA/qgis-ge-launcher/blob/main/PRIVACY.md`

## Assets

| Asset | Size | File |
|---|---|---|
| Store icon | 128×128 | `icons/icon128.png` |
| Small promo tile | 440×280 | `store/promo-440x280.png` |
| Screenshot 1 | 1280×800 | popup, grid view, light theme |
| Screenshot 2 | 1280×800 | popup, dark theme |
| Screenshot 3 | 1280×800 | options page |

Screenshots must be 1280×800 or 640×400 — at least one is required.

`dev/shots.html` lays the three shots out at exactly 1280×800 on a branded
backdrop. To capture them:

1. `python -m http.server 8123`, then open `http://localhost:8123/dev/shots.html`.
2. Open DevTools, pick a `.frame` element in the Elements panel, right-click it
   and choose **Capture node screenshot**.
3. Switch the theme between shots from the popup's own settings (the gear), or
   in the console:
   `s=JSON.parse(localStorage['devshim:sync:state']); s.settings.theme='dark';
   localStorage['devshim:sync:state']=JSON.stringify(s); location.reload()`

## Review notes

Nothing to test behind a login. The extension has no backend and no accounts.
