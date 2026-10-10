
## Struktur halaman dan komponen
### 1. Halaman utama berada di folder app

Semua halaman website ada di folder `app/`.

- `app/page.tsx` = halaman home / landing page
- `app/about/page.tsx` = halaman tentang gereja
- `app/events/page.tsx` = halaman event
- `app/donate/page.tsx` = halaman donasi
- `app/login/page.tsx` dan `app/register/page.tsx` = halaman autentikasi
- `app/dashboard/page.tsx` = dashboard user
- `app/admin/.../page.tsx` = halaman admin


### 2. Komponen reusable ada di folder components

Bagian UI yang dipakai berulang atau dipisahkan dari halaman biasanya ada di folder `components/`.

Contohnya:

- `components/Navbar.tsx` = navigasi atas
- `components/Footer.tsx` = footer
- `components/PageShell.tsx` = layout wrapper halaman
- `components/AdminLayout.tsx` = layout admin panel
- `components/AuthForm.tsx` = form login/register
- `components/EventCountdown.tsx` = countdown event
- `components/VolunteerForm.tsx` = form volunteer

Jadi, jika ada elemen yang muncul di beberapa halaman, biasanya bagian tersebut sudah dipisah ke component supaya lebih mudah dikelola.

### 3. Styling global ada di app/globals.css

Jika ingin mengubah:

- warna dasar
- font
- spacing
- tombol
- card
- input style
- design token global

maka yang perlu dilihat adalah `app/globals.css`.

### 4. Layout utama ada di app/layout.tsx

File `app/layout.tsx` adalah layout global yang mengatur struktur utama website seperti:

- navbar
- footer
- provider global
- tema/layout umum

## Contoh mapping sederhana

- Home page → edit di `app/page.tsx`
- Navbar → edit di `components/Navbar.tsx`
- Sidebar admin → edit di `components/AdminLayout.tsx`
- Form login/register → edit di `components/AuthForm.tsx`
- Countdown event → edit di `components/EventCountdown.tsx`

