import { getState, setState, onChange, hostOf } from './store.js';
import { resolveLang, t, label } from './i18n.js';

const $ = (id) => document.getElementById(id);

const els = {
  search: $('search'),
  list: $('list'),
  settings: $('settings'),
  toggleSettings: $('toggle-settings'),
  langKa: $('lang-ka'),
  langEn: $('lang-en'),
  selTheme: $('sel-theme'),
  selDensity: $('sel-density'),
  selOpenIn: $('sel-openin'),
  btnEdit: $('btn-edit'),
};

let state = null;
let lang = 'en';
let tr = t('en');
let flat = [];        // links currently rendered, in visual order
let active = -1;      // index into `flat`
let columns = 3;

/* ------------------------------------------------------------------ chrome */

async function openUrl(url, { newTab, background = false }) {
  try {
    if (newTab) {
      await chrome.tabs.create({ url, active: !background });
      if (background) return;          // keep the popup open for more clicks
    } else {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) await chrome.tabs.update(tab.id, { url });
      else await chrome.tabs.create({ url });
    }
  } catch {
    window.open(url, '_blank', 'noopener');
  }
  window.close();
}

/* ------------------------------------------------------------------ render */

function applyTheme() {
  const theme = state.settings.theme;
  if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
}

function matches(link, q) {
  if (!q) return true;
  const hay = `${link.ka} ${link.en} ${link.url} ${link.tags}`.toLowerCase();
  return q.split(/\s+/).every((w) => hay.includes(w));
}

function monogram(text) {
  return Array.from(text.trim())[0] || '•';
}

function linkNode(link, keyIndex) {
  const a = document.createElement('a');
  a.className = 'link';
  a.href = link.url;
  a.dataset.id = link.id;
  const name = label(link, lang);
  a.title = `${name}\n${link.url}`;

  const mono = document.createElement('span');
  mono.className = `mono c${link.color ?? 0}`;
  mono.setAttribute('aria-hidden', 'true');
  mono.textContent = monogram(name);

  const nameEl = document.createElement('span');
  nameEl.className = 'name';
  nameEl.textContent = name;

  const host = document.createElement('span');
  host.className = 'host';
  host.textContent = hostOf(link.url);

  const pin = document.createElement('button');
  pin.type = 'button';
  pin.className = 'pin' + (link.pinned ? ' on' : '');
  pin.title = tr(link.pinned ? 'unpin' : 'pin');
  pin.setAttribute('aria-label', pin.title);
  pin.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">'
    + '<path d="M12 3.6l2.5 5.2 5.6.8-4 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-4 5.6-.8z"/></svg>';
  pin.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    togglePin(link.id);
  });

  if (keyIndex !== null) {
    const key = document.createElement('span');
    key.className = 'key';
    key.textContent = keyIndex + 1;
    a.append(key);
  }
  a.append(mono, nameEl, host, pin);

  a.addEventListener('click', (ev) => {
    if (ev.button !== 0) return;                       // middle click stays native
    ev.preventDefault();
    const newTab = ev.ctrlKey || ev.metaKey || ev.shiftKey
      || state.settings.openIn === 'newtab';
    openUrl(link.url, { newTab, background: ev.ctrlKey || ev.metaKey });
  });

  return a;
}

function section(title, links, startKey) {
  const sec = document.createElement('section');
  const h = document.createElement('h2');
  h.className = 'group-title';
  h.textContent = title;
  const box = document.createElement('div');
  box.className = state.settings.density === 'list' ? 'list' : 'grid';
  links.forEach((l, i) => {
    const n = startKey + i;
    box.append(linkNode(l, n < 9 ? n : null));
  });
  sec.append(h, box);
  return sec;
}

function render() {
  const q = els.search.value.trim().toLowerCase();
  const visible = state.links.filter((l) => matches(l, q));
  columns = state.settings.density === 'list' ? 1 : 3;

  els.list.textContent = '';
  flat = [];
  active = -1;

  if (!state.links.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = tr('empty');
    els.list.append(p);
    return;
  }
  if (!visible.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = tr('noResults');
    els.list.append(p);
    return;
  }

  const pinned = visible.filter((l) => l.pinned);
  if (pinned.length) {
    els.list.append(section('★ ' + tr('pinned'), pinned, flat.length));
    flat.push(...pinned);
  }
  for (const g of state.groups) {
    const inGroup = visible.filter((l) => l.group === g.id && !l.pinned);
    if (!inGroup.length) continue;
    els.list.append(section(label(g, lang), inGroup, flat.length));
    flat.push(...inGroup);
  }

  if (q) setActive(0);
}

