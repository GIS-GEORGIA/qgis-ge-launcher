/* Development-only stub of the small slice of the chrome.* API the popup and
 * options page use, so both can be opened in a plain browser tab over http://
 * without installing the extension. Never shipped — tools/build.py excludes
 * this whole folder from the packaged ZIP. */
(function () {
  const KEY = 'devshim:';
  const listeners = [];

  function area(name) {
    return {
      async get(key) {
        const raw = localStorage.getItem(KEY + name + ':' + key);
        return raw ? { [key]: JSON.parse(raw) } : {};
      },
      async set(obj) {
        for (const [k, v] of Object.entries(obj)) {
          localStorage.setItem(KEY + name + ':' + k, JSON.stringify(v));
          listeners.forEach((fn) => fn({ [k]: { newValue: v } }, name));
        }
      },
      async remove(key) { localStorage.removeItem(KEY + name + ':' + key); },
      async clear() {
        Object.keys(localStorage)
          .filter((k) => k.startsWith(KEY + name + ':'))
          .forEach((k) => localStorage.removeItem(k));
      },
    };
  }

  window.chrome = {
    storage: {
      sync: area('sync'),
      local: area('local'),
      onChanged: { addListener: (fn) => listeners.push(fn) },
    },
    i18n: { getUILanguage: () => navigator.language },
    tabs: {
      async create({ url }) { console.info('[shim] tabs.create', url); },
      async query() { return [{ id: 1 }]; },
      async update(id, { url }) { console.info('[shim] tabs.update', url); },
    },
    runtime: {
      openOptionsPage() { location.href = './options.html'; },
    },
  };

  // The real popup closes itself after opening a link; keep the dev page alive.
  window.close = () => console.info('[shim] window.close()');
}());
