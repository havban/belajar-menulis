# Suara rekaman (opsional)

Aplikasi ini bisa memakai **suara rekaman** sebagai pengganti pembaca teks
bawaan perangkat. Kalau folder ini berisi rekaman, aplikasi memakainya; kalimat
yang belum direkam tetap diucapkan oleh suara bawaan perangkat. Jadi rekaman
bisa dicicil sedikit demi sedikit — tidak harus lengkap dulu.

Kenapa direkam? Suara bawaan perangkat berbeda-beda: sebagian tablet tidak punya
suara bahasa Indonesia sama sekali (dan aplikasi jadi diam), sebagian
melafalkan nama huruf dengan aneh. Rekaman suara asli — misalnya suara ayah,
ibu, atau guru — selalu sama di semua perangkat dan jauh lebih enak didengar
anak.

## Cara membuat

1. Buka daftar kalimatnya di [`PHRASES.md`](PHRASES.md) — dibuat ulang dengan
   `node tools/voice-phrases.mjs > voice/PHRASES.md`.
   * **Inti (134 rekaman)** — ini yang diucapkan berulang-ulang. Rekam bagian
     ini dulu.
   * **Tambahan (108 rekaman)** — hanya untuk tombol 🔊 Dengar. Boleh dilewati.
2. Rekam tiap kalimat sebagai **satu berkas pendek** (aplikasi perekam di HP
   sudah cukup). Ucapkan ceria dan santai seperti guru TK, dan jangan sisakan
   hening panjang di awal atau akhir.
3. Simpan di folder ini dengan **nama persis** seperti kolom "Nama berkas",
   misalnya `huruf-be-besar.m4a`, `ayo-kita-tulis.m4a`.
4. Jalankan `tools/voice-manifest.sh` (tambahkan ekstensi bila bukan `m4a`,
   misalnya `tools/voice-manifest.sh mp3`). Skrip ini memperbarui
   `clips.json`, yaitu daftar yang dibaca aplikasi.
5. Muat ulang aplikasi. Di konsol peramban akan muncul `[suara] N rekaman
   dimuat`.

Format apa pun yang bisa diputar peramban boleh dipakai (`m4a`, `mp3`, `ogg`,
`wav`) — asal **semua** berkas memakai ekstensi yang sama dengan isi `"ext"` di
`clips.json`. Ukuran wajar: 15–40 KB per rekaman, jadi paket inti sekitar 3–5 MB.

## Yang perlu diperhatikan

* **Satu kalimat = satu berkas.** Aplikasi merangkai kalimat dari beberapa
  potongan, misalnya "Ayo, kita tulis" + jeda + "huruf be besar". Itu sebabnya
  nama huruf direkam tanpa tanda baca — satu rekaman `huruf-be-besar` dipakai
  oleh semua kalimat yang menyebutnya.
* **Jangan ubah nama berkas.** Aplikasi mencarinya dari kalimatnya sendiri:
  huruf kecil, tanda baca dibuang, spasi jadi tanda hubung.
* Rekaman ikut tersimpan untuk **mode offline** setelah sekali diputar.
* Berkas rusak atau hilang tidak membuat aplikasi macet — kalimat itu kembali
  diucapkan suara bawaan perangkat.
