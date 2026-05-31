import { NextResponse } from "next/server";
import { validationError } from "@/lib/api";
import { checkRateLimits, rateLimitExceeded, rateLimitRules, withRateLimitHeaders } from "@/lib/rate-limit";
import { exportQuerySchema } from "@/lib/validation";
import { getLocationsForDataset } from "@/server/db/repositories";
import { locationsToCsv, locationsToGeoJson, locationsToGpx, locationsToKml } from "@/services/exporter";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const limiter = await checkRateLimits(request, rateLimitRules.export);
  if (!limiter.ok) return rateLimitExceeded(limiter);

  try {
    const { searchParams } = new URL(request.url);
    const { datasetId, format } = exportQuerySchema.parse(Object.fromEntries(searchParams));

    const locations = await getLocationsForDataset(datasetId);

    if (format === "csv") {
      return withRateLimitHeaders(new NextResponse(locationsToCsv(locations), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="mapwiki-${datasetId}.csv"`
        }
      }), limiter);
    }

    if (format === "kml") {
      return withRateLimitHeaders(new NextResponse(locationsToKml(locations), {
        headers: {
          "content-type": "application/vnd.google-earth.kml+xml; charset=utf-8",
          "content-disposition": `attachment; filename="mapwiki-${datasetId}.kml"`
        }
      }), limiter);
    }

    if (format === "gpx") {
      return withRateLimitHeaders(new NextResponse(locationsToGpx(locations), {
        headers: {
          "content-type": "application/gpx+xml; charset=utf-8",
          "content-disposition": `attachment; filename="mapwiki-${datasetId}.gpx"`
        }
      }), limiter);
    }

    if (format === "json") {
      return withRateLimitHeaders(NextResponse.json(locations), limiter);
    }

    return withRateLimitHeaders(NextResponse.json(locationsToGeoJson(locations), {
      headers: {
        "content-disposition": `attachment; filename="mapwiki-${datasetId}.geojson"`
      }
    }), limiter);
  } catch (error) {
    return validationError(error);
  }
}
