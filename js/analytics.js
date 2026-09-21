/**
 * Usage statistics - two independent halves, ported from Rhino Rex.
 *
 *  1. A local tally in localStorage. Always on, never leaves the device.
 *     Open it with ?stats=1, or call window.__stats() in the console.
 *
 *  2. Aggregate counters sent to GoatCounter. The official snippet lives in
 *     index.html:
 *
 *       <script data-goatcounter="https://havban.goatcounter.com/count"
 *               async src="//gc.zgo.at/count.js"></script>
 *
 *     That script counts the page view by itself; this module adds the custom
 *     events through window.goatcounter.count(). The endpoint is read from the
 *     tag, so it is configured in exactly one place.
 *
 * GoatCounter sets no cookies and honours Do Not Track. Remove the tag from
 * index.html to switch the whole aggregate half off; the local panel keeps
 * working. To send somewhere else instead, set
 * window.__bmTrack = (path, title, isEvent) => {...}.
 *
 * Dashboard: https://havban.goatcounter.com
 */

const SITE_TITLE = 'Belajar Menulis';
const SCRIPT_TIMEOUT = 6000;     // if count.js never arrives, fall back to a pixel

/**
 * Every custom event is namespaced. The GoatCounter site is shared with the
 * other games, where an unprefixed `level-3` or `game-selesai` would be
 * indistinguishable from this app's. A path-shaped prefix also lets the
 * dashboard filter this app in or out with one term.
 *
 * Page views are *not* prefixed: their path is the real URL, which is how
 * GoatCounter tells pages apart already.
 */
const EVENT_PREFIX = 'belajar-menulis/';

let blocked = false;
const queue = [];

const doNotTrack = () =>
  navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;

// count.js ignores localhost by itself; the pixel fallback below would not, and
// a development session should never show up on the dashboard.
const isLocal = () =>
  location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\]|.*\.local)$/.test(location.hostname);

/** The /count URL, taken from the GoatCounter script tag in index.html. */
function endpoint() {
  const tag = document.querySelector('script[data-goatcounter]');
  return tag ? tag.getAttribute('data-goatcounter') : '';
}

const scriptReady = () => typeof window.goatcounter?.count === 'function';

// Last-ditch path: the script was blocked, so hit the endpoint directly.
function pixel(path, title, isEvent) {
  const url = endpoint();
  if (!url || doNotTrack() || isLocal()) return;
  try {
    const u = new URL(url);
    u.searchParams.set('p', path);
    u.searchParams.set('t', title || path);
    if (isEvent) u.searchParams.set('e', 'true');
    u.searchParams.set('r', document.referrer || '');
    u.searchParams.set('s', [screen.width, screen.height, devicePixelRatio || 1].join(','));
    u.searchParams.set('rnd', Math.random().toString(36).slice(2, 10));
    new Image().src = u.toString();
  } catch (e) { /* analytics must never break the lesson */ }
}

function deliver(path, title, isEvent) {
  if (window.__bmTrack) { window.__bmTrack(path, title, isEvent); return; }
  if (scriptReady()) { window.goatcounter.count({ path, title: title || path, event: isEvent }); return; }
  if (blocked) { pixel(path, title, isEvent); return; }
  queue.push([path, title, isEvent]);
}

function flush() {
  while (queue.length) {
    const [path, title, isEvent] = queue.shift();
    if (window.__bmTrack) window.__bmTrack(path, title, isEvent);
    else if (scriptReady()) window.goatcounter.count({ path, title: title || path, event: isEvent });
    else pixel(path, title, isEvent);
  }
}

/** Waits for count.js, then drains anything logged while it loaded. */
export function install() {
  if (scriptReady()) { flush(); return; }
  const started = Date.now();
  const tick = () => {
    if (scriptReady()) { flush(); return; }
    if (Date.now() - started > SCRIPT_TIMEOUT) {
      blocked = true;                 // ad blocker, offline, or no tag at all
      if (endpoint() && !window.__bmTrack) pixel(location.pathname || '/', SITE_TITLE, false);
      flush();
      return;
    }
    setTimeout(tick, 250);
  };
  tick();
}

