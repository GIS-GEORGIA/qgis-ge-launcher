// In-popup KA/EN strings. Kept separate from _locales/, which only localises
// the store listing (name + description) via the browser UI language.

const STRINGS = {
  ka: {
    search: 'ძებნა…',
    noResults: 'ვერაფერი მოიძებნა',
    pinned: 'რჩეულები',
    settings: 'პარამეტრები',
    edit: 'ბმულების რედაქტირება',
    lang: 'ენა',
    theme: 'თემა',
    themeAuto: 'სისტემის მიხედვით',
    themeLight: 'ღია',
    themeDark: 'მუქი',
    openIn: 'ბმული იხსნება',
    openNewTab: 'ახალ ჩანართში',
    openCurrent: 'მიმდინარე ჩანართში',
    density: 'ხედი',
    densityGrid: 'ბადე',
    densityList: 'სია',
    hintOpen: 'Enter — გახსნა',
    hintNewTab: 'Ctrl+Enter — ფონურ ჩანართში',
    hintNum: 'Alt+1…9 — სწრაფი გახსნა',
    pin: 'რჩეულებში დამატება',
    unpin: 'რჩეულებიდან ამოღება',
    addLink: 'ბმულის დამატება',
    addGroup: 'ჯგუფის დამატება',
    title: 'დასახელება (ქართ.)',
    titleEn: 'Title (EN)',
    url: 'ბმული',
    group: 'ჯგუფი',
    tags: 'საძიებო სიტყვები',
    color: 'ფერი',
    remove: 'წაშლა',
    up: 'ზემოთ',
    down: 'ქვემოთ',
    saved: 'შენახულია',
    export: 'ექსპორტი (JSON)',
    import: 'იმპორტი (JSON)',
    reset: 'საწყისზე დაბრუნება',
    resetConfirm: 'ყველა ცვლილება წაიშლება და სია დაბრუნდება საწყის მდგომარეობაში. გავაგრძელოთ?',
    removeGroupConfirm: 'ჯგუფი და მისი ყველა ბმული წაიშლება. გავაგრძელოთ?',
    optionsTitle: 'ბმულების რედაქტირება',
    groupName: 'ჯგუფის სახელი (ქართ.)',
    groupNameEn: 'Group name (EN)',
    badUrl: 'ბმული არასწორია — გამოიყენეთ http:// ან https://',
    importFailed: 'ფაილი ვერ წაიკითხა',
    empty: 'ჯერ არცერთი ბმული არ არის — დაამატეთ პარამეტრებში.',
    back: 'დახურვა',
    autosave: 'ცვლილებები ავტომატურად ინახება და სინქრონიზდება ბრაუზერის პროფილზე.',
    linksCount: (n) => n + ' ბმული',
  },
  en: {
    search: 'Search…',
    noResults: 'Nothing found',
    pinned: 'Pinned',
    settings: 'Settings',
    edit: 'Edit links',
    lang: 'Language',
    theme: 'Theme',
    themeAuto: 'Follow system',
    themeLight: 'Light',
    themeDark: 'Dark',
    openIn: 'Open links',
    openNewTab: 'in a new tab',
    openCurrent: 'in the current tab',
    density: 'View',
    densityGrid: 'Grid',
    densityList: 'List',
    hintOpen: 'Enter — open',
    hintNewTab: 'Ctrl+Enter — background tab',
    hintNum: 'Alt+1…9 — quick open',
    pin: 'Pin to the top',
    unpin: 'Unpin',
    addLink: 'Add link',
    addGroup: 'Add group',
    title: 'Title (KA)',
    titleEn: 'Title (EN)',
    url: 'URL',
    group: 'Group',
    tags: 'Search keywords',
    color: 'Colour',
    remove: 'Remove',
    up: 'Up',
    down: 'Down',
    saved: 'Saved',
    export: 'Export (JSON)',
    import: 'Import (JSON)',
    reset: 'Restore defaults',
    resetConfirm: 'This discards your changes and restores the built-in list. Continue?',
    removeGroupConfirm: 'The group and all of its links will be removed. Continue?',
    optionsTitle: 'Edit links',
    groupName: 'Group name (KA)',
    groupNameEn: 'Group name (EN)',
    badUrl: 'That URL is not valid — use http:// or https://',
    importFailed: 'Could not read that file',
    empty: 'No links yet — add some in the settings.',
    back: 'Close',
    autosave: 'Changes are saved automatically and synced to your browser profile.',
    linksCount: (n) => n + (n === 1 ? ' link' : ' links'),
  },
};

export function resolveLang(setting) {
  if (setting === 'ka' || setting === 'en') return setting;
  const ui = (chrome.i18n?.getUILanguage?.() || navigator.language || 'en').toLowerCase();
  return ui.startsWith('ka') ? 'ka' : 'en';
}

export function t(lang) {
  const dict = STRINGS[lang] || STRINGS.en;
  return (key, ...args) => {
    const v = dict[key];
    return typeof v === 'function' ? v(...args) : (v ?? key);
  };
}

/** Label of a link/group in the active language, falling back to the other. */
export function label(obj, lang) {
  return (lang === 'ka' ? obj.ka || obj.en : obj.en || obj.ka) || '';
}
