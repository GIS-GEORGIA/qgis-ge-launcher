// Thin wrapper over chrome.storage. Uses `sync` so the link list follows the
// user between signed-in Chromium profiles, and falls back to `local` when the
// sync quota is exceeded or the browser has sync disabled.

import {
  SCHEMA_VERSION, DEFAULT_GROUPS, DEFAULT_LINKS, DEFAULT_SETTINGS,
} from './defaults.js';

const KEY = 'state';

// Tags every write with the id of the page that made it, so a page never
// re-applies its own echo from chrome.storage.onChanged. Without this, two
// quick edits race: the change event for the first write arrives after the
// second local mutation and silently reverts it.
const WRITER = Math.random().toString(36).slice(2);
let writeSeq = 0;

async function rawGet() {
  const areas = [chrome.storage.sync, chrome.storage.local];
  for (const area of areas) {
    try {
      const got = await area.get(KEY);
      if (got && got[KEY]) return got[KEY];
    } catch { /* area unavailable — try the next one */ }
  }
  return null;
}

async function rawSet(state) {
  try {
    await chrome.storage.sync.set({ [KEY]: state });
    // Keep a local mirror so a later sync failure never loses the list.
    try { await chrome.storage.local.set({ [KEY]: state }); } catch {}
    return 'sync';
  } catch {
    await chrome.storage.local.set({ [KEY]: state });
    return 'local';
  }
}

export function freshState() {
  return {
    schema: SCHEMA_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    groups: DEFAULT_GROUPS.map((g) => ({ ...g })),
    links: DEFAULT_LINKS.map((l) => ({ ...l })),
  };
}

export function newId() {
  return 'l' + Math.random().toString(36).slice(2, 9);
}

function migrate(state) {
  if (!state || typeof state !== 'object') return freshState();
  const out = {
    schema: SCHEMA_VERSION,
    settings: { ...DEFAULT_SETTINGS, ...(state.settings || {}) },
    groups: Array.isArray(state.groups) && state.groups.length
      ? state.groups.map((g) => ({ id: g.id || newId(), ka: g.ka || g.en || '', en: g.en || g.ka || '' }))
      : DEFAULT_GROUPS.map((g) => ({ ...g })),
    links: Array.isArray(state.links) ? state.links : [],
  };
  // Re-home links whose group was deleted, and drop malformed entries.
  const ids = new Set(out.groups.map((g) => g.id));
  out.links = out.links
    .filter((l) => l && typeof l.url === 'string' && l.url)
    .map((l) => ({
      id: l.id || newId(),
      group: ids.has(l.group) ? l.group : out.groups[0].id,
      url: l.url,
      ka: l.ka || l.en || l.url,
      en: l.en || l.ka || l.url,
      color: Number.isInteger(l.color) ? l.color : 0,
      tags: typeof l.tags === 'string' ? l.tags : '',
      pinned: !!l.pinned,
    }));
  return out;
}

export async function getState() {
  return migrate(await rawGet());
}

export async function setState(state) {
  const next = migrate(state);
  next.writer = `${WRITER}:${++writeSeq}`;
  return rawSet(next);
}

export function onChange(handler) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' && area !== 'local') return;
    const entry = changes[KEY];
    if (!entry || !entry.newValue) return;
    if (String(entry.newValue.writer || '').startsWith(`${WRITER}:`)) return;
    handler(migrate(entry.newValue));
  });
}

/** Normalise user input into an openable http/https URL, or '' if unusable. */
export function normalizeUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return '';   // refuse javascript:, data:, file:, …
  return 'https://' + s.replace(/^\/+/, '');
}

export function hostOf(url) {
  try { return new URL(url).host.replace(/^www\./, ''); } catch { return url; }
}