export function event(name, title) {
  deliver(EVENT_PREFIX + name, title || name, true);
}

/** The namespace the dashboard can filter on. Exported for tests. */
export const prefix = EVENT_PREFIX;

// Events that describe a session rather than a moment - which screens were
// opened, which practice count was chosen - fire at most once per page load,
// or a child tapping around would drown the dashboard.
const fired = new Set();
export function once(name, title) {
  if (fired.has(name)) return false;
  fired.add(name);
  event(name, title);
  return true;
}

const STATS_KEY = 'bm.stats';
const VISIT_KEY = 'bm.visit';
const NAME_KEY = 'bm.name-sent';

// ---------------------------------------------------------------- buckets --
// Sent as event names, so the dashboard shows a distribution instead of a long
// tail of unique numbers.
const scoreBucket = (s) =>
  s >= 2000 ? '2000+' : s >= 1000 ? '1000-1999' : s >= 500 ? '500-999'
  : s >= 200 ? '200-499' : s >= 50 ? '50-199' : 'bawah-50';

const levelBucket = (l) => (l >= 7 ? '7-9' : l >= 4 ? '4-6' : String(l));

// ---------------------------------------------------------------- visitors --
/**
 * GoatCounter already de-duplicates *visits* server-side. What it cannot know
 * is whether a browser has been here before, so we add that ourselves: a
 * first-seen date, a last-seen date and a count of distinct days - no
 * identifier - and at most one pair of events per device per day.
 */
const dayBucket = (days) =>
  days >= 20 ? '20+' : days >= 6 ? '6-19' : days >= 2 ? '2-5' : '1';

function readVisit() {
  try {
    const raw = JSON.parse(localStorage.getItem(VISIT_KEY) || 'null');
    if (raw && raw.first && raw.last) return raw;
  } catch (e) { /* private mode */ }
  return null;
}

export function visitor() {
  return readVisit() || { first: null, last: null, days: 0 };
}

/** Call once per page load. Returns the (updated) visitor record. */
export function trackVisitor() {
  const today = new Date().toISOString().slice(0, 10);
  const prev = readVisit();
  let rec, fire = null;

  if (!prev) {
    rec = { first: today, last: today, days: 1 };
    fire = ['pengunjung-baru', 'Pengunjung baru'];
  } else if (prev.last !== today) {
    rec = { first: prev.first, last: today, days: (prev.days || 1) + 1 };
    fire = ['pengunjung-kembali', 'Pengunjung kembali'];
  } else {
    return prev;                       // already counted today; stay quiet
  }

  try { localStorage.setItem(VISIT_KEY, JSON.stringify(rec)); } catch (e) { /* ignore */ }
  event(fire[0], fire[1]);
  if (rec.days > 1) event(`hari-aktif-${dayBucket(rec.days)}`, `Hari aktif: ${dayBucket(rec.days)}`);
  return rec;
}

// -------------------------------------------------------------------- name --
/**
 * The name the child typed, sent once per name. It is the one thing here that
 * is not a plain counter, so it is deliberately the only place a value from
 * the user reaches the dashboard: it is sent when it changes, never on every
 * load, and the event carries nothing else. Delete this call (or the
 * GoatCounter tag) to stop it.
 */
export function trackName(name) {
  const who = String(name || '').trim();
  if (!who) { once('nama-dilewati', 'Nama tidak diisi'); return false; }
  let sent = '';
  try { sent = localStorage.getItem(NAME_KEY) || ''; } catch (e) { /* ignore */ }
  if (sent === who) return false;
  try { localStorage.setItem(NAME_KEY, who); } catch (e) { /* ignore */ }
  event(`nama/${who}`, `Nama anak: ${who}`);
  return true;
}

// ------------------------------------------------------------ local tally --
const EMPTY = {
  firstSeen: null, letters: 0, stars: 0, pages: 0,
  runs: 0, gameScore: 0, bestScore: 0, bestLevel: 0, defeated: 0, seconds: 0,
  sets: { kapital: 0, kecil: 0, angka: 0 },
};

