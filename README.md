# SAPA (Sistem Administrasi Permohonan Antar Instansi)
**BWS Bali Penida**

SAPA adalah platform layanan permohonan surat menyurat antar instansi dan masyarakat berbasis web, yang dirancang khusus untuk Balai Wilayah Sungai (BWS) Bali Penida. Sistem ini memudahkan proses pengajuan, pelacakan, dan riwayat permohonan surat secara *real-time* dan transparan.

---

## 🌟 Fitur Utama

- **Pengajuan Mudah**: Masyarakat dan instansi dapat mengajukan permohonan dengan format form terstruktur dan unggah lampiran PDF.
- **Lacak Real-Time**: Gunakan Nomor Resi khusus (contoh: `SAPA/REKOMENDASI/2026/G82A/001`) untuk melacak proses surat secara mendetail.
- **Riwayat Terpusat**: Pengguna yang terdaftar dapat melihat seluruh riwayat pengajuan surat mereka dalam satu dasbor rapi.
- **Alur Notifikasi & Status**: Pemohon langsung tahu apakah dokumen sedang diverifikasi, diproses, disetujui, atau ditolak beserta catatannya.
- **Responsif**: Dapat diakses dengan sempurna dari perangkat seluler (*mobile-friendly*) hingga komputer *desktop*.

## 🚀 Alur Kerja Sistem (Workflow)

Sistem dirancang untuk mengintegrasikan Pemohon, Staf Verifikator, dan Atasan (Pimpinan BWS).

1. **Pemohon** mengisi formulir, melampirkan berkas, lalu menerima Nomor Resi. (Status: `MENUNGGU VERIFIKASI`)
2. **Staf Verifikator** (Segera Hadir) mengecek kelengkapan. Jika lengkap diteruskan, jika kurang dikembalikan dengan catatan. (Status: `DIPROSES` atau `DITOLAK`)
3. **Pimpinan BWS** (Segera Hadir) memeriksa dan memberikan persetujuan final/disposisi. (Status: `DISETUJUI` / `SELESAI`)

## 🛠️ Stack Teknologi

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React)
- **Styling**: Vanilla CSS (Global Styles)
- **Database**: SQLite
- **ORM**: [Prisma](https://www.prisma.io/)
- **Bahasa**: TypeScript

## 💻 Panduan Instalasi (Development)

Pastikan [Node.js](https://nodejs.org/) telah terpasang di perangkat Anda.

1. **Klon Repositori**
   ```bash
   git clone <url-repository>
   cd sapa
   ```

2. **Instal Dependensi**
   ```bash
   npm install
   ```

3. **Atur Environment Variables**
   Ubah file `.env.example` (jika ada) menjadi `.env` dan konfigurasikan URL database Anda. Secara bawaan, Prisma telah diatur menggunakan SQLite.
   ```bash
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="rahasia_sapa_2026"
   ```

4. **Inisialisasi Database**
   Lakukan migrasi skema dan *generate client* Prisma:
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Jalankan Server Lokal**
   ```bash
   npm run dev
   ```

6. Buka `http://localhost:3000` di *browser* Anda.

## 📂 Struktur Halaman Saat Ini

- `/` : Beranda
- `/ajukan-surat` : Form pengajuan dokumen baru
- `/lacak-surat` : Lacak status dengan kode resi tanpa harus masuk/login
- `/riwayat-surat` : Dasbor lengkap khusus untuk akun pemohon terdaftar
- `/masuk`, `/daftar`, `/lupa-password` : Antarmuka autentikasi pengguna

---
*Dibuat untuk memudahkan tata kelola administrasi di lingkungan Balai Wilayah Sungai Bali Penida.*
