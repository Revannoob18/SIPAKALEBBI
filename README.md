# Buku Tamu SMAN 1 BONE

**Buku Tamu Digital** berbasis web untuk SMAN 1 BONE. Proyek ini memungkinkan pengunjung mengisi data kedatangan serta mendeteksi wajah secara real-time menggunakan kamera.

## Fitur

- Form pengisian data tamu (nama, alasan kunjungan, tujuan, dsb.)
- Deteksi wajah menggunakan `face-api.js`
- Simpan data ke database MySQL
- Login untuk admin/operator
- Dashboard admin untuk melihat dan mengelola data pengunjung

## Teknologi

- **Frontend**: Vue.js + Vite + face-api.js
- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Lainnya**: XAMPP (untuk MySQL & phpMyAdmin), Quasar (untuk tampilan admin)

## Cara Menjalankan (Local)

### 1. Clone Repository

```bash
git clone https://github.com/Revannoob18/SIPAKALEBBI.git
cd SIPAKALEBBI
