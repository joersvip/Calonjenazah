# CALON JENAZAH - Portal Berita Kritis & Reflektif

Portal berita modern dengan desain editorial bernuansa investigatif & reflektif, dilengkapi CMS Admin lengkap, sistem **Re-Upload Berita Otomatis via Link**, **Mesin Web Crawler / RSS Harvester**, serta **Pelacakan Pengunjung Real-Time & Riwayat (IP, Perangkat/Browser/OS, dan Peta Geolocation Interaktif Leaflet)**.

---

## 🚀 Panduan Menjalankan untuk Produksi

### Opsi 1: Menjalankan Langsung di Windows (1-Click)
Cukup klik ganda (double-click) file:
```
start.bat
```
Atau melalui Command Prompt / PowerShell:
```bash
npm start
```
Aplikasi akan otomatis menyala di port `5000`:
- **Portal Berita**: [http://localhost:5000](http://localhost:5000)
- **Admin Dashboard**: [http://localhost:5000/#/admin](http://localhost:5000/#/admin)
- **Login Admin**: Sesuai konfigurasi kredensial di file `.env` (`ADMIN_DEFAULT_USER` & `ADMIN_DEFAULT_PASS`). Password dienkripsi dengan PBKDF2 hash.

---

### Opsi 2: Menjalankan di Linux VPS / Server dengan PM2 (Direkomendasikan)
PM2 menjaga aplikasi tetap menyala secara otomatis jika server me-restart atau terjadi error:

```bash
# 1. Masuk ke direktori proyek
cd /path/to/Calonjenazah

# 2. Install dependencies & build frontend
npm install
npm --prefix client install
npm --prefix client run build

# 3. Jalankan aplikasi menggunakan PM2
pm2 start ecosystem.config.js

# 4. Atur PM2 agar menyala otomatis saat server reboot
pm2 save
pm2 startup
```

Memeriksa status & log:
```bash
pm2 status
pm2 logs calonjenazah-portal
```

---

### Opsi 3: Menjalankan Menggunakan Docker & Docker Compose
Jika server Anda menggunakan Docker:

```bash
# Build dan jalankan container di latar belakang
docker compose up -d --build

# Periksa status
docker compose ps

# Melihat log
docker compose logs -f
```
Data database SQLite tersimpan secara persisten di folder `./data`.

---

## 🔒 Konfigurasi Nginx Reverse Proxy & SSL (Domain Publik)

Untuk menghubungkan domain Anda (misal: `calonjenazah.com`) ke port 5000 lengkap dengan dukungan WebSocket (Socket.io untuk live map tracking) dan SSL:

```nginx
server {
    server_name calonjenazah.com www.calonjenazah.com;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Forwarding ke aplikasi Node.js
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;

        # WebSocket support untuk Live Visitor Map
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Meneruskan Alamat IP Pengunjung Asli (Sangat penting untuk Geolocation & Audit Log)
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    listen 80;
}
```

Pasang sertifikat SSL gratis dengan Certbot:
```bash
sudo certbot --nginx -d calonjenazah.com -d www.calonjenazah.com
```

---

## 📂 Struktur Direktori Proyek

```
Calonjenazah/
├── client/                     # Frontend SPA (React + Vite + Leaflet + Chart.js)
│   ├── dist/                   # Hasil build produksi siap saji
│   ├── src/
│   │   ├── components/portal/  # Komponen portal berita (Navbar, Hero, Cards, Footer)
│   │   ├── pages/portal/       # Halaman publik (Home, ArticleDetail, Category, Search)
│   │   ├── pages/admin/        # Halaman CMS Admin (Overview, Live Map, History, Reupload, Crawler, Articles, Settings)
│   │   ├── services/telemetry.js # Client socket & beacon telemetry
│   │   ├── App.jsx             # Router utama portal & admin
│   │   └── index.css           # Desain sistem & tema editorial gelap
├── server/                     # Backend Express & Real-Time Engine
│   ├── index.js                # Server entry point + static serving + Socket.io
│   ├── db.js                   # Node SQLite database native initializer & seed
│   ├── routes/api.js           # REST API endpoint lengkap
│   ├── services/scraper.js     # Engine ekstraksi berita link luar
│   ├── services/crawler.js     # Engine RSS & Web Crawler berita
│   └── services/tracker.js     # Engine pelacak IP, Device, GeoIP, & live socket
├── data/                       # Penyimpanan database SQLite (calonjenazah.db)
├── start.bat                   # 1-Click launcher Windows
├── start.sh                    # Runner script Linux
├── ecosystem.config.js         # Konfigurasi PM2 production process
├── Dockerfile                  # Container build recipe
├── docker-compose.yml          # Container compose orchestrator
└── README.md                   # Dokumentasi teknis
```

---

## 🛠️ Fitur Redaksi & Administrator

1. **Re-Upload Berita Otomatis via Link**:
   - Masukkan link berita luar (Kompas, Detik, CNN, Antara, dll).
   - Ekstraksi judul, cover, isi berita, penulis, tanggal, dan sumber secara instan.
   - Edit atau tambahkan catatan redaksi, lalu terbitkan dengan 1 klik.
2. **Web Crawler & RSS Harvester**:
   - Pre-configured feed berita nasional (Antara, BBC Indonesia, Detik, CNBC).
   - Menarik puluhan artikel sekaligus ke antrian, pratinjau, dan batch import ke portal.
3. **Live Visitor Map (Leaflet.js)**:
   - Pantau posisi geografis pengunjung saat ini secara langsung di peta dengan pin radar berdenyut.
   - Deteksi Alamat IP, Kota/Negara, Koordinat, Tipe Perangkat (Desktop/Mobile/Tablet), OS, Browser, dan Berita yang sedang dibaca.
4. **Riwayat & Audit Log Pengunjung**:
   - Catatan seluruh pengunjung tersimpan di database.
   - Filter berdasarkan kata kunci, tanggal, dan perangkat.
   - Tombol **Ekspor CSV** untuk laporan data analitik.
5. **Fitur Pembaca Berita**:
   - Text-to-Speech (TTS) narasi suara otomatis.
   - Reading progress bar.
   - Skala ukuran huruf (A- / A+).
   - Reaksi emoji interaktif (*Kritis, Terkejut, Berduka, Prihatin, Inspiratif*).
   - Kolom komentar pembaca & tombol bagikan ke media sosial.
