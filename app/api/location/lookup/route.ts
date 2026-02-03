import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface LookupResponse {
  success: boolean;
  data?: {
    center: {
      latitude: number;
      longitude: number;
    };
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
    name: string;
    code: string;
  };
  error?: string;
}

interface GadmFeature {
  type: string;
  properties: {
    GID_2?: string;
    GID_3?: string;
    NAME_2?: string;
    NAME_3?: string;
    TYPE_2?: string;
    TYPE_3?: string;
    CC_2?: string;
    CC_3?: string;
    [key: string]: string | undefined;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

interface GadmData {
  type: string;
  name: string;
  features: GadmFeature[];
}

/**
 * Calculate centroid and bounds from polygon coordinates
 */
function calculateCentroidAndBounds(
  coordinates: number[][][] | number[][][][],
) {
  let allPoints: [number, number][] = [];

  // Flatten coordinates to get all points
  const flattenCoords = (coords: unknown): void => {
    if (Array.isArray(coords)) {
      if (
        coords.length >= 2 &&
        typeof coords[0] === "number" &&
        typeof coords[1] === "number"
      ) {
        // This is a point [lng, lat]
        allPoints.push([coords[0] as number, coords[1] as number]);
      } else {
        // This is an array of something else, recurse
        coords.forEach(flattenCoords);
      }
    }
  };

  flattenCoords(coordinates);

  if (allPoints.length === 0) {
    return null;
  }

  // Calculate centroid (average of all points)
  let sumLat = 0;
  let sumLng = 0;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const [lng, lat] of allPoints) {
    sumLat += lat;
    sumLng += lng;
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  return {
    center: {
      latitude: sumLat / allPoints.length,
      longitude: sumLng / allPoints.length,
    },
    bounds: {
      north: maxLat,
      south: minLat,
      east: maxLng,
      west: minLng,
    },
  };
}

export async function GET(
  request: Request,
): Promise<NextResponse<LookupResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const cityCode = searchParams.get("city");
    const districtCode = searchParams.get("district");

    if (!cityCode && !districtCode) {
      return NextResponse.json({
        success: false,
        error: "Either city or district code is required",
      });
    }

    // Determine which file to read based on granularity
    let filePath: string;
    let searchCode: string;
    let isDistrict = false;

    if (districtCode) {
      // Look up district (level 3)
      filePath = path.join(
        process.cwd(),
        "public/choropleth/gadm41_JABAR_3.json",
      );
      searchCode = districtCode;
      isDistrict = true;
    } else {
      // Look up city (level 2)
      filePath = path.join(
        process.cwd(),
        "public/choropleth/gadm41_JABAR_2.json",
      );
      searchCode = cityCode!;
    }

    const fileContent = await fs.readFile(filePath, "utf-8");
    const gadmData: GadmData = JSON.parse(fileContent);

    // Find the feature matching the code
    const feature = gadmData.features.find((f) => {
      if (isDistrict) {
        return f.properties.CC_3 === searchCode;
      } else {
        return f.properties.CC_2 === searchCode;
      }
    });

    if (!feature) {
      return NextResponse.json({
        success: false,
        error: `Location not found for code: ${searchCode}`,
      });
    }

    // Calculate centroid and bounds
    const result = calculateCentroidAndBounds(feature.geometry.coordinates);

    if (!result) {
      return NextResponse.json({
        success: false,
        error: "Could not calculate location coordinates",
      });
    }

    // Get name based on level
    const name = isDistrict
      ? feature.properties.NAME_3 || ""
      : `${feature.properties.TYPE_2 || ""} ${feature.properties.NAME_2 || ""}`.trim();

    return NextResponse.json({
      success: true,
      data: {
        center: result.center,
        bounds: result.bounds,
        name,
        code: searchCode,
      },
    });
  } catch (error) {
    console.error("Error in location lookup:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to lookup location",
    });
  }
}
