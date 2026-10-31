# SHORTS MAKER
## Blueprint Produk • MVP v1.0

**Tujuan:** Web editor untuk membuat video tren Top 5 secara otomatis.  
**Alur:** Upload 5 video → isi judul dan 5 deskripsi → preview → render → unduh MP4.

## 1. Ringkasan Produk

Shorts Maker membantu pengguna membuat video vertikal bergaya tren “Top 5”. Pengguna mengunggah tepat lima klip, menulis satu judul utama dan lima deskripsi, lalu sistem menyusun klip sesuai urutan dan merender satu file MP4.

| Elemen | Keputusan MVP |
|---|---|
| Platform | Web responsif, desktop-first |
| Target | Kreator Shorts/TikTok dan pengguna pemula |
| Jumlah klip | Tepat 5 video |
| Output | MP4, H.264 + AAC |
| Resolusi | 1080 × 1920 |
| Rasio | 9:16 |
| Frame rate | 30 fps |
| Bahasa | Indonesia |
| AI API | Tidak diperlukan |

## 2. Aturan Visual Mengikuti Tren

Preset bawaan mengikuti pola visual referensi:

- Judul utama di bagian atas, huruf kapital, tebal, kuning dengan outline hitam.
- Angka `1.`, `2.`, `3.`, `4.`, `5.` berada di sisi kiri dan selalu terlihat sejak awal sampai akhir.
- Warna angka: 1 hijau, 2 merah muda, 3 biru, 4 kuning, 5 oranye.
- Setiap angka memiliki satu deskripsi.
- Deskripsi nomor N muncul tepat saat klip nomor N dimulai.
- Deskripsi yang sudah muncul tetap terlihat sampai video selesai.
- Setiap deskripsi hanya dianimasikan sekali dengan efek pop-in singkat (250–350 ms).
- Video memenuhi kanvas 9:16 dengan crop-to-fill sebagai default.
- Audio asli klip dipertahankan secara default.

### Contoh timeline

| Waktu | Klip | Daftar yang terlihat |
|---|---|---|
| 00:00–00:05 | Video 1 | 1. Kembar 👯 |
| 00:05–00:10 | Video 2 | 1. Kembar 👯 · 2. Cantik ❤️ |
| 00:10–00:15 | Video 3 | Label 1, 2, dan 3 |
| 00:15–00:20 | Video 4 | Label 1 sampai 4 |
| 00:20–00:25 | Video 5 | Label 1 sampai 5 |

**Aturan utama:** angka tetap tampil dari awal. Deskripsi muncul bergiliran sesuai awal klip dan tidak menghilang setelah muncul.

## 3. Alur Pengguna

1. Pengguna membuka Shorts Maker.
2. Mengunggah tepat lima video.
3. Sistem menampilkan thumbnail, nama file, durasi, dan status validasi.
4. Pengguna mengubah urutan video dengan drag-and-drop atau tombol naik/turun.
5. Pengguna mengisi judul utama.
6. Pengguna mengisi deskripsi untuk nomor 1 sampai 5.
7. Pengguna mengatur trim awal/akhir jika fitur trim tersedia.
8. Pengguna melihat preview.
9. Pengguna menekan **Render Video** dan memantau progres.
10. Setelah selesai, pengguna memutar hasil dan mengunduh MP4.

## 4. Ruang Lingkup MVP

| Fitur | Prioritas | Catatan |
|---|---|---|
| Upload tepat 5 video | Wajib | Validasi jumlah, format, dan ukuran |
| Atur urutan klip | Wajib | Drag-and-drop |
| Input judul | Wajib | Maksimum 60 karakter |
| Input 5 deskripsi | Wajib | Satu per nomor, maksimum 30 karakter |
| Angka 1–5 selalu tampil | Wajib | Dari frame pertama |
| Deskripsi muncul satu kali | Wajib | Pada awal klip terkait |
| Deskripsi lama tetap tampil | Wajib | Sampai video selesai |
| Preview 9:16 | Wajib | Simulasi overlay |
| Render MP4 | Wajib | FFmpeg |
| Download hasil | Wajib | Setelah render selesai |
| Musik latar | Versi berikutnya | Perlu pengaturan mixing |
| Font/warna/posisi bebas | Versi berikutnya | MVP menggunakan preset |
| Akun dan cloud project | Versi berikutnya | Tidak perlu untuk MVP lokal |
| Template Top 3/Top 10 | Versi berikutnya | Fokus Top 5 dahulu |

## 5. Teknologi

| Lapisan | Teknologi | Kegunaan |
|---|---|---|
| Frontend | React + Vite + TypeScript | UI editor |
| Styling | Tailwind CSS | Layout responsif |
| Animasi UI | Framer Motion | Transisi dan preview |
| Drag-and-drop | dnd-kit | Mengurutkan klip |
| Backend | Node.js + Express + TypeScript | Upload dan job render |
| Video | FFmpeg + FFprobe | Validasi, gabung, crop, overlay |
| Validasi data | Zod | Validasi request |
| Storage MVP | Folder lokal sementara | File upload dan hasil render |

