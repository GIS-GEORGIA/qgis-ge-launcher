import {
  getState, setState, freshState, newId, normalizeUrl,
} from './store.js';
import { resolveLang, t, label } from './i18n.js';

const $ = (id) => document.getElementById(id);
const PALETTE = [0, 1, 2, 3, 4, 5, 6];

let state = null;
let lang = 'en';
let tr = t('en');
let saveTimer = null;

/* ------------------------------------------------------------------- save */

function scheduleSave(message) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await setState(state);
    toast(message || tr('saved'));
  }, 250);
}

function toast(text, isError = false) {
  const el = $('toast');
  el.textContent = text;
  el.classList.toggle('err', isError);
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 1600);
}

/* ----------------------------------------------------------------- render */

function monogram(text) {
  return Array.from(String(text).trim())[0] || '•';
}

function field(value, placeholder, oninput) {
  const el = document.createElement('input');
  el.className = 'field';
  el.type = 'text';
  el.value = value || '';
  el.placeholder = placeholder;
  el.setAttribute('aria-label', placeholder);
  el.addEventListener('input', () => oninput(el.value, el));
  return el;
}

function iconButton(title, path, onclick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'icon-btn';
  b.title = title;
  b.setAttribute('aria-label', title);
  b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
  b.addEventListener('click', onclick);
  return b;
}

const ICON_UP = '<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>';
const ICON_DOWN = '<path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/>';
const ICON_DEL = '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>';

function linkRow(link) {
  const row = document.createElement('div');
  row.className = 'row-link';
  row.dataset.id = link.id;

  const mono = document.createElement('span');
  mono.className = `mono c${link.color}`;
  mono.textContent = monogram(label(link, lang));
  mono.setAttribute('aria-hidden', 'true');

  const ka = field(link.ka, tr('title'), (v) => {
    link.ka = v;
    mono.textContent = monogram(label(link, lang));
    scheduleSave();
  });
  const en = field(link.en, tr('titleEn'), (v) => {
    link.en = v;
    mono.textContent = monogram(label(link, lang));
    scheduleSave();
  });
  const url = field(link.url, tr('url'), (v) => { link.url = v; scheduleSave(); });
  url.type = 'url';
  url.addEventListener('blur', () => {
    if (!url.value.trim()) return;               // a row still being filled in
    const norm = normalizeUrl(url.value);
    if (!norm) { toast(tr('badUrl'), true); return; }
    url.value = norm;
    link.url = norm;
    scheduleSave();
  });
  const tags = field(link.tags, tr('tags'), (v) => { link.tags = v; scheduleSave(); });

  const color = document.createElement('select');
  color.className = 'field';
  color.title = tr('color');
  color.setAttribute('aria-label', tr('color'));
  PALETTE.forEach((c) => {
    const o = document.createElement('option');
    o.value = String(c);
    o.textContent = '●';
    o.style.color = `var(--tile-${c})`;
    color.append(o);
  });
  const paintSelect = () => { color.style.color = `var(--tile-${link.color})`; };
  color.value = String(link.color);
  paintSelect();
  color.addEventListener('change', () => {
    link.color = Number(color.value);
    mono.className = `mono c${link.color}`;
    paintSelect();
    scheduleSave();
  });

  const ops = document.createElement('div');
  ops.className = 'ops';
  ops.append(
    iconButton(tr('up'), ICON_UP, () => moveLink(link, -1)),
    iconButton(tr('down'), ICON_DOWN, () => moveLink(link, 1)),
    iconButton(tr('remove'), ICON_DEL, () => removeLink(link)),
  );

  row.append(mono, ka, en, url, tags, color, ops);
  return row;
}

function groupCard(group) {
  const card = document.createElement('section');
  card.className = 'group';

  const head = document.createElement('header');
  head.append(
    field(group.ka, tr('groupName'), (v) => { group.ka = v; scheduleSave(); }),
    field(group.en, tr('groupNameEn'), (v) => { group.en = v; scheduleSave(); }),
  );
  const ops = document.createElement('div');
  ops.className = 'ops';
  ops.append(
    iconButton(tr('up'), ICON_UP, () => moveGroup(group, -1)),
    iconButton(tr('down'), ICON_DOWN, () => moveGroup(group, 1)),
    iconButton(tr('remove'), ICON_DEL, () => removeGroup(group)),
  );
  head.append(ops);

  const headings = document.createElement('div');
  headings.className = 'head-link';
  ['', tr('title'), tr('titleEn'), tr('url'), tr('tags'), tr('color')].forEach((txt) => {
    const s = document.createElement('span');
    s.textContent = txt;
    headings.append(s);
  });
  const opsH = document.createElement('span');
  opsH.className = 'ops-h';
  headings.append(opsH);

  const rows = document.createElement('div');
  rows.className = 'rows';
  const links = state.links.filter((l) => l.group === group.id);
  links.forEach((l) => rows.append(linkRow(l)));

  const foot = document.createElement('footer');
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'btn';
  add.textContent = '+ ' + tr('addLink');
  add.addEventListener('click', () => addLink(group.id));
  foot.append(add);

  card.append(head);
  if (links.length) card.append(headings, rows);
  card.append(foot);
  return card;
}

