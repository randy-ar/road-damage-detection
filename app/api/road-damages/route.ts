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
      COLLECTIONS.ROAD_DAMAGES,
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
      { status: 500 },
    );
  }
}

interface CreateRoadDamageRequest {
  kode_provinsi: string;
  nama_provinsi: string;
  kode_kabupaten_kota: string;
  nama_kabupaten_kota: string;
  kode_kecamatan: string;
  nama_kecamatan: string;
  latitude: number;
  longitude: number;
  damage_class: string;
  confidence: number;
  image_size: string;
  image_width: number;
  image_height: number;
  processing_time: number;
}

function mapDamageClassToKerusakan(
  damageClass: string,
): "ringan" | "sedang" | "berat" {
  // Map detection class to kerusakan level
  // D00, D01 = ringan (longitudinal/transverse cracks)
  // D10, D11 = sedang (alligator/rutting cracks)
  // D20, D40, D43, D44 = berat (potholes, white lines loss, crosswalk blur)
  const damageClassUpper = damageClass.toUpperCase();

  if (damageClassUpper.includes("D00") || damageClassUpper.includes("D01")) {
    return "ringan";
  } else if (
    damageClassUpper.includes("D10") ||
    damageClassUpper.includes("D11")
  ) {
    return "sedang";
  } else {
    return "berat";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateRoadDamageRequest = await request.json();

    // Validate required fields
    const requiredFields = [
      "kode_provinsi",
      "nama_provinsi",
      "kode_kabupaten_kota",
      "nama_kabupaten_kota",
      "kode_kecamatan",
      "nama_kecamatan",
      "latitude",
      "longitude",
      "damage_class",
      "confidence",
    ];

    for (const field of requiredFields) {
      if (!(field in body)) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    // Connect to MongoDB
    const db = await getDatabase();
    const roadDamagesCollection = db.collection<RoadDamageDocument>(
      COLLECTIONS.ROAD_DAMAGES,
    );

    // Get the next ID
    const lastDoc = await roadDamagesCollection
      .find({})
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    const nextId = lastDoc.length > 0 ? (lastDoc[0].id || 0) + 1 : 1;

    // Create the document
    const kerusakan = body.damage_class.toLowerCase();

    const newDocument: Omit<RoadDamageDocument, "_id"> = {
      id: nextId,
      kode_provinsi: body.kode_provinsi,
      nama_provinsi: body.nama_provinsi,
      kode_kabupaten_kota: body.kode_kabupaten_kota.split(".").join(""),
      nama_kabupaten_kota: body.nama_kabupaten_kota,
      kode_kecamatan: body.kode_kecamatan,
      nama_kecamatan: body.nama_kecamatan,
      latitude: body.latitude,
      longitude: body.longitude,
      kerusakan,
      choropleth: {
        nama: body.nama_kecamatan,
        kode: body.kode_kecamatan,
      },
      // Additional metadata
      damage_class: body.damage_class,
      confidence: body.confidence,
      image_size: body.image_size,
      image_width: body.image_width,
      image_height: body.image_height,
      processing_time: body.processing_time,
      created_at: new Date(),
    };

    const result = await roadDamagesCollection.insertOne(
      newDocument as RoadDamageDocument,
    );

    return NextResponse.json({
      success: true,
      message: "Road damage data saved successfully",
      data: {
        _id: result.insertedId,
        id: nextId,
        kerusakan,
      },
    });
  } catch (error) {
    console.error("Error saving road damage:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save road damage data",
      },
      { status: 500 },
    );
  }
}