FFmpeg direkomendasikan untuk MVP karena tugas utamanya adalah normalisasi, menggabungkan klip, dan menambahkan overlay. Remotion bisa dipertimbangkan kelak jika komposisi React menjadi jauh lebih kompleks.

## 6. Arsitektur Sistem

```text
React Editor
    |
    v
Express API
    |
    v
Validasi Upload + FFprobe
    |
    v
Render Queue
    |
    v
FFmpeg Worker
    |
    v
MP4 Output
    |
    v
Download
```

Tanggung jawab komponen:

- **Frontend:** mengelola input, urutan klip, preview, dan status render.
- **API:** menerima upload, memvalidasi request, membuat job, dan menyediakan download.
- **FFprobe:** membaca durasi, resolusi, codec, dan metadata video.
- **Render worker:** menormalisasi klip, menggabungkan klip, dan menambahkan teks.
- **Storage:** menyimpan file sementara per job.
- **Cleanup:** menghapus file yang sudah kedaluwarsa.

## 7. Struktur Folder

```text
shorts-maker/
├─ client/
│  ├─ src/
│  │  ├─ components/
│  │  │  ├─ VideoUploader.tsx
│  │  │  ├─ ClipList.tsx
│  │  │  ├─ TitleEditor.tsx
│  │  │  ├─ RankingEditor.tsx
│  │  │  ├─ VideoPreview.tsx
│  │  │  ├─ RenderProgress.tsx
│  │  │  └─ DownloadPanel.tsx
│  │  ├─ pages/EditorPage.tsx
│  │  ├─ hooks/
│  │  ├─ lib/
│  │  ├─ types/
│  │  ├─ App.tsx
│  │  └─ main.tsx
│  └─ package.json
├─ server/
│  ├─ src/
│  │  ├─ routes/projects.ts
│  │  ├─ routes/renders.ts
│  │  ├─ services/upload.service.ts
│  │  ├─ services/validation.service.ts
│  │  ├─ services/ffmpeg.service.ts
│  │  ├─ services/cleanup.service.ts
│  │  ├─ workers/render.worker.ts
│  │  └─ index.ts
│  └─ package.json
├─ storage/
│  ├─ uploads/
│  ├─ jobs/
│  └─ outputs/
├─ fonts/
├─ docs/
├─ .env.example
├─ package.json
└─ README.md
```

## 8. Model Data Proyek

Contoh payload metadata proyek:

```json
{
  "title": "TOP 5 MAU KUKIS GAK?",
  "aspectRatio": "9:16",
  "resolution": { "width": 1080, "height": 1920 },
  "fps": 30,
  "clips": [
    { "order": 1, "fileId": "clip-1", "description": "Kembar 👯", "trimStart": 0, "trimEnd": null },
    { "order": 2, "fileId": "clip-2", "description": "Cantik ❤️", "trimStart": 0, "trimEnd": null },
    { "order": 3, "fileId": "clip-3", "description": "Lucu 😂", "trimStart": 0, "trimEnd": null },
    { "order": 4, "fileId": "clip-4", "description": "Pintar 🧠", "trimStart": 0, "trimEnd": null },
    { "order": 5, "fileId": "clip-5", "description": "Imut 🥰", "trimStart": 0, "trimEnd": null }
  ],
  "style": {
    "preset": "top-five-trend",
    "titleColor": "#FFF21A",
    "outlineColor": "#111111",
    "numberColors": ["#22E84A", "#F42D68", "#269BFA", "#F5E51B", "#F59E0B"],
    "labelAnimation": "pop-in-once",
    "keepPreviousLabels": true
  }
}
```

File video dikirim sebagai multipart upload; payload di atas berisi metadata dan ID file, bukan isi video.

## 9. Rancangan API

| Method & endpoint | Fungsi |
|---|---|
| `POST /api/projects` | Membuat proyek dan menerima lima file |
| `POST /api/projects/:id/validate` | Memvalidasi metadata dan file |
| `POST /api/projects/:id/render` | Memulai proses render |
| `GET /api/renders/:jobId` | Memeriksa status dan progres |
| `GET /api/renders/:jobId/download` | Mengunduh MP4 setelah selesai |
| `DELETE /api/projects/:id` | Menghapus proyek dan file sementara |

Status job:

```text
queued -> validating -> processing -> encoding -> completed
                                      \
                                       -> failed
```

Progress harus berasal dari status proses FFmpeg, bukan persentase palsu.

## 10. Spesifikasi Rendering FFmpeg

### Normalisasi

