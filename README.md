# Shorts Maker 🎬

> **Web Editor untuk Membuat Video Tren Top 5 Secara Otomatis**  
> Dibuat berdasarkan *Blueprint Shorts Maker MVP v1.0*.

Shorts Maker membantu konten kreator YouTube Shorts dan TikTok membuat video vertikal bergaya tren “Top 5” dalam hitungan menit. Cukup unggah tepat 5 klip video, tulis judul utama dan 5 deskripsi ranking, lalu sistem akan menyusun dan merender satu file MP4 beresolusi 1080 × 1920 (9:16) 30 fps lengkap dengan overlay teks dan animasi pop-in.

---

## 🚀 Fitur Utama

- **Upload Tepat 5 Klip Video**: Validasi otomatis jumlah file, format (MP4, MOV, WebM), dan ukuran file (maks 250 MB/klip).
- **Preset Visual Tren**:
  - Judul utama di bagian atas: HURUF KAPITAL, tebal, kuning (`#FFF21A`) dengan outline hitam (`#111111`).
  - Angka `1.`, `2.`, `3.`, `4.`, `5.` selalu terlihat di sisi kiri sejak awal video sampai selesai dengan warna khas (Hijau, Merah Muda, Biru, Kuning, Oranye).
  - Deskripsi nomor N muncul tepat saat klip nomor N dimulai dan **tetap tampil** sampai video selesai.
  - Animasi pop-in singkat (250–350 ms) pada kemunculan pertama tiap deskripsi.
- **Normalisasi Video FFmpeg**:
  - Format vertikal kanvas 1080 × 1920 (9:16).
  - Crop-to-fill otomatis untuk video landscape tanpa bar hitam.
  - Frame rate 30 fps, video codec H.264, audio codec AAC 44.1 kHz stereo.
  - Penanganan klip tanpa audio (audio senyap otomatis agar penggabungan tidak error).
- **Interaksi Drag & Drop**: Mengatur urutan klip dengan mudah menggunakan `@dnd-kit` atau tombol panah naik/turun.
- **Fitur Trim Klip**: Memotong awal dan akhir video untuk setiap klip dengan slider responsif.
- **Live Preview Realtime**: Simulasi kanvas vertikal 9:16 dengan pemutar video, scrubbing timeline multi-segmen, dan lompat klip langsung.
- **Pemantauan Progres Nyata**: Status render bertahap (*queued* ➔ *validating* ➔ *processing* ➔ *encoding* ➔ *completed*) berdasarkan status FFmpeg aktual.
- **1-Click Demo Generator**: Fitur demo bawaan untuk mencoba aplikasi langsung tanpa perlu menyiapkan 5 video terlebih dahulu.

---

## 🛠️ Prasyarat Sistem

1. **Node.js**: Versi 18.x atau lebih baru (direkomendasikan Node.js 20+).
2. **FFmpeg & FFprobe**: Wajib terpasang di sistem dan terdaftar dalam `PATH`.

---

## 💻 Panduan Instalasi

### 1. Memasang FFmpeg

#### Windows
Buka Terminal/PowerShell sebagai Administrator dan jalankan salah satu:
```powershell
# Menggunakan winget (Bawaan Windows 10/11)
winget install Gyan.FFmpeg

# ATAU menggunakan Chocolatey
choco install ffmpeg

# ATAU menggunakan Scoop
scoop install ffmpeg
```
*Pastikan perintah `ffmpeg -version` dan `ffprobe -version` dapat dijalankan dari PowerShell baru.*

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install -y ffmpeg
```

---

### 2. Menjalankan Shorts Maker

```bash
# 1. Masuk ke direktori proyek
cd shorts-maker

# 2. Pasang dependensi
npm install

# 3. Jalankan server pengembangan (Express + Vite)
npm run dev
```

Buka peramban di `http://localhost:3000`.

---

## 📂 Struktur Folder Proyek

