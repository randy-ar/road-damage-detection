# Troubleshooting Firebase Permission Error

## Error: "Missing or insufficient permissions"

```
Error [FirebaseError]: Missing or insufficient permissions.
code: 'permission-denied'
```

### Penyebab
Firestore rules tidak mengizinkan akses read dari client-side.

### Solusi

1. **Buka Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Pilih project Anda
   - Klik **Firestore Database** di sidebar kiri
   - Klik tab **Rules**

2. **Update Firestore Rules**
   
   Ganti rules dengan:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read access to road_damages collection
       match /road_damages/{document=**} {
         allow read: if true;  // Public read access
         allow write: if request.auth != null;  // Only authenticated users can write
       }
       
       // Allow read access to kabupaten_stats collection
       match /kabupaten_stats/{document=**} {
         allow read: if true;  // Public read access
         allow write: if request.auth != null;  // Only authenticated users can write
       }
     }
   }
   ```

3. **Publish Rules**
   - Klik tombol **Publish** di Firebase Console
   - Tunggu beberapa detik hingga rules aktif

4. **Test API**
   ```bash
   # Test di browser atau curl
   curl http://localhost:3000/api/road-damages
   curl http://localhost:3000/api/kabupaten-stats
   ```

### Penjelasan Rules

- **`allow read: if true`**: Mengizinkan siapa saja membaca data (public read)
- **`allow write: if request.auth != null`**: Hanya user yang sudah login yang bisa menulis data
- **`{document=**}`**: Berlaku untuk semua dokumen dan sub-collection

### Security Considerations

⚠️ **PENTING**: Rules di atas mengizinkan public read access. Untuk production, pertimbangkan:

1. **Rate Limiting**: Implementasi rate limiting di API
2. **Authentication**: Require authentication untuk sensitive data
3. **Field-level Security**: Batasi field yang bisa diakses

### Alternative: Secure Rules

Jika ingin lebih secure (require authentication):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /road_damages/{document=**} {
      allow read: if request.auth != null;  // Require login
      allow write: if request.auth != null;
    }
    
    match /kabupaten_stats/{document=**} {
      allow read: if request.auth != null;  // Require login
      allow write: if request.auth != null;
    }
  }
}
```

Dengan rules ini, user harus login dulu sebelum bisa akses data.

## Verifikasi

Setelah update rules, cek di browser console:

```javascript
// Buka browser console di http://localhost:3000/dashboard
// Seharusnya tidak ada error "permission-denied" lagi
```

## Next Steps

1. ✅ Update Firestore rules
2. ✅ Publish rules
3. ✅ Test API endpoints
4. ✅ Verify dashboard loads data correctly
