# Halaman seller

Halaman dikelompokkan berdasarkan fungsi:

| Folder | Isi | Rute terkait |
| --- | --- | --- |
| `auth/` | Login, pendaftaran akun, verifikasi email, lupa password, dan CSS masing-masing halaman | `/seller/login`, `/seller/create-account`, `/seller/verify-email`, `/seller/forgot-password` |
| `onboarding/` | Pengajuan toko dan CSS halaman pengajuan | `/seller/store-application` |
| `workspace/` | Halaman operasional toko, helper akses/status, adapter detail pesanan, dan CSS detail pesanan | `/seller/stores/:storeSlug/*` |
| `preview/` | Halaman preview dan wrapper yang mengekspor halaman preview | `/seller-2026-preview/:storeSlug/*` |

Routing utama berada di `../../App.jsx`. Routing preview berada di
`../../routes/seller2026RouteConfig.jsx`; file tersebut juga memasang rute
`/seller-2026/*` langsung ke komponen pada `features/seller2026`.

`workspace/SellerPaymentCenterPage.jsx` digunakan oleh rute workspace dan
preview. Implementasinya berada di `workspace/` karena pusat pembayaran juga
merupakan halaman operasional. `preview/Seller2026Pages.jsx` mengekspornya kembali
untuk pemakaian preview.

Nama komponen, file, dan kelas CSS yang masih mengandung `2026` dipertahankan
untuk membatasi perubahan pada organisasi folder. Nama tersebut bukan penanda
bahwa sebuah halaman hanya digunakan untuk preview. Saat menambah halaman baru,
pilih folder berdasarkan fungsinya, tanpa membuat folder berdasarkan tahun.

Folder lama `pages/seller2026/` sudah digabungkan ke struktur ini. Modul pendukung
di `features/`, `hooks/`, `api/`, dan `components/` tetap berada di lokasinya.
Laporan historis mungkin masih menyebut lokasi sebelum pemindahan.
