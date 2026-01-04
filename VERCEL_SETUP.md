# Vercel Deployment Setup untuk MongoDB Atlas

## 🔧 MongoDB Atlas Configuration

### 1. Network Access - Allow dari Vercel

Di MongoDB Atlas Dashboard:

1. Buka **Network Access** (sidebar kiri)
2. Klik **Add IP Address**
3. Pilih **ALLOW ACCESS FROM ANYWHERE** atau `0.0.0.0/0`
   - Ini diperlukan karena Vercel menggunakan dynamic IP addresses
   - Aman karena tetap memerlukan username/password
4. Klik **Confirm**

### 2. Database User - Pastikan Credentials Benar

1. Buka **Database Access**
2. Pastikan user `randy10122416_db_user` ada dan aktif
3. Jika perlu, reset password dan update di Vercel environment variables

### 3. Connection String - Format untuk Serverless

Connection string harus dalam format:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority&appName=<appName>
```

**Current:**
```
mongodb+srv://randy10122416_db_user:gXsEgRtdJAlYMpbI@cluster0.arskwla.mongodb.net/?appName=Cluster0
```

**Recommended (with additional params):**
```
mongodb+srv://randy10122416_db_user:gXsEgRtdJAlYMpbI@cluster0.arskwla.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

---

## 🚀 Vercel Environment Variables

Di Vercel Project Settings → Environment Variables, tambahkan:

### Production Environment
```
MONGODB_URI=mongodb+srv://randy10122416_db_user:gXsEgRtdJAlYMpbI@cluster0.arskwla.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=road_damage_detection
```

### Preview & Development (Optional)
Gunakan nilai yang sama atau database terpisah untuk testing.

---

## ✅ Verification Steps

### 1. Test Connection di Local
```bash
npm run dev
curl http://localhost:3000/api/road-damages
```

### 2. Deploy ke Vercel
```bash
git add .
git commit -m "Fix MongoDB connection for Vercel"
git push
```

### 3. Check Vercel Logs
- Buka Vercel Dashboard
- Pilih deployment terbaru
- Check **Functions** logs untuk error messages
- Pastikan tidak ada SSL/TLS errors

### 4. Test Production API
```bash
curl https://your-app.vercel.app/api/road-damages
```

---

## 🔍 Troubleshooting

### Error: MongoServerSelectionError
**Cause:** IP tidak di-whitelist atau network access blocked

**Solution:**
1. MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (Allow from anywhere)
3. Wait 1-2 minutes untuk propagasi
4. Redeploy di Vercel

### Error: Authentication failed
**Cause:** Username/password salah atau user tidak punya akses

**Solution:**
1. MongoDB Atlas → Database Access
2. Verify user exists: `randy10122416_db_user`
3. Check password atau reset jika perlu
4. Update `MONGODB_URI` di Vercel environment variables
5. Redeploy

### Error: SSL/TLS errors
**Cause:** Connection options tidak compatible dengan serverless

**Solution:**
- ✅ Already fixed in `lib/mongodb.ts`
- Connection options sudah di-update untuk Vercel compatibility
- Includes: `tls: true`, `retryWrites: true`, timeouts, dll

### Error: Connection timeout
**Cause:** MongoDB cluster sleep atau network issue

**Solution:**
1. Check MongoDB Atlas cluster status (harus running)
2. Increase timeout di connection options (already done)
3. Verify connection string format

---

## 📊 Connection Options Explained

```typescript
{
  retryWrites: true,              // Auto-retry failed writes
  w: "majority",                  // Write concern untuk data consistency
  maxPoolSize: 10,                // Max connections (serverless optimal)
  minPoolSize: 1,                 // Min connections to keep alive
  maxIdleTimeMS: 10000,           // Close idle connections after 10s
  serverSelectionTimeoutMS: 10000, // Timeout untuk select server
  socketTimeoutMS: 45000,         // Socket timeout 45s (Vercel function limit)
  tls: true,                      // Enable TLS/SSL
}
```

---

## 🎯 Best Practices

1. **Always use environment variables** - Never hardcode credentials
2. **Use connection pooling** - Already configured in `lib/mongodb.ts`
3. **Set appropriate timeouts** - Match Vercel function limits (max 60s)
4. **Monitor Atlas metrics** - Check connection counts and performance
5. **Use indexes** - Already created during import for better performance

---

## 📝 Next Steps After Deployment

1. Monitor Vercel function logs untuk errors
2. Check MongoDB Atlas metrics untuk connection issues
3. Test all API endpoints di production
4. Verify choropleth map loads correctly
5. Monitor performance dan optimize jika perlu
