import { NextRequest, NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import type { RoadDamageDocument } from "@/types/mongodb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kabupaten = searchParams.get("kabupaten");

    // Connect to MongoDB
    const db = await getDatabase();
    const roadDamagesCollection = db.collection<RoadDamageDocument>(
      COLLECTIONS.ROAD_DAMAGES
    );

    // Build query filter
    const filter: Record<string, string> = {};
    if (kabupaten) {
      filter.kode_kabupaten_kota = kabupaten;
    }

    // Fetch road damages
    const roadDamages = await roadDamagesCollection.find(filter).toArray();

    return NextResponse.json({
      success: true,
      count: roadDamages.length,
      data: roadDamages,
    });
  } catch (error) {
    console.error("Error fetching road damages:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch road damage data",
      },
      { status: 500 }
    );
  }
}
