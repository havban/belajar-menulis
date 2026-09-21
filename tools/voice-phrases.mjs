// Lists every phrase the app can say, with the filename its recording must
// use. Run it after changing js/lines.js:
//
//   node tools/voice-phrases.mjs > voice/PHRASES.md
//
// Anything not recorded simply falls back to the device's own voice, so a pack
// can be built up a handful of phrases at a time.

import { allChars, spokenName, shortName, wordOf } from '../js/glyphs.js';
import * as L from '../js/lines.js';

const core = new Map();       // filename -> text
const extra = new Map();

const add = (into, parts) => {
  for (const p of parts.flat()) {
    if (!p) continue;
    const text = typeof p === 'string' ? p : p.text;
    if (!text) continue;
    into.set(L.clipName(text), text);
  }
};

const names = allChars().map(spokenName);

for (const n of names) {
  for (const t of L.ASK) add(core, t(n));
  for (const t of L.ASK_NEXT) add(core, t(n));
  for (const t of L.CALL) add(core, t(n));
  for (const t of L.DONE) for (const k of [1, 2, 3, 4]) add(core, t(n, L.TIMES(k)));
}
for (const t of L.MORE) for (const k of [1, 2, 3]) add(core, t(k));
for (const t of L.HIT) add(core, t);
for (const t of L.OUCH) add(core, t);
add(core, L.GAME_OVER);
for (let lv = 2; lv <= 9; lv++) add(core, L.LEVEL(lv));

// The "listen" button says the example word too - nice to have, not essential.
for (const ch of allChars()) {
  for (const t of L.HEAR) add(extra, t(spokenName(ch), wordOf(ch).word, shortName(ch)));
}
for (const k of core.keys()) extra.delete(k);

const table = (m) => [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  .map(([file, text]) => `| \`${file}\` | ${text} |`).join('\n');

console.log(`# Daftar rekaman suara

Dibuat oleh \`node tools/voice-phrases.mjs\`. Setiap baris = satu berkas rekaman
pendek. Simpan di folder \`voice/\` dengan nama persis seperti kolom pertama,
lalu jalankan \`tools/voice-manifest.sh\`.

Ucapkan dengan nada ceria dan tempo santai, seperti guru TK. Jangan sisakan
hening panjang di awal/akhir rekaman.

## Inti (${core.size} rekaman)

Ini yang diucapkan berulang-ulang sepanjang aplikasi.

| Nama berkas | Diucapkan |
|---|---|
${table(core)}

## Tambahan (${extra.size} rekaman)

Hanya terdengar saat anak menekan tombol 🔊 Dengar. Boleh dilewati - bagian ini
akan memakai suara bawaan perangkat.

| Nama berkas | Diucapkan |
|---|---|
${table(extra)}
`);