```text
shorts-maker/
├── server.ts                       # Entrypoint Express + Vite middleware
├── server/
│   └── src/
│       ├── routes/
│       │   ├── projects.ts         # Endpoint upload, validasi, demo, streaming
│       │   └── renders.ts          # Endpoint status render & download MP4
│       ├── services/
│       │   ├── validation.service.ts # FFprobe & verifikasi batasan
│       │   ├── ffmpeg.service.ts     # Pembuatan overlay SVG & pipeline render FFmpeg
│       │   └── cleanup.service.ts    # Pembersihan berkas kedaluwarsa otomatis
│       ├── workers/
│       │   └── render.worker.ts     # Antrean render dengan kontrol konkurensi
│       └── types.ts                # TypeScript types backend
├── src/
│   ├── components/
│   │   ├── Header.tsx              # Navigasi atas & tombol demo
│   │   ├── VideoUploader.tsx       # Area upload & dropzone 5 klip
│   │   ├── ClipList.tsx            # Pengurutan drag-and-drop & dialog trim
│   │   ├── TitleEditor.tsx         # Editor judul utama & preview
│   │   ├── RankingEditor.tsx       # Editor deskripsi 1-5 & shortcut emoji
│   │   ├── VideoPreview.tsx        # Simulasi live preview 9:16
│   │   ├── RenderProgress.tsx      # Modal progres encoding FFmpeg
│   │   └── DownloadPanel.tsx       # Pemutar video hasil render & tombol unduh
│   ├── pages/
│   │   └── EditorPage.tsx          # Halaman editor utama & alur kerja
│   ├── types/
│   │   └── project.ts              # TypeScript types frontend
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── storage/
│   ├── uploads/                    # Penyimpanan klip video sementara
│   ├── jobs/                       # File SVG overlay per job
│   └── outputs/                    # File MP4 hasil render
├── .env.example
├── package.json
└── README.md
```

---

## 🧩 Contoh Data Proyek (JSON)

```json
{
  "title": "TOP 5 MAU KUKIS GAK?",
  "aspectRatio": "9:16",
  "resolution": { "width": 1080, "height": 1920 },
  "fps": 30,
  "clips": [
    { "order": 1, "id": "clip-1", "description": "Kembar 👯", "trimStart": 0, "trimEnd": null },
    { "order": 2, "id": "clip-2", "description": "Cantik ❤️", "trimStart": 0, "trimEnd": null },
    { "order": 3, "id": "clip-3", "description": "Lucu 😂", "trimStart": 0, "trimEnd": null },
    { "order": 4, "id": "clip-4", "description": "Pintar 🧠", "trimStart": 0, "trimEnd": null },
    { "order": 5, "id": "clip-5", "description": "Imut 🥰", "trimStart": 0, "trimEnd": null }
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

---

## ❓ Troubleshooting

1. **Error: `ffprobe: command not found` atau `ffmpeg: command not found`**  
   *Solusi:* Pastikan FFmpeg telah diinstal dan bin directory-nya masuk ke `PATH`. Buka terminal baru dan ketik `ffmpeg -version`.

2. **Render Gagal: "Jumlah video harus tepat 5 klip"**  
   *Solusi:* Sistem mewajibkan tepat 5 video sesuai format Top 5. Gunakan fitur "Gunakan 5 Klip Demo" jika Anda ingin mencoba tanpa mengunggah 5 video manual.

3. **Video landscape terlihat terpotong**  
   *Penjelasan:* Sesuai spesifikasi tren Shorts 9:16, video landscape secara otomatis dipotong bagian tengah (*crop-to-fill*) agar memenuhi layar ponsel tanpa bar hitam di sisi atas/bawah.

4. **File sementara memenuhi ruang disk**  
   *Penjelasan:* Sistem secara otomatis menjalankan pembersihan (*cleanup service*) untuk menghapus file sementara yang berusia lebih dari 2 jam. Anda juga dapat menekan "Proyek Baru" untuk mereset proyek saat ini.

---

*Lisensi: Apache-2.0*
