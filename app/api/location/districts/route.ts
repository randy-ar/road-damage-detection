import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface LocationResponse {
  data: Location[];
}

interface Location {
  code: string;
  name: string;
}

interface GadmFeature {
  type: string;
  properties: {
    GID_2: string;
    GID_3: string;
    NAME_2: string;
    NAME_3: string;
    TYPE_3: string;
    CC_3: string;
    [key: string]: string;
  };
}

interface GadmData {
  type: string;
  name: string;
  features: GadmFeature[];
}

export async function GET(
  request: Request,
): Promise<NextResponse<LocationResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const cityCode = searchParams.get("code");

    if (!cityCode) {
      return NextResponse.json({ data: [] });
    }

    // Read the GADM JSON file from public folder
    const filePath = path.join(
      process.cwd(),
      "public/choropleth/gadm41_JABAR_3.json",
    );
    const fileContent = await fs.readFile(filePath, "utf-8");
    const gadmData: GadmData = JSON.parse(fileContent);

    // Filter features by city code (CC_3 starts with city code) and exclude water bodies
    const districts: Location[] = gadmData.features
      .filter((feature) => {
        const cc3 = feature.properties.CC_3;
        const type3 = feature.properties.TYPE_3;
        // CC_3 starts with city code (e.g., "3204" matches "320401", "320402", etc.)
        // Exclude water bodies and other non-district types
        return cc3.startsWith(cityCode) && type3 !== "WaterBody";
      })
      .map((feature) => ({
        code: feature.properties.CC_3,
        name: feature.properties.NAME_3,
      }));

    // Sort by name
    districts.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ data: districts });
  } catch (error) {
    console.error("Error reading GADM data:", error);
    return NextResponse.json({ data: [] });
  }
}
