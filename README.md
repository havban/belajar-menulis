# Belajar Menulis — Petualangan Dino 🦖✏️

Aplikasi web untuk anak **TK dan SD** yang sedang belajar menulis huruf dan
angka. Anak menulis langsung di layar sentuh — tablet atau handphone — dengan
jari atau stylus, ditemani dinosaurus, warna-warni, dan musik yang ceria.

**Mainkan di:** <https://havban.github.io/belajar-menulis/>

Tidak perlu dipasang, tidak perlu daftar, dan tidak ada iklan. Setelah sekali
dibuka, aplikasi ini juga bisa dipakai **tanpa internet**.

---

## Apa saja isinya

### 1. Belajar Menulis (tutorial)

* **62 huruf dan angka**: A–Z (kapital), a–z (huruf kecil), dan 0–9.
* Setiap huruf punya **urutan goresan yang benar** seperti yang diajarkan di
  sekolah — dari atas ke bawah, kiri ke kanan, lingkaran berlawanan arah jarum
  jam.
* Tombol **👀 Contoh** memperagakan cara menulisnya: titik bercahaya berjalan
  mengikuti garis, satu goresan demi satu goresan.
* Garis bantu tebal, **titik hijau bernomor** sebagai tempat mulai, dan panah
  penunjuk arah. Ada juga garis buku tulis (garis atas, garis tengah, garis
  dasar, dan garis ekor huruf seperti g dan y).
* Tinta anak berwarna cerah — setiap goresan warnanya berbeda — lengkap dengan
  percikan bintang yang mengikuti jari.
* Setiap huruf disertai contoh kata yang akrab untuk anak: **A untuk Ayam**,
  **B untuk Bola**, **D untuk Dinosaurus**, dan seterusnya.
* Tombol **🔊 Dengar** membacakan nama huruf dan contoh katanya dalam bahasa
  Indonesia (memakai suara bawaan perangkat).

### 2. Main Game — Petualangan Dino

Belajar sambil bermain: dino hijau berlari, lalu **musuh datang** (raptor
merah, pterodactyl, atau bos ungu). Satu-satunya cara melawan adalah
**menulis huruf yang diminta dengan benar**. Kalau tulisannya bagus, dino
mengaum dan menerjang musuh sampai terpental — kalau waktunya habis, satu
hati berkurang. Ada 3 hati, skor, dan level yang makin menantang:

| Level | Yang berubah |
|-------|--------------|
| 1–2   | Huruf kapital, garis bantu penuh, waktu paling longgar |
| 3     | Angka ikut muncul, garis bantu mulai disamarkan |
| 4+    | Huruf kecil ikut muncul, waktu makin singkat, penilaian makin teliti |

Skor terbaik disimpan di perangkat.

### 3. Penghargaan

Setiap huruf yang berhasil ditulis mendapat **1–3 bintang**, tergantung
kerapiannya. Saat berhasil: konfeti, bintang beterbangan, kata pujian
("Hebat!", "Pintar!"), suara riang, dan dino kecil di samping layar ikut
melompat gembira. Bintang tidak pernah berkurang — percobaan berikutnya hanya
bisa menambah.

---

## Untuk orang tua dan guru

* **Cara memegang layar.** Aplikasi mengabaikan sentuhan kedua, jadi telapak
  tangan yang menempel di layar tidak akan mengacaukan tulisan.
* **Penilaiannya ramah anak.** Tangan anak TK memang goyang, jadi garis yang
  bergelombang tetap diterima — tetapi yang dinilai betul adalah **arah dan
  urutan goresan**. Menulis dari bawah ke atas, memulai dari tempat yang salah,
  atau berhenti di tengah jalan akan diminta diulang, karena itulah kebiasaan
  yang sedang dilatih. Kerapian menentukan jumlah bintang, bukan lulus atau
  tidaknya.
* **Kalau anak salah dua kali berturut-turut**, contoh cara menulis akan
  diperagakan ulang secara otomatis.
* **Suara.** Musik, efek suara, dan suara guru bisa dimatikan sendiri-sendiri
  lewat tombol ⚙️. Suara guru memakai pembaca teks bawaan perangkat; kalau
  perangkat tidak punya suara bahasa Indonesia, bagian ini diam saja dan
  aplikasi tetap berjalan normal.
* **Layar penuh.** Di ⚙️ ada pilihan layar penuh supaya jari kecil tidak
  tidak sengaja menekan tombol-tombol peramban.
* **Pasang di layar depan.** Di Chrome atau Safari, pilih "Tambahkan ke layar
  utama" agar aplikasi terbuka seperti aplikasi biasa dan bisa dipakai offline.
* **Menghapus bintang** (misalnya untuk anak berikutnya) ada di ⚙️.

---

## Menjalankan di komputer sendiri

Tidak ada proses *build*, tidak ada dependensi. Cukup layani foldernya lewat
server web apa pun:

```bash
git clone https://github.com/havban/belajar-menulis.git
cd belajar-menulis
python3 -m http.server 8000
# lalu buka http://localhost:8000
```

Membuka `index.html` langsung dari berkas (`file://`) **tidak** bekerja, karena
aplikasi ini memakai modul ES.

---

## Struktur proyek

```
index.html          semua layar: menu, belajar, game, pengaturan
css/style.css       tata letak dan warna, termasuk mode potret & lanskap
js/glyphs.js        bentuk 62 huruf & angka: urutan dan arah goresan
js/trace.js         papan tulis: menggambar panduan, menangkap jari, menilai
js/dino.js          semua gambar — dinosaurus dan pemandangan, digambar kode
js/mascot.js        dino kecil yang menemani dan ikut bersorak
js/tutor.js         layar belajar
js/game.js          layar permainan
js/audio.js         musik dan efek suara (dibangkitkan, bukan berkas audio)
js/fx.js            konfeti, bintang, kata pujian
js/progress.js      penyimpanan bintang & skor di perangkat
js/main.js          latar belakang, perpindahan layar, pengaturan
sw.js               agar bisa dipakai tanpa internet
```

Seluruh gambar dan suara **dibuat oleh kode** — tidak ada satu pun berkas
gambar atau audio di dalam repo ini, sehingga aplikasinya ringan dan cepat
dibuka di perangkat sederhana.

## Lisensi

MIT — lihat [LICENSE](LICENSE). Silakan dipakai di sekolah, dimodifikasi, dan
dibagikan.
