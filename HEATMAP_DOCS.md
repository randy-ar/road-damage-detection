# Visualisasi Heatmap Kerusakan Jalan Jawa Barat

## Fitur yang Ditambahkan

### 1. Choropleth Map (Default)

- Menampilkan peta dengan pewarnaan wilayah per kabupaten/kota
- Menggunakan data TopoJSON resmi untuk batas wilayah Indonesia
- Warna berdasarkan rasio kerusakan parah terhadap total kerusakan
- Skala warna: Hijau (rendah) → Kuning → Oranye → Merah (tinggi)
- Hover untuk highlight wilayah
- Klik untuk melihat detail statistik per kabupaten

**Kriteria Pewarnaan:**

- Abu-abu (tidak ada data)
- Hijau (<5% kerusakan parah)
- Kuning (5-10% kerusakan parah)
- Amber (10-20% kerusakan parah)
- Oranye (20-30% kerusakan parah)
- Merah (>30% kerusakan parah)

### 2. Heatmap

- Menampilkan heat layer berdasarkan intensitas kerusakan
- Intensitas berdasarkan tingkat kerusakan (parah = 1.0, sedang = 0.6, ringan = 0.3)
- Gradient warna: Hijau → Kuning → Oranye → Merah

### 3. Marker View

- Menampilkan marker individual untuk setiap lokasi kerusakan
- Marker berwarna sesuai tingkat kerusakan
- Popup dengan detail informasi

## Data Source

Data kerusakan jalan dibaca dari file CSV: `/public/kerusakan_jalan_jabar.csv`

### Struktur Data CSV:

```csv
id,kode_provinsi,nama_provinsi,kode_kabupaten_kota,nama_kabupaten_kota,latitude,longitude,berat,rusak_parah,rusak_sedang
```

### Kolom Penting:

- `latitude`, `longitude`: Koordinat lokasi kerusakan
- `berat`: Kerusakan ringan (1 = ya, 0 = tidak)
- `rusak_parah`: Kerusakan parah (1 = ya, 0 = tidak)
- `rusak_sedang`: Kerusakan sedang (1 = ya, 0 = tidak)

## Statistik Dashboard

Dashboard menampilkan 4 kartu statistik:

1. **Total Kerusakan** - Jumlah total data kerusakan
2. **Kerusakan Parah** - Jumlah kerusakan dengan tingkat parah
3. **Kerusakan Sedang** - Jumlah kerusakan dengan tingkat sedang
4. **Kerusakan Ringan** - Jumlah kerusakan dengan tingkat ringan

Statistik dihitung secara real-time dari data CSV.

## Teknologi yang Digunakan

- **React Leaflet** - Library peta interaktif
- **Leaflet.heat** - Plugin untuk heatmap layer
- **TopoJSON** - Format data untuk batas wilayah administratif
- **topojson-client** - Library untuk konversi TopoJSON ke GeoJSON
- **Next.js** - Framework React dengan SSR
- **TypeScript** - Type safety

## Catatan Implementasi

### Choropleth Map

Choropleth map menggunakan file TopoJSON resmi Indonesia (`indonesia-topojson-city-regency.json`) yang berisi batas wilayah administratif tingkat kabupaten/kota untuk seluruh Indonesia.

**Proses Rendering:**

1. Load data CSV kerusakan jalan
2. Agregasi data per kabupaten berdasarkan `kode_kabupaten_kota`
3. Load file TopoJSON Indonesia
4. Konversi TopoJSON ke GeoJSON menggunakan `topojson-client`
5. Filter hanya wilayah Jawa Barat (`NAME_1 === "Jawa Barat"`)
6. Gabungkan statistik kerusakan dengan data GeoJSON
7. Render polygon dengan pewarnaan berdasarkan rasio kerusakan parah

**Keuntungan menggunakan TopoJSON:**

- Batas wilayah yang akurat dan resmi
- File size lebih kecil dibanding GeoJSON
- Mudah di-maintain dan di-update

## Penggunaan Data Upload Pengguna

Untuk menggabungkan data yang diupload pengguna dengan data CSV:

1. Simpan data upload ke state atau database
2. Gabungkan dengan data CSV saat rendering
3. Update statistik dan visualisasi secara real-time

Contoh implementasi akan ditambahkan di fitur upload berikutnya.

