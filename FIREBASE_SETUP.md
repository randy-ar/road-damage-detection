# Panduan Setup Firebase untuk Dashboard Kerusakan Jalan

## Langkah 1: Buat Project Firebase

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik tombol **"Add project"** atau **"Tambah project"**
3. Masukkan nama project, contoh: `road-damage-jabar`
4. (Opsional) Aktifkan Google Analytics jika diperlukan
5. Klik **"Create project"** dan tunggu hingga selesai

## Langkah 2: Enable Authentication

1. Di sidebar Firebase Console, klik **"Authentication"**
2. Klik tombol **"Get started"** jika baru pertama kali
3. Pilih tab **"Sign-in method"**
4. Klik **"Google"** dari daftar providers
5. Toggle switch untuk **"Enable"**
6. Pilih email support untuk project (biasanya email Anda)
7. Klik **"Save"**

## Langkah 3: Daftarkan Web App

1. Di halaman overview Firebase Console, klik ikon **Web** `</>`
2. Masukkan nickname untuk app, contoh: `Dashboard Web`
3. **JANGAN** centang "Also set up Firebase Hosting" (tidak diperlukan untuk sekarang)
4. Klik **"Register app"**
5. Anda akan melihat konfigurasi Firebase seperti ini:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "road-damage-jabar.firebaseapp.com",
  projectId: "road-damage-jabar",
  storageBucket: "road-damage-jabar.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

6. **COPY** semua nilai tersebut, Anda akan membutuhkannya di langkah berikutnya

## Langkah 4: Setup Environment Variables

1. Di root folder project, buat file baru bernama `.env.local`
2. Copy template dari `env.example` atau gunakan format berikut:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=road-damage-jabar.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=road-damage-jabar
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=road-damage-jabar.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

3. Ganti semua nilai dengan konfigurasi Firebase Anda dari langkah 3
4. **PENTING:** File `.env.local` sudah ada di `.gitignore`, jadi tidak akan ter-commit ke Git

## Langkah 5: Konfigurasi Authorized Domains

1. Di Firebase Console, buka **Authentication** > **Settings**
2. Scroll ke bagian **"Authorized domains"**
3. Secara default, `localhost` sudah ditambahkan
4. Jika deploy ke production, tambahkan domain production Anda dengan klik **"Add domain"**

## Langkah 6: Test Aplikasi

1. Pastikan development server sudah berjalan:
   ```bash
   npm run dev
   ```

2. Buka browser dan akses `http://localhost:3000/login`

3. Klik tombol **"Masuk dengan Google"**

4. Pilih akun Google Anda

5. Jika berhasil, Anda akan diarahkan ke halaman dashboard

## Troubleshooting

### Error: "Firebase: Error (auth/unauthorized-domain)"

**Penyebab:** Domain yang Anda gunakan belum ditambahkan ke Authorized domains

**Solusi:**
1. Buka Firebase Console > Authentication > Settings > Authorized domains
2. Tambahkan domain yang error (contoh: `localhost` atau domain production)
3. Tunggu beberapa detik, lalu coba lagi

### Error: "Firebase: Error (auth/invalid-api-key)"

**Penyebab:** API Key di `.env.local` salah atau tidak valid

**Solusi:**
1. Cek kembali file `.env.local`
2. Pastikan `NEXT_PUBLIC_FIREBASE_API_KEY` sesuai dengan yang di Firebase Console
3. Restart development server (`Ctrl+C` lalu `npm run dev` lagi)

### Error: "Firebase: Error (auth/project-not-found)"

**Penyebab:** Project ID salah

**Solusi:**
1. Cek `NEXT_PUBLIC_FIREBASE_PROJECT_ID` di `.env.local`
2. Pastikan sesuai dengan Project ID di Firebase Console
3. Restart development server

### Login berhasil tapi tidak redirect ke dashboard

**Penyebab:** Kemungkinan ada error di AuthContext atau routing

**Solusi:**
1. Buka Developer Console di browser (F12)
2. Cek tab Console untuk error messages
3. Pastikan tidak ada error di komponen AuthContext
4. Coba clear cache browser dan reload

### Map tidak muncul di dashboard

**Penyebab:** Leaflet CSS belum ter-load atau ada error di komponen map

**Solusi:**
1. Pastikan Leaflet CSS sudah di-import di `app/globals.css`
2. Clear cache browser (Ctrl+Shift+R atau Cmd+Shift+R)
3. Cek Console untuk error messages
4. Pastikan package `leaflet` dan `react-leaflet` sudah terinstall

## Tips Keamanan

1. **JANGAN** commit file `.env.local` ke Git
2. **JANGAN** share API Key di public repository
3. Untuk production, gunakan Firebase App Check untuk keamanan tambahan
4. Set up Firebase Security Rules jika menggunakan Firestore/Storage
5. Batasi authorized domains hanya untuk domain yang benar-benar digunakan

## Langkah Selanjutnya

Setelah setup berhasil, Anda bisa:

1. **Menambah data kerusakan jalan** - Edit file `components/pages/dashboard/DashboardMap.tsx`
2. **Integrasi dengan database** - Gunakan Firestore untuk menyimpan data kerusakan
3. **Tambah fitur upload foto** - Gunakan Firebase Storage
4. **Implementasi role-based access** - Tambahkan custom claims di Firebase Auth
5. **Deploy ke production** - Gunakan Vercel, Netlify, atau Firebase Hosting

## Bantuan Lebih Lanjut

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Leaflet Documentation](https://react-leaflet.js.org/)

---

Jika masih ada pertanyaan atau menemui masalah, silakan hubungi tim development.