- Kanvas akhir: 1080 × 1920.
- Frame rate: 30 fps.
- Video codec: H.264.
- Audio codec: AAC.
- Pixel format: `yuv420p`.
- Crop-to-fill menjadi default untuk memenuhi layar vertikal.
- Normalisasi sample rate dan channel audio sebelum concat.
- Jika klip tidak memiliki audio, tambahkan track audio senyap agar semua klip konsisten.
- Pertahankan audio asli tiap klip pada MVP.

### Overlay

- Judul utama tampil dari detik 0 sampai akhir.
- Angka 1–5 tampil dari detik 0 sampai akhir.
- Deskripsi ke-N mulai tampil pada timestamp awal klip ke-N.
- Deskripsi yang sudah tampil tetap terlihat sampai akhir video.
- Animasi pop-in hanya dijalankan pada saat deskripsi pertama kali muncul.
- Gunakan font yang mendukung karakter Indonesia. Untuk emoji dan outline kompleks, render teks menjadi PNG transparan lalu overlay ke video agar tampil konsisten.
- Escape karakter khusus sebelum membentuk filter FFmpeg.

### Perhitungan timestamp

Durasi setiap klip dihitung setelah trim. Timestamp awal klip ke-N adalah jumlah durasi klip sebelumnya.

Contoh: jika durasi klip adalah 5, 7, 4, 6, dan 5 detik, maka deskripsi muncul pada detik 0, 5, 12, 16, dan 22.

**Penting:** jangan menyusun command shell dengan menggabungkan teks dari pengguna. Jalankan FFmpeg menggunakan `spawn` dengan argument array.

## 11. Validasi Input

| Item | Aturan awal |
|---|---|
| Jumlah file | Tepat 5 video |
| Format yang diterima | MP4, MOV, WebM; codec diperiksa dengan FFprobe |
| Ukuran | Maksimum 250 MB per klip, dapat diubah lewat konfigurasi |
| Durasi klip | Maksimum 60 detik per klip |
| Total durasi | Maksimum 180 detik |
| Judul | Wajib, 1–60 karakter |
| Deskripsi | Wajib, masing-masing 1–30 karakter |
| File rusak | Tolak dan tampilkan pesan yang jelas |
| Video landscape | Diterima, lalu di-crop ke 9:16 |
| Hak konten | Pengguna wajib memiliki izin atas video dan audio yang digunakan |

Batas di atas adalah konfigurasi awal MVP, bukan batas permanen.

## 12. Keamanan dan Privasi

- Batasi ukuran upload di frontend dan backend.
- Periksa ekstensi, MIME, dan metadata aktual; jangan percaya nama file.
- Gunakan UUID untuk nama file internal.
- Cegah path traversal.
- Jalankan FFmpeg dengan `spawn` dan argument array, bukan shell command dari input pengguna.
- Batasi jumlah render bersamaan untuk mencegah CPU/RAM habis.
- Jangan mengirim video ke layanan pihak ketiga.
- Hapus file sementara secara otomatis, misalnya dua jam setelah render selesai.
- Untuk deployment publik, tambahkan rate limit, token job atau autentikasi, dan batas storage.

## 13. Rancangan Antarmuka

| Area | Isi |
|---|---|
| Header | Logo Shorts Maker, tombol proyek baru, status server |
| Panel kiri | Upload lima klip dan daftar urutan |
| Panel tengah | Preview vertikal 9:16 |
| Panel kanan | Editor judul dan lima deskripsi |
| Footer | Preview, Render Video, progres, Download |

Di layar ponsel, editor menjadi alur bertahap:

```text
Upload -> Teks -> Preview -> Render
```

Tombol Render dan Download harus mudah dijangkau.

## 14. Kriteria Penerimaan (Definition of Done)

- [ ] Render tidak bisa dimulai jika jumlah video bukan tepat lima.
- [ ] Urutan video hasil render sama dengan urutan editor.
- [ ] Judul dan angka 1–5 terlihat sepanjang video.
- [ ] Deskripsi nomor 1 muncul saat klip pertama dimulai, dan seterusnya.
- [ ] Setiap deskripsi hanya dianimasikan sekali.
- [ ] Deskripsi yang sudah muncul tetap terlihat sampai akhir.
- [ ] Total durasi hasil sesuai total durasi klip setelah trim, dengan toleransi encoding.
- [ ] Output dapat diputar di pemutar umum dan berasio 9:16.
- [ ] Download tersedia setelah status `completed`.
- [ ] Jika render gagal, UI menampilkan pesan yang jelas dan file sementara dibersihkan.

## 15. Tahapan Pengerjaan

