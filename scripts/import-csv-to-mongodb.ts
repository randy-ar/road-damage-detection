import "dotenv/config";
import { getDatabase, COLLECTIONS } from "../lib/mongodb";
import type {
  RoadDamageDocument,
  KabupatenStatsDocument,
} from "../types/mongodb";
import * as fs from "fs";
import * as path from "path";

async function importCSVToMongoDB() {
  try {
    console.log("🚀 Memulai import data CSV ke MongoDB...");

    // Connect to MongoDB
    const db = await getDatabase();
    const roadDamagesCollection = db.collection<RoadDamageDocument>(
      COLLECTIONS.ROAD_DAMAGES
    );
    const kabupatenStatsCollection = db.collection<KabupatenStatsDocument>(
      COLLECTIONS.KABUPATEN_STATS
    );

    // Baca file CSV
    const csvPath = path.join(
      process.cwd(),
      "public",
      "csv",
      "road_damage_final.csv"
    );
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n");

    console.log(`📄 Total baris dalam CSV: ${lines.length}`);

    // Skip header (baris pertama)
    const dataLines = lines.slice(1);
    const documents: RoadDamageDocument[] = [];

    for (const line of dataLines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const values = trimmedLine.split(",");
      if (values.length < 11) continue;

      const choroplethId = values[10]?.trim();
      const data: RoadDamageDocument = {
        id: parseInt(values[0]),
        kode_provinsi: values[1],
        nama_provinsi: values[2],
        kode_kabupaten_kota: values[3],
        nama_kabupaten_kota: values[4],
        kode_kecamatan: values[5],
        nama_kecamatan: values[6],
        latitude: parseFloat(values[7]),
        longitude: parseFloat(values[8]),
        kerusakan: values[9] as "ringan" | "sedang" | "berat",
        choropleth: choroplethId
          ? {
              nama: values[6], // nama_kecamatan
              kode: choroplethId,
            }
          : undefined,
      } as RoadDamageDocument;

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

      documents.push(data);
    }

    console.log(`✅ Total data valid: ${documents.length}`);

    // Clear existing data
    console.log("🗑️  Menghapus data lama...");
    await roadDamagesCollection.deleteMany({});
    await kabupatenStatsCollection.deleteMany({});

    // Insert data menggunakan bulkWrite untuk performance
    console.log("📝 Menyimpan data ke MongoDB...");
    if (documents.length > 0) {
      const bulkOps = documents.map((doc) => ({
        insertOne: { document: doc },
      }));

      await roadDamagesCollection.bulkWrite(bulkOps);
      console.log(`✅ Berhasil import ${documents.length} data ke MongoDB!`);
    }

    // Create indexes untuk performance
    console.log("🔍 Membuat indexes...");
    await roadDamagesCollection.createIndex({ kode_kabupaten_kota: 1 });
    await roadDamagesCollection.createIndex({ kode_kecamatan: 1 });
    await roadDamagesCollection.createIndex({ "choropleth.kode": 1 });
    await roadDamagesCollection.createIndex({ kerusakan: 1 });
    console.log("✅ Indexes berhasil dibuat!");

    // Buat agregasi per kabupaten
    await createKabupatenAggregation(db);

    console.log("\n🎉 Import selesai!");
  } catch (error) {
    console.error("❌ Error saat import:", error);
    throw error;
  }
}

async function createKabupatenAggregation(
  db: Awaited<ReturnType<typeof getDatabase>>
) {
  try {
    console.log("\n📊 Membuat agregasi data per kabupaten...");

    const roadDamagesCollection = db.collection<RoadDamageDocument>(
      COLLECTIONS.ROAD_DAMAGES
    );
    const kabupatenStatsCollection = db.collection<KabupatenStatsDocument>(
      COLLECTIONS.KABUPATEN_STATS
    );

    // Gunakan aggregation pipeline untuk menghitung stats per kabupaten
    const aggregationResult = await roadDamagesCollection
      .aggregate<{
        _id: string;
        nama: string;
        total: number;
        parah: number;
        sedang: number;
        ringan: number;
      }>([
        {
          $group: {
            _id: "$kode_kabupaten_kota",
            nama: { $first: "$nama_kabupaten_kota" },
            total: { $sum: 1 },
            parah: {
              $sum: { $cond: [{ $eq: ["$kerusakan", "berat"] }, 1, 0] },
            },
            sedang: {
              $sum: { $cond: [{ $eq: ["$kerusakan", "sedang"] }, 1, 0] },
            },
            ringan: {
              $sum: { $cond: [{ $eq: ["$kerusakan", "ringan"] }, 1, 0] },
            },
          },
        },
      ])
      .toArray();

    // Insert hasil agregasi
    if (aggregationResult.length > 0) {
      const bulkOps = aggregationResult.map((stat) => ({
        replaceOne: {
          filter: { _id: stat._id },
          replacement: stat,
          upsert: true,
        },
      }));

      await kabupatenStatsCollection.bulkWrite(bulkOps);
      console.log(
        `✅ Agregasi selesai! Total kabupaten: ${aggregationResult.length}`
      );
    }
  } catch (error) {
    console.error("❌ Error saat membuat agregasi:", error);
    throw error;
  }
}

// Jalankan import
importCSVToMongoDB()
  .then(() => {
    console.log("\n✅ Semua proses selesai!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Proses gagal:", error);
    process.exit(1);
  });
