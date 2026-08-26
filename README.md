# SAPA — BWS Bali Penida

Prototipe antarmuka Sistem Administrasi Permohonan Antar Instansi untuk BWS Bali Penida.

## Menjalankan proyek

1. Salin `.env.example` menjadi `.env`.
2. Jalankan `npm run dev`.
3. Buka `http://localhost:3000`.

## Halaman yang tersedia

- `/` — Beranda
- `/ajukan-surat` — Form pengajuan surat
- `/lacak-surat` — Pelacakan dengan kode resi
- `/riwayat-surat` — Dasbor riwayat pemohon
- `/masuk` dan `/daftar` — Autentikasi pemohon

## Fondasi database

Skema Prisma pada `prisma/schema.prisma` menyiapkan relasi pengguna, pengajuan, perubahan status, dan log aktivitas. Tambahkan autentikasi serta API route sebelum menghubungkan formulir ke database produksi.