function setActive(i) {
  const nodes = els.list.querySelectorAll('.link');
  nodes.forEach((n) => n.classList.remove('active'));
  if (i < 0 || i >= nodes.length) { active = -1; return; }
  active = i;
  nodes[i].classList.add('active');
  nodes[i].scrollIntoView({ block: 'nearest' });
}

function applyLabels() {
  els.search.placeholder = tr('search');
  els.search.setAttribute('aria-label', tr('search'));
  els.toggleSettings.title = tr('settings');
  els.toggleSettings.setAttribute('aria-label', tr('settings'));
  els.btnEdit.textContent = tr('edit');
  $('l-theme').textContent = tr('theme');
  $('l-density').textContent = tr('density');
  $('l-openin').textContent = tr('openIn');
  $('hint-open').textContent = tr('hintOpen');
  $('hint-num').textContent = tr('hintNum');

  const opts = (sel, pairs) => {
    [...sel.options].forEach((o) => { o.textContent = pairs[o.value]; });
  };
  opts(els.selTheme, { auto: tr('themeAuto'), light: tr('themeLight'), dark: tr('themeDark') });
  opts(els.selDensity, { grid: tr('densityGrid'), list: tr('densityList') });
  opts(els.selOpenIn, { newtab: tr('openNewTab'), current: tr('openCurrent') });

  els.langKa.setAttribute('aria-pressed', String(lang === 'ka'));
  els.langEn.setAttribute('aria-pressed', String(lang === 'en'));
  document.documentElement.lang = lang;
}

function syncControls() {
  els.selTheme.value = state.settings.theme;
  els.selDensity.value = state.settings.density;
  els.selOpenIn.value = state.settings.openIn;
}

function refresh() {
  lang = resolveLang(state.settings.lang);
  tr = t(lang);
  applyTheme();
  applyLabels();
  syncControls();
  render();
}

/* ------------------------------------------------------------------ mutate */

async function patchSettings(patch) {
  state = { ...state, settings: { ...state.settings, ...patch } };
  refresh();
  await setState(state);
}

async function togglePin(id) {
  state = {
    ...state,
    links: state.links.map((l) => (l.id === id ? { ...l, pinned: !l.pinned } : l)),
  };
  render();
  await setState(state);
}

/* ------------------------------------------------------------------ events */

els.search.addEventListener('input', render);

els.langKa.addEventListener('click', () => patchSettings({ lang: 'ka' }));
els.langEn.addEventListener('click', () => patchSettings({ lang: 'en' }));
els.selTheme.addEventListener('change', () => patchSettings({ theme: els.selTheme.value }));
els.selDensity.addEventListener('change', () => patchSettings({ density: els.selDensity.value }));
els.selOpenIn.addEventListener('change', () => patchSettings({ openIn: els.selOpenIn.value }));

els.toggleSettings.addEventListener('click', () => {
  const open = els.settings.classList.toggle('open');
  els.toggleSettings.setAttribute('aria-expanded', String(open));
});

els.btnEdit.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

document.addEventListener('keydown', (ev) => {
  if (ev.altKey && /^[1-9]$/.test(ev.key)) {
    const link = flat[Number(ev.key) - 1];
    if (link) {
      ev.preventDefault();
      openUrl(link.url, { newTab: state.settings.openIn === 'newtab' });
    }
    return;
  }

  const move = { ArrowDown: columns, ArrowUp: -columns, ArrowRight: 1, ArrowLeft: -1 }[ev.key];
  if (move !== undefined) {
    if ((ev.key === 'ArrowLeft' || ev.key === 'ArrowRight')
        && document.activeElement === els.search && active === -1) return;  // let the caret move
    ev.preventDefault();
    const n = flat.length;
    if (!n) return;
    const next = active === -1
      ? (move > 0 ? 0 : n - 1)
      : Math.min(n - 1, Math.max(0, active + move));
    setActive(next);
    return;
  }

  if (ev.key === 'Enter') {
    const link = flat[active === -1 ? 0 : active];
    if (!link) return;
    ev.preventDefault();
    const newTab = ev.ctrlKey || ev.metaKey || state.settings.openIn === 'newtab';
    openUrl(link.url, { newTab, background: ev.ctrlKey || ev.metaKey });
    return;
  }

  if (ev.key === 'Escape') {
    if (els.search.value) {
      els.search.value = '';
      render();
      ev.preventDefault();
    }
    return;
  }

  // Any other printable key goes to the search box.
  if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey
      && document.activeElement !== els.search) {
    els.search.focus();
  }
});

onChange((next) => {
  state = next;
  const keep = els.search.value;
  refresh();
  els.search.value = keep;
  render();
});

(async function init() {
  state = await getState();
  refresh();
  els.search.focus();
}());
