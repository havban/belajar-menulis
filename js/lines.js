// Every sentence the app says out loud, in one place.
//
// A line is a list of parts, each spoken separately: that gives a real pause
// between the invitation and the letter, and lets the letter be said slower.
// Parts carry no punctuation around the letter name - the pause does that work
// - so one recording of "huruf be besar" serves every sentence it appears in.
//
// Keeping the tables here also means `tools/voice-phrases.mjs` can list exactly
// what a voice pack needs to record.

// Filename a phrase is recorded under: lower case, accents stripped, anything
// that is not a letter or digit becomes a dash.
//   "Ayo, kita tulis" -> ayo-kita-tulis
export function clipName(text) {
  return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// the letter itself: slower and a touch brighter than the words around it
const N = (name) => ({ text: name, rate: 0.85, pitch: 1.18 });
const UP = (text) => ({ text, pitch: 1.26 });

// Invitations used when a letter is chosen from the strip or a new set opens.
export const ASK = [
  (n) => ['Ayo, kita tulis', N(n)],
  (n) => ['Sekarang,', N(n), UP('Ayo tulis!')],
  (n) => ['Coba tulis', N(n), 'ya.'],
  (n) => [UP('Yuk!'), 'Kita tulis', N(n)],
  (n) => ['Ini', N(n), 'Ayo kita tulis sama-sama.'],
  (n) => ['Sekarang giliran', N(n)],
  (n) => ['Siap? Kita tulis', N(n)],
  (n) => ['Perhatikan ya,', 'ini', N(n)],
];

// Invitations used straight after a letter was finished, so the app sounds
// like it noticed what just happened instead of starting from nothing.
export const ASK_NEXT = [
  (n) => [UP('Hebat!'), 'Sekarang', N(n)],
  (n) => ['Lanjut, tulis', N(n)],
  (n) => [UP('Keren!'), 'Sekarang giliran', N(n)],
  (n) => [UP('Bagus!'), 'Kita lanjut ke', N(n)],
  (n) => [UP('Pintar!'), 'Ayo lanjut,', N(n)],
  (n) => ['Kamu hebat!', 'Sekarang coba', N(n)],
  (n) => [UP('Wah, pintar!'), 'Lanjut ke', N(n)],
];

// The "listen" button: the letter, then the example word.
export const HEAR = [
  (n, w, s) => [N(n), `${s} untuk ${w}.`],
  (n, w, s) => ['Ini', N(n), `${s}, seperti ${w}.`],
  (n, w, s) => [N(n), `${w}, diawali ${s}.`],
];

// One practice box finished, more left on the page.
export const MORE = [
  (k) => [UP('Bagus!'), k === 1 ? 'Sekali lagi ya.' : `${k} kali lagi.`],
  (k) => [UP('Mantap!'), k === 1 ? 'Tinggal satu lagi.' : `Tinggal ${k} lagi.`],
  (k) => ['Rapi sekali.', k === 1 ? 'Ayo, satu lagi!' : `Ayo, ${k} kali lagi!`],
  (k) => [UP('Pintar!'), k === 1 ? 'Satu lagi ya.' : `Kurang ${k} lagi ya.`],
];

// The whole letter (or the whole page of them) is done.
export const DONE = [
  (n, t) => [UP('Hebat!'), 'Kamu berhasil menulis', N(n), t],
  (n, t) => [UP('Wah, pintar!'), N(n), 'sudah selesai', t],
  (n, t) => [UP('Keren sekali!'), 'Tulisan', N(n), 'kamu bagus', t],
  (n, t) => [UP('Bagus sekali!'), 'Kamu sudah bisa', N(n), t],
  (n, t) => [UP('Luar biasa!'), 'Rapi sekali tulisan', N(n), 'kamu', t],
  (n, t) => [UP('Mantap!'), 'Satu lagi selesai,', N(n), t],
];

// Game: the call, the hit, the miss.
export const CALL = [
  (n) => ['Tulis', N(n)],
  (n) => [UP('Cepat!'), 'Tulis', N(n)],
  (n) => ['Sekarang', N(n)],
  (n) => ['Awas, musuh datang!', 'Tulis', N(n)],
  (n) => ['Ayo, lawan dia!', 'Tulis', N(n)],
];
export const HIT = [
  [UP('Kena!')], [UP('Mantap!')], [UP('Hebat!')], ['Kena! Bagus sekali.'], [UP('Keren!'), 'Terus begitu.'],
];
export const OUCH = [
  ['Aduh! Ayo coba lagi.'], ['Wah, kena. Semangat!'], [UP('Hampir!'), 'Ayo coba lagi.'], ['Jangan menyerah ya.'],
];
export const LEVEL = (lv) => [UP(`Level ${lv}!`), 'Kamu hebat!'];
export const GAME_OVER = ['Permainan selesai.'];

// Suffix spoken after "... 3 kali" when a page had repetitions.
export const TIMES = (n) => (n > 1 ? `${n} kali.` : '');