export function stats() {
  try {
    const raw = JSON.parse(localStorage.getItem(STATS_KEY) || 'null');
    return raw ? { ...EMPTY, ...raw, sets: { ...EMPTY.sets, ...(raw.sets || {}) } } : { ...EMPTY };
  } catch (e) {
    return { ...EMPTY };
  }
}

function writeStats(s) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch (e) { /* private mode */ }
}

export function resetStats() {
  writeStats({ ...EMPTY });
  for (const k of [VISIT_KEY, NAME_KEY]) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
}

const touch = (s) => { s.firstSeen = s.firstSeen || new Date().toISOString().slice(0, 10); return s; };

/** One finished letter: which set it belonged to, how many stars, how many copies. */
export function recordLetter({ set, stars: got, repeat }) {
  const s = touch(stats());
  s.letters += 1;
  s.stars += got || 0;
  s.pages += repeat || 1;
  if (s.sets[set] !== undefined) s.sets[set] += 1;
  writeStats(s);
  event('huruf-selesai', 'Huruf selesai ditulis');
  event(`bintang-${got || 1}`, `Bintang: ${got || 1}`);
  if (repeat > 1) once(`latihan-${repeat}x`, `Latihan ${repeat}× per halaman`);
  once(`set-${set}`, `Membuka kelompok: ${set}`);
  return s;
}

/** One finished game. */
export function recordGame({ score, level, defeated, seconds }) {
  const s = touch(stats());
  s.runs += 1;
  s.gameScore += score || 0;
  s.defeated += defeated || 0;
  s.seconds += Math.round(seconds || 0);
  s.bestScore = Math.max(s.bestScore, score || 0);
  s.bestLevel = Math.max(s.bestLevel, level || 1);
  writeStats(s);
  event('game-selesai', 'Permainan selesai');
  event(`skor-${scoreBucket(score || 0)}`, `Skor: ${scoreBucket(score || 0)}`);
  event(`level-${levelBucket(level || 1)}`, `Level tercapai: ${levelBucket(level || 1)}`);
  return s;
}

// ------------------------------------------------------------ debug panel --
const fmtTime = (sec) => {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  return h ? `${h}j ${m}m` : `${m}m ${sec % 60}d`;
};

export function renderPanel(el) {
  const s = stats();
  const v = visitor();
  const row = (k, val) => `<tr><td>${k}</td><td class="num">${val}</td></tr>`;
  el.innerHTML = `
    <h4>Statistik lokal <button id="stats-close" title="Tutup">×</button></h4>
    <table>
      ${row('Sejak', v.first || s.firstSeen || '—')}
      ${row('Kunjungan terakhir', v.last || '—')}
      ${row('Hari aktif', v.days || 0)}
      ${row('Huruf selesai', s.letters)}
      ${row('&nbsp;&nbsp;kapital', s.sets.kapital)}
      ${row('&nbsp;&nbsp;kecil', s.sets.kecil)}
      ${row('&nbsp;&nbsp;angka', s.sets.angka)}
      ${row('Kotak ditulis', s.pages)}
      ${row('Bintang', s.stars)}
      ${row('Permainan', s.runs)}
      ${row('Waktu main', fmtTime(s.seconds))}
      ${row('Musuh dikalahkan', s.defeated)}
      ${row('Skor terbaik', (s.bestScore || 0).toLocaleString('id-ID'))}
      ${row('Level terbaik', s.bestLevel)}
    </table>
    <button id="stats-reset">Reset statistik</button>
    <p>${endpoint()
      ? `Kiriman agregat: ${endpoint()}<br>Awalan event: <code>${EVENT_PREFIX}</code>`
      : 'Kiriman agregat: nonaktif (tag GoatCounter tidak ada)'}</p>`;
  el.querySelector('#stats-close').onclick = () => el.remove();
  el.querySelector('#stats-reset').onclick = () => { resetStats(); renderPanel(el); };
}

export function mountPanel() {
  let el = document.getElementById('statspanel');
  if (!el) {
    el = document.createElement('div');
    el.id = 'statspanel';
    document.body.appendChild(el);
  }
  renderPanel(el);
  return el;
}
