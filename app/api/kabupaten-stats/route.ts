import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export interface KabupatenStats {
  total: number;
  parah: number;
  sedang: number;
  ringan: number;
}

export interface KabupatenStatsItem {
  id: string;
  nama: string;
  data: KabupatenStats;
}

export interface KabupatenStatsMap {
  [kode: string]: KabupatenStatsItem;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kode = searchParams.get("kode");
    const kabupaten = searchParams.get("kabupaten");

    // Ambil semua data dari collection road_damages
    const roadDamagesRef = collection(db, "road_damages");
    const snapshot = await getDocs(roadDamagesRef);

    // Interface untuk data road damage
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

    // Grouping data berdasarkan kode_kabupaten_kota
    const stats: KabupatenStatsMap = {};

    snapshot.forEach((doc) => {
      const data = doc.data() as RoadDamageData;
      const kodeKab = data.kode_kabupaten_kota;

      // Inisialisasi stats untuk kabupaten jika belum ada
      if (!stats[kodeKab]) {
        stats[kodeKab] = {
          id: kodeKab,
          nama: data.nama_kabupaten_kota,
          data: { total: 0, parah: 0, sedang: 0, ringan: 0 },
        };
      }

      // Increment total
      stats[kodeKab].data.total++;

      // Kategorikan berdasarkan tingkat kerusakan
      if (data.berat === 1) {
        stats[kodeKab].data.parah++;
      } else if (data.rusak_sedang === 1) {
        stats[kodeKab].data.sedang++;
      } else {
        stats[kodeKab].data.ringan++;
      }
    });

    // Jika ada parameter kode, cari berdasarkan kode kabupaten (ID)
    if (kode) {
      if (stats[kode]) {
        return NextResponse.json({
          success: true,
          data: stats[kode],
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Kabupaten not found",
          },
          { status: 404 }
        );
      }
    }

    // Jika ada parameter kabupaten, cari berdasarkan nama kabupaten (string, case-insensitive)
    if (kabupaten) {
      const searchTerm = kabupaten.toUpperCase();
      const foundEntry = Object.entries(stats).find(
        ([_, kabStats]) => kabStats.nama?.toUpperCase() === searchTerm
      );

      if (foundEntry) {
        const [_, foundStats] = foundEntry;
        return NextResponse.json({
          success: true,
          data: foundStats,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Kabupaten not found",
          },
          { status: 404 }
        );
      }
    }

    // Hitung total statistik
    let totalCount = 0;
    let criticalCount = 0;
    let moderateCount = 0;
    let minorCount = 0;

    Object.values(stats).forEach((kabStat) => {
      totalCount += kabStat.data.total;
      criticalCount += kabStat.data.parah;
      moderateCount += kabStat.data.sedang;
      minorCount += kabStat.data.ringan;
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: totalCount,
        critical: criticalCount,
        moderate: moderateCount,
        minor: minorCount,
      },
      data: Object.values(stats),
    });
  } catch (error) {
    console.error("Error fetching kabupaten stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch kabupaten statistics",
      },
      { status: 500 }
    );
  }
}
