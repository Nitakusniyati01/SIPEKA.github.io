SIPEKA - SISTEM PENGADUAN KAMPUS
================================

CARA MENJALANKAN
1. Ekstrak file SIPEKA.zip.
2. Buka folder SIPEKA menggunakan Visual Studio Code.
3. Buka file index.html.
4. Jalankan menggunakan ekstensi Live Server (klik kanan index.html > Open with Live Server).
   Bisa juga membuka index.html langsung di browser, tetapi Live Server lebih disarankan.

AKUN DEMO
Admin:
Email    : admin@sipeka.test
Password : admin123

Petugas:
Email    : petugas@sipeka.test
Password : petugas123

Mahasiswa:
Email    : mahasiswa@sipeka.test
Password : nita123

FITUR
- Login, registrasi, logout
- Lupa password (simulasi lokal)
- Dashboard statistik
- CRUD pengaduan
- Detail dan tracking riwayat status
- Pengelolaan kategori (admin)
- Pengelolaan pengguna (admin)
- Tanggapan dan perubahan status (admin/petugas)
- Notifikasi dalam aplikasi
- Rekap dan ekspor CSV
- Profil pengguna

PENYIMPANAN
Aplikasi ini belum menggunakan MySQL atau database server.
Data disimpan pada LocalStorage browser yang digunakan.
Data hanya tersedia pada browser/perangkat tersebut. Menghapus data browser
dapat menghapus data aplikasi.

CATATAN KEAMANAN
Ini adalah prototipe pembelajaran, bukan aplikasi siap produksi.
Password disimpan secara lokal dan belum menggunakan autentikasi server,
hashing password, email reset sungguhan, atau kontrol keamanan backend.
Jangan gunakan data pribadi atau password asli.
