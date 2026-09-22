// Lists every phrase the app can say, with the filename its recording must
// use. Run it after changing js/lines.js:
//
//   node tools/voice-phrases.mjs > voice/PHRASES.md
//
// Anything not recorded simply falls back to the device's own voice, so a pack
// can be built up a handful of phrases at a time.

import { allChars, spokenName, shortName, wordOf } from '../js/glyphs.js';
import * as L from '../js/lines.js';
import { allTexts } from '../js/words.js';

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
// The child's name is a part of its own; it cannot be part of a fixed pack, so
// it is passed as a marker here and dropped from the list.
const WHO = '\u0000';

for (const n of names) {
  for (const t of L.ASK) add(core, t(n));
  for (const t of L.ASK_NEXT) add(core, t(n));
  for (const t of L.CALL) add(core, t(n));
  for (const t of L.ASK_WHO) add(core, t(n, WHO));
  for (const t of L.ASK_NEXT_WHO) add(core, t(n, WHO));
  for (const t of L.CALL_WHO) add(core, t(n, WHO));
  for (const k of [1, 2, 3, 4]) {
    for (const t of L.DONE) add(core, t(n, L.TIMES(k)));
    for (const t of L.DONE_WHO) add(core, t(n, L.TIMES(k), WHO));
  }
}
for (const k of [1, 2, 3]) {
  for (const t of L.MORE) add(core, t(k));
  for (const t of L.MORE_WHO) add(core, t(k, WHO));
}
for (const t of L.HIT) add(core, t());
for (const t of L.OUCH) add(core, t());
for (const t of L.HIT_WHO) add(core, t(WHO));
for (const t of L.OUCH_WHO) add(core, t(WHO));
add(core, L.GAME_OVER);
add(core, ['Halo,', 'ayo kita belajar menulis!']);
for (let lv = 2; lv <= 9; lv++) add(core, L.LEVEL(lv));
core.delete('');

// The word game: every word and sentence it can ask for.
for (const text of allTexts()) {
  for (const t of L.WORD_ASK) add(extra, t(text));
  for (const t of L.WORD_DONE) add(extra, t(text));
}

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

Nama anak tidak ada di daftar ini karena berbeda-beda. Rekam saja satu berkas
berisi namanya, misalnya \`rani.m4a\` untuk "Rani" — aplikasi memakainya begitu
nama itu diisi di layar pengaturan.

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
