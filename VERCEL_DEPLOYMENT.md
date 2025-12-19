# Deploy ke Vercel - Panduan Lengkap

## 📋 Prerequisites

- ✅ Code sudah di-commit ke Git repository (GitHub/GitLab/Bitbucket)
- ✅ Firebase project sudah dibuat dan dikonfigurasi
- ✅ Akun Vercel (gratis di [vercel.com](https://vercel.com))

## 🚀 Langkah 1: Push Code ke Git Repository

Jika belum push ke remote repository:

```bash
# Pastikan sudah di-commit
git status

# Push ke remote repository
git push origin main
```

## 🌐 Langkah 2: Deploy ke Vercel

### **A. Melalui Vercel Dashboard (Recommended)**

1. **Login ke Vercel**
   - Buka [vercel.com](https://vercel.com)
   - Login dengan akun GitHub/GitLab/Bitbucket Anda

2. **Import Project**
   - Klik tombol **"Add New..."** → **"Project"**
   - Pilih repository `road-detection` dari list
   - Klik **"Import"**

3. **Configure Project**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - Jangan klik Deploy dulu!

4. **Setup Environment Variables** ⚠️ **PENTING!**
   
   Di bagian **"Environment Variables"**, tambahkan satu per satu:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyDylGy51BKy4b0v84WkU6k5BrK9y9hjwE0` |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `road-damage-detection-9bee2.firebaseapp.com` |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `road-damage-detection-9bee2` |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `road-damage-detection-9bee2.firebasestorage.app` |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `697917954194` |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:697917954194:web:e443935087f04d807b6e4b` |

   **Cara menambahkan:**
   - Klik **"Add"** atau ketik nama variable di field "Key"
   - Paste value di field "Value"
   - Pilih environment: **Production**, **Preview**, dan **Development** (centang semua)
   - Klik **"Add"** untuk menyimpan
   - Ulangi untuk semua 6 variables

5. **Deploy**
   - Setelah semua environment variables ditambahkan
   - Klik tombol **"Deploy"**
   - Tunggu proses build selesai (biasanya 2-3 menit)

6. **Selesai!** 🎉
   - Vercel akan memberikan URL production (contoh: `road-detection.vercel.app`)
   - Klik URL untuk membuka aplikasi

### **B. Melalui Vercel CLI (Alternative)**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Ikuti prompt interaktif
# Pilih "Link to existing project" atau "Create new project"
```

Setelah deploy, tambahkan environment variables:

```bash
# Tambahkan satu per satu
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# Paste value: AIzaSyDylGy51BKy4b0v84WkU6k5BrK9y9hjwE0
# Pilih environment: Production, Preview, Development

vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# Paste value: road-damage-detection-9bee2.firebaseapp.com

vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
# Paste value: road-damage-detection-9bee2

vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
# Paste value: road-damage-detection-9bee2.firebasestorage.app

vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
# Paste value: 697917954194

vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
# Paste value: 1:697917954194:web:e443935087f04d807b6e4b

# Redeploy untuk apply changes
vercel --prod
```

## 🔧 Langkah 3: Update Firebase Authorized Domains

Setelah deploy, Anda perlu menambahkan domain Vercel ke Firebase:

1. **Buka Firebase Console**
   - Go to [console.firebase.google.com](https://console.firebase.google.com)
   - Pilih project `road-damage-detection-9bee2`

2. **Tambahkan Domain**
   - Klik **Authentication** → **Settings** → **Authorized domains**
   - Klik **"Add domain"**
   - Masukkan domain Vercel Anda (contoh: `road-detection.vercel.app`)
   - Klik **"Add"**

3. **Test Login**
   - Buka aplikasi di URL Vercel
   - Coba login dengan Google
   - Seharusnya berhasil!

## 📝 Langkah 4: Update Environment Variables (Jika Perlu)

### **Melalui Dashboard:**

1. Buka project di [vercel.com](https://vercel.com)
2. Klik **Settings** → **Environment Variables**
3. Edit atau tambah variable baru
4. Klik **"Save"**
5. **Redeploy** project untuk apply changes:
   - Go to **Deployments** tab
   - Klik menu (⋮) pada deployment terakhir
   - Klik **"Redeploy"**

### **Melalui CLI:**

```bash
# List semua env variables
vercel env ls

# Remove variable (jika perlu update)
vercel env rm NEXT_PUBLIC_FIREBASE_API_KEY

# Add variable baru
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY

# Pull env variables ke local
vercel env pull .env.local
```

## 🔒 Security Best Practices

1. **Jangan commit `.env.local`** ke Git
   - Sudah ada di `.gitignore` ✅

2. **Gunakan Environment Variables** untuk semua sensitive data
   - API keys
   - Database credentials
   - Secret tokens

3. **Batasi Authorized Domains** di Firebase
   - Hanya tambahkan domain yang benar-benar digunakan
   - Jangan gunakan wildcard (`*`)

4. **Enable Firebase App Check** (Recommended untuk Production)
   ```
   Firebase Console → App Check → Get started
   ```

## 🎯 Vercel Environment Types

Vercel memiliki 3 jenis environment:

1. **Production** - Branch `main` atau `master`
2. **Preview** - Pull requests dan branch lainnya
3. **Development** - Local development dengan `vercel dev`

Pastikan environment variables ditambahkan ke semua environment yang diperlukan!

## 🐛 Troubleshooting

### **Build Failed di Vercel**

**Cek:**
- Build log di Vercel dashboard
- Pastikan semua dependencies ada di `package.json`
- Coba build local: `npm run build`

### **Environment Variables Tidak Ter-load**

**Solusi:**
1. Pastikan nama variable **EXACT** (case-sensitive)
2. Pastikan prefix `NEXT_PUBLIC_` ada untuk client-side variables
3. Redeploy setelah menambah/update env variables

### **Firebase Auth Error di Production**

**Cek:**
1. Domain Vercel sudah ditambahkan ke Firebase Authorized Domains
2. Environment variables sudah benar
3. Firebase project ID sesuai

### **Map Tidak Muncul di Production**

**Cek:**
1. Leaflet CSS sudah di-import di `globals.css` ✅
2. Dynamic import sudah benar dengan `ssr: false` ✅
3. Cek Console browser untuk error

## 📊 Monitoring

Setelah deploy, monitor aplikasi Anda:

1. **Vercel Analytics**
   - Settings → Analytics → Enable

2. **Vercel Logs**
   - Deployments → [deployment] → Runtime Logs

3. **Firebase Console**
   - Authentication → Users (untuk monitor login)
   - Analytics (jika enabled)

## 🔄 Continuous Deployment

Vercel otomatis deploy setiap kali Anda push ke Git:

- **Push ke `main`** → Deploy ke Production
- **Push ke branch lain** → Deploy ke Preview
- **Pull Request** → Deploy ke Preview dengan unique URL

## 📱 Custom Domain (Optional)

Jika ingin menggunakan domain sendiri:

1. Buka project di Vercel
2. Settings → Domains
3. Add domain Anda
4. Update DNS records sesuai instruksi
5. Tambahkan domain ke Firebase Authorized Domains

---

## ✅ Checklist Deploy

- [ ] Code sudah di-commit dan push ke Git
- [ ] Project di-import ke Vercel
- [ ] Semua 6 environment variables ditambahkan
- [ ] Deploy berhasil
- [ ] Domain Vercel ditambahkan ke Firebase Authorized Domains
- [ ] Test login dengan Google
- [ ] Map muncul dengan benar
- [ ] Logout berfungsi

---

**Selamat! Aplikasi Anda sudah live di production!** 🚀

URL Production: `https://your-project.vercel.app`
