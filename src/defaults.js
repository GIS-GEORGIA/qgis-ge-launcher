// Default groups and links shipped with the published extension.
//
// Keep this list PUBLIC — it is what every person who installs from the store
// sees on first run. Personal links belong in private/links.json, which is
// git-ignored, left out of the package, and imported once from the options
// page. tools/build.py refuses to package if anything from that file leaks
// back in here.
//
// Everything here is editable by the user; changing this file only affects a
// fresh install or an explicit "Restore defaults".

export const SCHEMA_VERSION = 1;

export const DEFAULT_GROUPS = [
  { id: 'qgisge', ka: 'qgis.ge ვებგვერდები', en: 'qgis.ge sites' },
];

// color: index into the tile palette (see ui.css --tile-N)
const L = (id, group, url, ka, en, color, tags = '') => ({
  id, group, url, ka, en, color, tags, pinned: false,
});

export const DEFAULT_LINKS = [
  L('qgisge',     'qgisge', 'https://qgis.ge/',
    'QGIS GEORGIA', 'QGIS GEORGIA', 1, 'qgis home'),
  L('plugins',    'qgisge', 'https://plugins.qgis.ge/',
    'პლაგინების რეპოზიტორია', 'Plugin repository', 1, 'qgis plugins repo'),
  L('osdoc',      'qgisge', 'https://osdoc.qgis.ge/',
    'GIS დოკუმენტაცია', 'Open-source GIS docs', 6, 'docs linux gis'),
];

export const DEFAULT_SETTINGS = {
  lang: 'auto',      // 'auto' | 'ka' | 'en'
  theme: 'auto',     // 'auto' | 'light' | 'dark'
  openIn: 'newtab',  // 'newtab' | 'current'
  density: 'grid',   // 'grid' | 'list'
};
