# Notenux frontend

Svelte 5, SvelteKit 3, Tailwind CSS 4, dan adapter Node. Desain retro serta mesin editor berasal dari aplikasi Laravel Notenux; frontend tidak memerlukan repository Laravel saat dijalankan.

## Menjalankan

Gunakan Node.js 22.18+ dan pnpm.

```sh
pnpm install
cp .env.example .env # hanya jika .env belum tersedia
pnpm dev
```

`API_BASE_URL` di `.env` menunjuk ke `https://notenux.oryphem.com`. Variabel ini hanya dibaca server. Browser mengakses proxy same-origin; cookie sesi dan CSRF disimpan HttpOnly. Tidak perlu menonaktifkan CSRF atau mengubah CORS Laravel.

```sh
pnpm build
ORIGIN=https://domain-frontend.example PORT=3000 pnpm start
```

Deploy sebagai aplikasi Node, bukan hosting statis. Isi `ORIGIN` sesuai domain frontend agar validasi origin form benar.

## Pengujian

```sh
pnpm check
pnpm test
pnpm build
pnpm exec playwright install chromium # jika browser belum tersedia
pnpm test:browser
```

White-box menguji logika editor, race condition penyimpanan, sanitasi, proxy, cookie, serta CSRF. Black-box Playwright menjalankan build produksi pada desktop dan mobile dengan backend kontrak terisolasi (`tests/mock-backend.mjs`), **bukan melakukan mutasi data produksi**. Kredensial fixture tidak berlaku di produksi. Verifikasi login/CRUD pada backend produksi memerlukan akun uji yang sah.

Landing dirender server tanpa hydration/router; interaksinya satu bundle kecil. Editor dimuat hanya di Studio. Font WOFF2 dan ikon di-host lokal; logo WebP diperkecil. Build Node menyediakan aset terkompresi.

`scripts/migrate.mjs /path/to/laravel-notenux` adalah alat migrasi satu kali, bukan bagian build. Menjalankannya ulang menimpa halaman hasil konversi, runtime editor, CSS, aset logo, dan tes editor. `scripts/optimize-assets.mjs` mengoptimalkan logo setelah migrasi; `scripts/vendor-assets.mjs` memperbarui font/ikon beserta lisensinya.
