# Import CSV ke Firebase Firestore

Dokumentasi untuk mengimport data kerusakan jalan dari CSV ke Firebase Firestore.

## Prerequisites

1. **Firebase Project**: Pastikan Anda sudah memiliki Firebase project
2. **Service Account Key**: Download service account key dari Firebase Console
3. **Environment Variables**: Pastikan file `.env.local` sudah dikonfigurasi

## Setup

### 1. Konfigurasi Firebase

Buat file `.env.local` di root project dengan isi:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Service Account Key (untuk Production)

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Anda
3. Klik ⚙️ (Settings) → Project settings
4. Tab "Service accounts"
5. Klik "Generate new private key"
6. Simpan file JSON sebagai `serviceAccountKey.json` di root project
7. **PENTING**: Tambahkan `serviceAccountKey.json` ke `.gitignore`

### 3. Menggunakan Firestore Emulator (untuk Development)

Jika ingin testing tanpa menggunakan Firebase production:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login ke Firebase
firebase login

# Initialize Firebase
firebase init emulators

# Pilih Firestore emulator
# Jalankan emulator
firebase emulators:start
```

Set environment variable:
```bash
export FIRESTORE_EMULATOR_HOST="localhost:8080"
```

## Import Data

### Jalankan Script Import

```bash
npm run import-csv
```

Script ini akan:
1. ✅ Membaca file `public/kerusakan_jalan_jabar.csv`
2. ✅ Validasi data (koordinat Jawa Barat)
3. ✅ Import ke collection `road_damages`
4. ✅ Membuat agregasi per kabupaten di collection `kabupaten_stats`

### Output yang Diharapkan

```
🚀 Memulai import data CSV ke Firestore...
📄 Total baris dalam CSV: 1786
✅ Berhasil import 500 data...
✅ Berhasil import 1000 data...
✅ Berhasil import 1500 data...
✅ Import selesai! Total data yang diimport: 1785

📊 Membuat agregasi data per kabupaten...
✅ Agregasi selesai! Total kabupaten: 27

🎉 Semua proses selesai!
```

## Struktur Data di Firestore

### Collection: `road_damages`

Document ID: `damage_{id}`

```typescript
{
  id: number;
  kode_provinsi: string;
  nama_provinsi: string;
  kode_kabupaten_kota: string;
  nama_kabupaten_kota: string;
  latitude: number;
  longitude: number;
  berat: number;           // 1 = rusak berat, 0 = tidak
  rusak_parah: number;     // 1 = rusak parah, 0 = tidak
  rusak_sedang: number;    // 1 = rusak sedang, 0 = tidak
}
```

### Collection: `kabupaten_stats`

Document ID: `{kode_kabupaten}`

```typescript
{
  nama: string;
  total: number;
  parah: number;
  sedang: number;
  ringan: number;
}
```

## API Endpoints

### 1. Get All Road Damages

```
GET /api/road-damages
```

Response:
```json
{
  "success": true,
  "count": 1785,
  "data": [...]
}
```

### 2. Get Road Damages by Kabupaten

```
GET /api/road-damages?kabupaten=3201
```

### 3. Get All Kabupaten Statistics

```
GET /api/kabupaten-stats
```

Response:
```json
{
  "success": true,
  "summary": {
    "total": 1785,
    "critical": 583,
    "moderate": 588,
    "minor": 614
  },
  "data": {
    "3201": {
      "nama": "KABUPATEN BOGOR",
      "total": 100,
      "parah": 30,
      "sedang": 35,
      "ringan": 35
    },
    ...
  }
}
```

### 4. Get Specific Kabupaten Statistics

```
GET /api/kabupaten-stats?kode=3201
```

## Menggunakan API di Dashboard

Update `DashboardChoropleth.tsx` untuk menggunakan API:

```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch dari API instead of CSV
      const response = await fetch('/api/kabupaten-stats');
      const result = await response.json();

      if (result.success) {
        setKabupatenStats(result.data);

        // Call callback with summary
        if (onStatsCalculated) {
          onStatsCalculated(result.summary);
        }
      }

      // Load TopoJSON...
      // ... rest of the code
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, []);
```

## Troubleshooting

### Error: "Permission denied"

Pastikan Firestore rules mengizinkan read/write:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /road_damages/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /kabupaten_stats/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Error: "Cannot find module 'firebase-admin'"

```bash
npm install --save-dev firebase-admin tsx
```

### Error: "serviceAccountKey.json not found"

Gunakan Firestore emulator atau download service account key dari Firebase Console.

## Security Best Practices

1. ✅ Jangan commit `serviceAccountKey.json` ke Git
2. ✅ Gunakan environment variables untuk konfigurasi
3. ✅ Set Firestore security rules yang proper
4. ✅ Gunakan emulator untuk development
5. ✅ Limit API rate untuk production

## Next Steps

1. Implementasi caching untuk API responses
2. Tambahkan pagination untuk large datasets
3. Implementasi real-time updates dengan Firestore listeners
4. Tambahkan authentication untuk write operations
