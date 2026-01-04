import { NextRequest, NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import type { KabupatenStatsDocument } from "@/types/mongodb";

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

    // Connect to MongoDB
    const db = await getDatabase();
    const kabupatenStatsCollection = db.collection<KabupatenStatsDocument>(
      COLLECTIONS.KABUPATEN_STATS
    );

    // Jika ada parameter kode, cari berdasarkan kode kabupaten (ID)
    if (kode) {
      const stats = await kabupatenStatsCollection.findOne({ _id: kode });

      if (stats) {
        return NextResponse.json({
          success: true,
          data: {
            id: stats._id,
            nama: stats.nama,
            data: {
              total: stats.total,
              parah: stats.parah,
              sedang: stats.sedang,
              ringan: stats.ringan,
            },
          },
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
      const stats = await kabupatenStatsCollection.findOne({
        nama: { $regex: new RegExp(`^${searchTerm}$`, "i") },
      });

      if (stats) {
        return NextResponse.json({
          success: true,
          data: {
            id: stats._id,
            nama: stats.nama,
            data: {
              total: stats.total,
              parah: stats.parah,
              sedang: stats.sedang,
              ringan: stats.ringan,
            },
          },
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

    // Jika tidak ada parameter, return semua data dengan summary
    const allStats = await kabupatenStatsCollection.find({}).toArray();

    // Hitung total statistik
    let totalCount = 0;
    let criticalCount = 0;
    let moderateCount = 0;
    let minorCount = 0;

    const statsArray: KabupatenStatsItem[] = allStats.map((stat) => {
      totalCount += stat.total;
      criticalCount += stat.parah;
      moderateCount += stat.sedang;
      minorCount += stat.ringan;

      return {
        id: stat._id,
        nama: stat.nama,
        data: {
          total: stat.total,
          parah: stat.parah,
          sedang: stat.sedang,
          ringan: stat.ringan,
        },
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: totalCount,
        critical: criticalCount,
        moderate: moderateCount,
        minor: minorCount,
      },
      data: statsArray,
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
