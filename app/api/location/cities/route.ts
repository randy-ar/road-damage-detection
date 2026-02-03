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
    NAME_2: string;
    TYPE_2: string;
    CC_2: string;
    [key: string]: string;
  };
}

interface GadmData {
  type: string;
  name: string;
  features: GadmFeature[];
}

export async function GET(): Promise<NextResponse<LocationResponse>> {
  try {
    // Read the GADM JSON file from public folder
    const filePath = path.join(
      process.cwd(),
      "public/choropleth/gadm41_JABAR_2.json",
    );
    const fileContent = await fs.readFile(filePath, "utf-8");
    const gadmData: GadmData = JSON.parse(fileContent);

    // Map features to extract name and code
    const cities: Location[] = gadmData.features.map((feature) => ({
      code: feature.properties.CC_2,
      name: `${feature.properties.TYPE_2} ${feature.properties.NAME_2}`,
    }));

    // Sort by name
    cities.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ data: cities });
  } catch (error) {
    console.error("Error reading GADM data:", error);
    return NextResponse.json({ data: [] });
  }
}
