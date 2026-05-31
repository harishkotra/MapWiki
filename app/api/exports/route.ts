import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { getLocationsForDataset } from "@/server/db/repositories";
import { locationsToCsv, locationsToGeoJson, locationsToGpx, locationsToKml } from "@/services/exporter";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const datasetId = searchParams.get("datasetId");
  const format = searchParams.get("format") ?? "geojson";
  if (!datasetId) return fail(400, "datasetId is required.");

  const locations = await getLocationsForDataset(datasetId);

  if (format === "csv") {
    return new NextResponse(locationsToCsv(locations), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="mapwiki-${datasetId}.csv"`
      }
    });
  }

  if (format === "kml") {
    return new NextResponse(locationsToKml(locations), {
      headers: {
        "content-type": "application/vnd.google-earth.kml+xml; charset=utf-8",
        "content-disposition": `attachment; filename="mapwiki-${datasetId}.kml"`
      }
    });
  }

  if (format === "gpx") {
    return new NextResponse(locationsToGpx(locations), {
      headers: {
        "content-type": "application/gpx+xml; charset=utf-8",
        "content-disposition": `attachment; filename="mapwiki-${datasetId}.gpx"`
      }
    });
  }

  if (format === "json") {
    return NextResponse.json(locations);
  }

  return NextResponse.json(locationsToGeoJson(locations), {
    headers: {
      "content-disposition": `attachment; filename="mapwiki-${datasetId}.geojson"`
    }
  });
}

