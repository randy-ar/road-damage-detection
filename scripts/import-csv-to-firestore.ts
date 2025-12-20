import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

// Interface untuk data kerusakan jalan
interface RoadDamageData {
  id: number;
  kode_provinsi: string;
  nama_provinsi: string;
  kode_kabupaten_kota: string;
  nama_kabupaten_kota: string;
  latitude: number;
  longitude: number;
  berat: number;
  rusak_parah: number;
  rusak_sedang: number;
}

// Initialize Firebase Admin
if (getApps().length === 0) {
  // Untuk development, gunakan emulator atau service account
  // Jika menggunakan emulator, tidak perlu credential
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } else {
    // Untuk production, gunakan service account
    const serviceAccount = require(path.join(
      process.cwd(),
      "serviceAccountKey.json"
    ));
    initializeApp({
      credential: cert(serviceAccount),
    });
  }
}

const db = getFirestore();

async function importCSVToFirestore() {
  try {
    console.log("🚀 Memulai import data CSV ke Firestore...");

    // Baca file CSV
    const csvPath = path.join(
      process.cwd(),
      "public",
      "kerusakan_jalan_jabar.csv"
    );
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n");

    console.log(`📄 Total baris dalam CSV: ${lines.length}`);

    // Skip header (baris pertama)
    const dataLines = lines.slice(1);
    let batch = db.batch();
    let count = 0;
    let batchCount = 0;

    for (const line of dataLines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const values = trimmedLine.split(",");
      if (values.length < 10) continue;

      const data: RoadDamageData = {
        id: parseInt(values[0]),
        kode_provinsi: values[1],
        nama_provinsi: values[2],
        kode_kabupaten_kota: values[3],
        nama_kabupaten_kota: values[4],
        latitude: parseFloat(values[5]),
        longitude: parseFloat(values[6]),
        berat: parseInt(values[7]),
        rusak_parah: parseInt(values[8]),
        rusak_sedang: parseInt(values[9]),
      };

      // Validasi koordinat untuk Jawa Barat
      if (
        isNaN(data.latitude) ||
        isNaN(data.longitude) ||
        data.latitude < -8 ||
        data.latitude > -5.5 ||
        data.longitude < 106 ||
        data.longitude > 109
      ) {
        continue;
      }

      // Tambahkan ke batch
      const docRef = db.collection("road_damages").doc(`damage_${data.id}`);
      batch.set(docRef, data);
      count++;
      batchCount++;

      // Firestore batch limit adalah 500 operasi
      if (batchCount === 500) {
        await batch.commit();
        console.log(`✅ Berhasil import ${count} data...`);
        // Buat batch baru setelah commit
        batch = db.batch();
        batchCount = 0;
      }
    }

    // Commit sisa batch
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`✅ Import selesai! Total data yang diimport: ${count}`);

    // Buat agregasi per kabupaten
    await createKabupatenAggregation();
  } catch (error) {
    console.error("❌ Error saat import:", error);
    throw error;
  }
}

async function createKabupatenAggregation() {
  try {
    console.log("\n📊 Membuat agregasi data per kabupaten...");

    const snapshot = await db.collection("road_damages").get();
    const kabupatenStats: {
      [key: string]: {
        nama: string;
        total: number;
        parah: number;
        sedang: number;
        ringan: number;
      };
    } = {};

    snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data() as RoadDamageData;
      const kode = data.kode_kabupaten_kota;

      if (!kabupatenStats[kode]) {
        kabupatenStats[kode] = {
          nama: data.nama_kabupaten_kota,
          total: 0,
          parah: 0,
          sedang: 0,
          ringan: 0,
        };
      }

      kabupatenStats[kode].total++;
      if (data.berat === 1) {
        kabupatenStats[kode].parah++;
      } else if (data.rusak_sedang === 1) {
        kabupatenStats[kode].sedang++;
      } else {
        kabupatenStats[kode].ringan++;
      }
    });

    // Simpan agregasi ke collection terpisah
    const batch = db.batch();
    Object.entries(kabupatenStats).forEach(([kode, stats]) => {
      const docRef = db.collection("kabupaten_stats").doc(kode);
      batch.set(docRef, stats);
    });

    await batch.commit();
    console.log(
      `✅ Agregasi selesai! Total kabupaten: ${
        Object.keys(kabupatenStats).length
      }`
    );
  } catch (error) {
    console.error("❌ Error saat membuat agregasi:", error);
    throw error;
  }
}

// Jalankan import
importCSVToFirestore()
  .then(() => {
    console.log("\n🎉 Semua proses selesai!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Proses gagal:", error);
    process.exit(1);
  });
