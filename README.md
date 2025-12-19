# Dashboard Kerusakan Jalan - Jawa Barat

Sistem monitoring dan pemetaan kerusakan infrastruktur jalan untuk operator dinas pemerintahan Provinsi Jawa Barat.

## Fitur

- ✅ **Login dengan Google SSO** - Autentikasi aman menggunakan Firebase
- 🗺️ **Peta Interaktif** - Visualisasi sebaran kerusakan jalan se-Jawa Barat
- 📊 **Dashboard Statistik** - Data real-time kondisi jalan
- 🔒 **Protected Routes** - Hanya user yang terautentikasi dapat mengakses dashboard
- 📱 **Responsive Design** - Tampilan optimal di berbagai perangkat

## Setup Firebase

### 1. Buat Project Firebase

1. Kunjungi [Firebase Console](https://console.firebase.google.com/)
2. Klik "Add project" atau "Tambah project"
3. Beri nama project (contoh: "road-damage-jabar")
4. Ikuti wizard setup hingga selesai

### 2. Enable Google Authentication

1. Di Firebase Console, pilih project Anda
2. Buka **Authentication** dari menu sidebar
3. Klik tab **Sign-in method**
4. Klik **Google** dari daftar providers
5. Toggle **Enable** dan klik **Save**

### 3. Daftarkan Web App

1. Di Firebase Console, klik ikon **Web** (</>) di halaman overview
2. Beri nama app (contoh: "Dashboard Web")
3. Klik **Register app**
4. Copy konfigurasi Firebase yang ditampilkan

### 4. Setup Environment Variables

1. Buat file `.env.local` di root project
2. Copy isi dari `.env.local.example` atau gunakan template berikut:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

3. Ganti nilai-nilai di atas dengan konfigurasi Firebase Anda

### 5. Konfigurasi Authorized Domains

1. Di Firebase Console, buka **Authentication** > **Settings** > **Authorized domains**
2. Tambahkan domain yang akan digunakan:
   - `localhost` (untuk development)
   - Domain production Anda (jika sudah deploy)

## Instalasi & Menjalankan Project

### Install Dependencies

```bash
npm install
```

### Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

### Build untuk Production

```bash
npm run build
npm start
```

## Struktur Project

```
road-detection/
├── app/
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard page (protected)
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── layout.tsx            # Root layout dengan AuthProvider
│   └── globals.css           # Global styles
├── components/
│   ├── pages/
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx     # Dashboard component
│   │   │   └── DashboardMap.tsx  # Map component dengan Leaflet
│   │   └── login/
│   │       └── Login.tsx         # Login component
│   └── ProtectedRoute.tsx    # HOC untuk protected routes
├── contexts/
│   └── AuthContext.tsx       # Authentication context
├── lib/
│   └── firebase.ts           # Firebase configuration
└── .env.local               # Environment variables (tidak di-commit)
```

## Teknologi yang Digunakan

- **Next.js 15** - React framework
- **Firebase Authentication** - Google SSO
- **React Leaflet** - Interactive maps
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety
- **Lucide React** - Icons

## Flow Aplikasi

1. User mengakses aplikasi
2. Jika belum login, diarahkan ke halaman `/login`
3. User klik "Masuk dengan Google"
4. Firebase menangani autentikasi dengan Google
5. Setelah berhasil login, user diarahkan ke `/dashboard`
6. Dashboard menampilkan:
   - Statistik kerusakan jalan (Total, Parah, Sedang, Ringan)
   - Peta interaktif dengan marker lokasi kerusakan
   - Info user yang sedang login
7. User dapat logout dengan klik tombol "Keluar"

## Data Kerusakan Jalan

Saat ini menggunakan dummy data dengan 20+ lokasi kerusakan jalan di berbagai kota di Jawa Barat:
- Bandung
- Bekasi
- Bogor
- Cirebon
- Depok
- Tasikmalaya
- Sukabumi
- Karawang
- Purwakarta
- Garut

Setiap data kerusakan memiliki:
- ID unik
- Koordinat (latitude, longitude)
- Tingkat keparahan (critical, moderate, minor)
- Lokasi jalan
- Kota
- Deskripsi kerusakan

## Customization

### Menambah Data Kerusakan Jalan

Edit file `components/pages/dashboard/DashboardMap.tsx` dan tambahkan data di array `roadDamageData`:

```typescript
{
  id: 21,
  lat: -6.xxxx,
  lng: 107.xxxx,
  severity: 'critical', // 'critical' | 'moderate' | 'minor'
  location: 'Jl. Nama Jalan, Kota',
  description: 'Deskripsi kerusakan',
  city: 'Nama Kota'
}
```

### Mengubah Warna Marker

Edit fungsi `createCustomIcon` di file `DashboardMap.tsx` untuk mengubah warna marker berdasarkan severity.

## Troubleshooting

### Error: "Firebase: Error (auth/unauthorized-domain)"

**Solusi:** Tambahkan domain Anda ke Authorized domains di Firebase Console (Authentication > Settings > Authorized domains)

### Map tidak muncul

**Solusi:** 
1. Pastikan Leaflet CSS sudah di-import di `globals.css`
2. Clear cache browser dan reload
3. Check console untuk error

### User tidak ter-redirect setelah login

**Solusi:**
1. Pastikan AuthProvider sudah wrap semua component di `app/layout.tsx`
2. Check Firebase configuration di `.env.local`

## License

© 2025 Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Jawa Barat