function render() {
  const host = $('groups');
  host.textContent = '';
  state.groups.forEach((g) => host.append(groupCard(g)));

  $('h-title').textContent = tr('optionsTitle');
  document.title = 'QGIS.GE Launcher — ' + tr('optionsTitle');
  $('count').textContent = tr('linksCount', state.links.length);
  $('add-group').textContent = '+ ' + tr('addGroup');
  $('btn-export').textContent = tr('export');
  $('btn-import').textContent = tr('import');
  $('btn-reset').textContent = tr('reset');
  $('hint').textContent = tr('autosave');
  $('lang-ka').setAttribute('aria-pressed', String(lang === 'ka'));
  $('lang-en').setAttribute('aria-pressed', String(lang === 'en'));
  document.documentElement.lang = lang;

  const theme = state.settings.theme;
  if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
}

/* ----------------------------------------------------------------- mutate */

function addLink(groupId) {
  const link = {
    id: newId(), group: groupId, url: '', ka: '', en: '', color: 0, tags: '', pinned: false,
  };
  // Insert right after the last link of that group so the row lands in place.
  let at = state.links.length;
  for (let i = state.links.length - 1; i >= 0; i--) {
    if (state.links[i].group === groupId) { at = i + 1; break; }
  }
  state.links.splice(at, 0, link);
  render();
  $('groups').querySelector(`.row-link[data-id="${link.id}"] .field`)?.focus();
}

function removeLink(link) {
  state.links = state.links.filter((l) => l !== link);
  render();
  scheduleSave();
}

function moveLink(link, dir) {
  const siblings = state.links.filter((l) => l.group === link.group);
  const i = siblings.indexOf(link);
  const j = i + dir;
  if (j < 0 || j >= siblings.length) return;
  const a = state.links.indexOf(siblings[i]);
  const b = state.links.indexOf(siblings[j]);
  [state.links[a], state.links[b]] = [state.links[b], state.links[a]];
  render();
  scheduleSave();
}

function addGroup() {
  state.groups.push({ id: newId(), ka: '', en: '' });
  render();
  scheduleSave();
}

function moveGroup(group, dir) {
  const i = state.groups.indexOf(group);
  const j = i + dir;
  if (j < 0 || j >= state.groups.length) return;
  [state.groups[i], state.groups[j]] = [state.groups[j], state.groups[i]];
  render();
  scheduleSave();
}

function removeGroup(group) {
  if (state.groups.length === 1) return;
  if (!confirm(tr('removeGroupConfirm'))) return;
  state.groups = state.groups.filter((g) => g !== group);
  state.links = state.links.filter((l) => l.group !== group.id);
  render();
  scheduleSave();
}

async function setLang(next) {
  state.settings.lang = next;
  lang = resolveLang(next);
  tr = t(lang);
  render();
  await setState(state);
}

/* ---------------------------------------------------------- import/export */

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'qgis-ge-launcher-links.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

async function importJson(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed || !Array.isArray(parsed.links)) throw new Error('shape');
    await setState(parsed);
    state = await getState();
    lang = resolveLang(state.settings.lang);
    tr = t(lang);
    render();
    toast(tr('saved'));
  } catch {
    toast(tr('importFailed'), true);
  }
}

/* ----------------------------------------------------------------- events */

$('add-group').addEventListener('click', addGroup);
$('lang-ka').addEventListener('click', () => setLang('ka'));
$('lang-en').addEventListener('click', () => setLang('en'));
$('btn-export').addEventListener('click', exportJson);
$('btn-import').addEventListener('click', () => $('file-import').click());
$('file-import').addEventListener('change', (ev) => {
  const file = ev.target.files?.[0];
  if (file) importJson(file);
  ev.target.value = '';
});
$('btn-reset').addEventListener('click', async () => {
  if (!confirm(tr('resetConfirm'))) return;
  state = freshState();
  await setState(state);
  lang = resolveLang(state.settings.lang);
  tr = t(lang);
  render();
  toast(tr('saved'));
});

window.addEventListener('beforeunload', () => {
  if (saveTimer) { clearTimeout(saveTimer); setState(state); }
});

(async function init() {
  state = await getState();
  lang = resolveLang(state.settings.lang);
  tr = t(lang);
  render();
}());
