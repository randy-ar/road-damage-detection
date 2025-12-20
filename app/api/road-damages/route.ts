import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export interface RoadDamageData {
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kabupaten = searchParams.get("kabupaten");

    const roadDamagesRef = collection(db, "road_damages");
    const snapshot = await getDocs(roadDamagesRef);

    const data: RoadDamageData[] = [];

    snapshot.forEach((doc) => {
      const damageData = doc.data() as RoadDamageData;

      // Filter by kabupaten if specified
      if (kabupaten && damageData.kode_kabupaten_kota !== kabupaten) {
        return;
      }

      data.push(damageData);
    });

    return NextResponse.json({
      success: true,
      count: data.length,
      data: data,
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