| Tahap | Pekerjaan | Hasil |
|---|---|---|
| 1. Setup | React/Vite, Express, TypeScript, FFmpeg | Aplikasi berjalan lokal |
| 2. Upload | Upload lima file dan FFprobe | Lima klip tervalidasi |
| 3. Editor | Judul, deskripsi, urutan, preset | Data proyek siap |
| 4. Preview | Preview 9:16 dan simulasi label | Desain bisa diperiksa |
| 5. Render | Normalisasi, concat, overlay, progress | MP4 berhasil dibuat |
| 6. Download | Endpoint unduh dan cleanup | MVP bisa digunakan |
| 7. QA | Uji file rusak, tanpa audio, landscape, emoji, durasi berbeda | MVP stabil |

## 16. Risiko Teknis dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| Codec klip berbeda | Normalisasi tiap klip sebelum concat |
| Emoji tidak muncul | Gunakan overlay PNG dengan font emoji |
| Teks terpotong | Batasi karakter, ukur area teks, dan uji preview |
| Render berat/lama | Batasi durasi dan concurrency; tampilkan progres |
| Audio tidak sinkron | Normalisasi sample rate/channel |
| Upload terputus | Tampilkan status upload; resumable upload pada versi lanjut |
| Storage penuh | Hapus job kedaluwarsa otomatis |

## 17. Prompt Implementasi untuk Coding Agent

Salin prompt ini ke coding agent sebagai instruksi implementasi:

```text
Buat aplikasi web bernama Shorts Maker sesuai blueprint ini.

TUJUAN
Aplikasi membuat satu video vertikal Top 5 dari tepat lima klip video yang diunggah pengguna.

STACK
- Frontend: React, Vite, TypeScript, Tailwind CSS, Framer Motion, dnd-kit.
- Backend: Node.js, Express, TypeScript.
- Video processing: FFmpeg dan FFprobe.
- Penyimpanan sementara secara lokal untuk MVP.
- Jangan gunakan layanan AI berbayar.

FITUR WAJIB
1. Upload tepat lima video.
2. Tampilkan thumbnail/metadata dan izinkan pengurutan drag-and-drop.
3. Input satu judul utama dan lima deskripsi, satu per ranking.
4. Preview kanvas 9:16.
5. Angka 1 sampai 5 selalu tampil sejak awal.
6. Deskripsi ranking ke-N muncul tepat ketika klip ke-N dimulai.
7. Deskripsi yang sudah muncul tetap terlihat sampai video selesai.
8. Setiap deskripsi hanya dianimasikan sekali dengan animasi pop-in singkat.
9. Gabungkan klip sesuai urutan, normalisasi ke 1080x1920, 30 fps, H.264, AAC.
10. Render MP4 dan sediakan progres serta tombol download.

PRESET VISUAL
- Judul kapital, tebal, kuning dengan outline hitam di bagian atas.
- Ranking berada di sisi kiri.
- Warna angka: hijau, merah muda, biru, kuning, oranye.
- Gunakan font tebal dan outline/shadow agar terbaca di atas video.
- Format 9:16.

ATURAN ENGINEERING
- Pisahkan frontend, API, upload service, validation service, dan render worker.
- Validasi file dengan FFprobe; jangan percaya ekstensi saja.
- Gunakan UUID untuk nama file internal.
- Jalankan FFmpeg dengan process spawn dan argument array.
- Tangani klip tanpa audio, codec berbeda, file rusak, dan teks/emoji.
- Jangan mengirim video ke layanan pihak ketiga.
- Bersihkan file sementara setelah job kedaluwarsa.
- Buat README berisi prasyarat, instalasi Windows, cara menjalankan frontend/backend, dan troubleshooting.

CARA KERJA
Bangun bertahap: setup -> upload -> editor -> preview -> render -> download -> QA.
Setelah setiap tahap, jalankan build/typecheck dan perbaiki error.
Jangan membuat tombol palsu atau UI yang tidak berfungsi.
Sertakan struktur folder, .env.example, dan contoh data proyek.
Selesaikan MVP sebelum menambahkan fitur lanjutan.
```

## 18. Fitur Versi Berikutnya

- Preset Top 3, Top 5, Top 10, dan ranking countdown.
- Pengaturan posisi teks dengan drag handles.
- Pengaturan font, warna, stroke, shadow, ukuran, dan animasi.
- Trim klip dengan timeline.
- Musik latar, ducking audio, dan fade in/out.
- Auto-save proyek dan ekspor ulang.
- Akun pengguna, cloud storage, dan antrean render multi-user.
- Subtitle dan watermark opsional.

## 19. Keputusan Produk Final

Default MVP:

1. Judul selalu tampil.
2. Angka 1–5 selalu tampil.
3. Deskripsi muncul satu per satu saat klipnya dimulai.
4. Deskripsi lama tetap tampil sampai akhir video.
5. Animasi pop-in hanya sekali.
6. Video disusun sesuai urutan pengguna.
7. Hasil akhir MP4 9:16, 1080 × 1920, 30 fps.

---

*Shorts Maker Blueprint v1.0*
