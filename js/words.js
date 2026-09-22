// Words and simple sentences for the writing game, in four steps.
//
// Everything here is written the way a child would meet it in class: lower
// case for single words, a capital at the start of a sentence, and only
// letters the app can teach (no hyphens, no punctuation - there is no glyph
// for a full stop, and a letter the child cannot be shown is a dead end).
//
// The emoji is the whole picture: it has to say the word on its own to a
// five-year-old who cannot read it yet.

export const LEVELS = [
  {
    id: 'pendek',
    label: '3 huruf',
    title: 'Kata Pendek',
    hint: 'Kata pendek, tiga huruf saja.',
    items: [
      ['ibu', '👩'], ['api', '🔥'], ['ubi', '🍠'], ['tas', '🎒'], ['kue', '🍰'],
      ['mie', '🍜'], ['jam', '⏰'], ['dua', '✌️'], ['rok', '👗'], ['sup', '🍲'],
    ],
  },
  {
    id: 'harian',
    label: '4 huruf',
    title: 'Kata Sehari-hari',
    hint: 'Kata yang sering kamu lihat di rumah.',
    items: [
      ['bola', '⚽'], ['buku', '📕'], ['meja', '🪑'], ['susu', '🥛'], ['mata', '👁️'],
      ['kaki', '🦶'], ['gigi', '🦷'], ['ayam', '🐔'], ['kuda', '🐴'], ['sapi', '🐄'],
      ['topi', '👒'], ['baju', '👕'], ['roti', '🍞'], ['nasi', '🍚'], ['bayi', '👶'],
    ],
  },
  {
    id: 'panjang',
    label: '5-6 huruf',
    title: 'Kata Lebih Panjang',
    hint: 'Lima sampai enam huruf. Pelan-pelan ya!',
    items: [
      ['bunga', '🌸'], ['mobil', '🚗'], ['kelas', '🏫'], ['jeruk', '🍊'], ['kapal', '🚢'],
      ['pintu', '🚪'], ['gajah', '🐘'], ['kucing', '🐱'], ['pisang', '🍌'], ['sepatu', '👟'],
      ['wortel', '🥕'], ['payung', '☂️'],
    ],
  },
  {
    id: 'kalimat',
    label: 'Kalimat',
    title: 'Kalimat Sederhana',
    hint: 'Satu kata dulu, lalu kata berikutnya.',
    sentence: true,
    items: [
      ['Ini bola', '⚽'], ['Itu buku', '📕'], ['Ibu masak', '🍳'], ['Aku suka susu', '🥛'],
      ['Adik main bola', '⚽'], ['Saya sayang ibu', '❤️'], ['Budi baca buku', '📖'],
      ['Kakak beli roti', '🍞'], ['Ayah baca koran', '📰'], ['Kita pergi ke kelas', '🏫'],
    ],
  },
];

export const levelOf = (id) => LEVELS.find((l) => l.id === id) || LEVELS[0];

/** Every word the app can ask for, once - used by the voice-pack script. */
export function allTexts() {
  return LEVELS.flatMap((l) => l.items.map(([text]) => text));
}
