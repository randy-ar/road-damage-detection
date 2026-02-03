import { NextRequest, NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { uploadImage } from "@/lib/supabase";
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
    // Parse FormData for file upload
    const formData = await request.formData();

    // Get form fields
    const kode_provinsi = formData.get("kode_provinsi") as string;
    const nama_provinsi = formData.get("nama_provinsi") as string;
    const kode_kabupaten_kota = formData.get("kode_kabupaten_kota") as string;
    const nama_kabupaten_kota = formData.get("nama_kabupaten_kota") as string;
    const kode_kecamatan = formData.get("kode_kecamatan") as string;
    const nama_kecamatan = formData.get("nama_kecamatan") as string;
    const latitude = parseFloat(formData.get("latitude") as string) || 0;
    const longitude = parseFloat(formData.get("longitude") as string) || 0;
    const damage_class = formData.get("damage_class") as string;
    const confidence = parseFloat(formData.get("confidence") as string) || 0;
    const image_size = formData.get("image_size") as string;
    const image_width = parseInt(formData.get("image_width") as string) || 0;
    const image_height = parseInt(formData.get("image_height") as string) || 0;
    const processing_time =
      parseFloat(formData.get("processing_time") as string) || 0;
    const imageFile = formData.get("image") as File | null;

    // Validate required fields
    const requiredFields = {
      kode_provinsi,
      nama_provinsi,
      kode_kabupaten_kota,
      nama_kabupaten_kota,
      kode_kecamatan,
      nama_kecamatan,
      damage_class,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    // Upload image to Supabase Storage if provided
    let imageUrl: string | null = null;
    let imagePath: string | null = null;

    if (imageFile) {
      // Convert File to Buffer
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase
      const uploadResult = await uploadImage(
        buffer,
        imageFile.name,
        imageFile.type,
      );

      if (uploadResult) {
        imageUrl = uploadResult.url;
        imagePath = uploadResult.path;
      } else {
        console.warn(
          "Failed to upload image to storage, continuing without image URL",
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
    const kerusakan = damage_class.toLowerCase();

    const newDocument: Omit<RoadDamageDocument, "_id"> = {
      id: nextId,
      kode_provinsi,
      nama_provinsi,
      kode_kabupaten_kota: kode_kabupaten_kota.split(".").join(""),
      nama_kabupaten_kota,
      kode_kecamatan,
      nama_kecamatan,
      latitude,
      longitude,
      kerusakan,
      choropleth: {
        nama: nama_kecamatan,
        kode: kode_kecamatan,
      },
      // Additional metadata
      damage_class,
      confidence,
      image_size,
      image_width,
      image_height,
      processing_time,
      // Image storage info
      image_url: imageUrl,
      image_path: imagePath,
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
        image_url: imageUrl,
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
