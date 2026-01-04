import { NextRequest, NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import type { RoadDamageDocument } from "@/types/mongodb";

export interface KecamatanStats {
  total: number;
  parah: number;
  sedang: number;
  ringan: number;
}

export interface KecamatanStatsItem {
  id: string;
  nama: string;
  data: KecamatanStats;
}

export interface KecamatanStatsMap {
  [kode: string]: KecamatanStatsItem;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kode = searchParams.get("kode");
    const kecamatan = searchParams.get("kecamatan");

    // Connect to MongoDB
    const db = await getDatabase();
    const roadDamagesCollection = db.collection<RoadDamageDocument>(
      COLLECTIONS.ROAD_DAMAGES
    );

    // Aggregate data by kecamatan
    const aggregationPipeline: object[] = [
      {
        $group: {
          _id: "$kode_kecamatan",
          nama: { $first: "$nama_kecamatan" },
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
    ];

    // Jika ada parameter kode, filter berdasarkan kode kecamatan
    if (kode) {
      aggregationPipeline.unshift({
        $match: { kode_kecamatan: kode },
      });

      const result = await roadDamagesCollection
        .aggregate(aggregationPipeline)
        .toArray();

      if (result.length > 0) {
        const stats = result[0];
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
            error: "Kecamatan not found",
          },
          { status: 404 }
        );
      }
    }

    // Jika ada parameter kecamatan, cari berdasarkan nama kecamatan (case-insensitive)
    if (kecamatan) {
      const searchTerm = kecamatan.toUpperCase();
      aggregationPipeline.unshift({
        $match: {
          nama_kecamatan: { $regex: new RegExp(`^${searchTerm}$`, "i") },
        },
      });

      const result = await roadDamagesCollection
        .aggregate(aggregationPipeline)
        .toArray();

      if (result.length > 0) {
        const stats = result[0];
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
            error: "Kecamatan not found",
          },
          { status: 404 }
        );
      }
    }

    // Jika tidak ada parameter, return semua data dengan summary
    const allStats = await roadDamagesCollection
      .aggregate(aggregationPipeline)
      .toArray();

    // Hitung total statistik
    let totalCount = 0;
    let criticalCount = 0;
    let moderateCount = 0;
    let minorCount = 0;

    const statsArray: KecamatanStatsItem[] = allStats.map((stat) => {
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
    console.error("Error fetching kecamatan stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch kecamatan statistics",
      },
      { status: 500 }
    );
  }
}
