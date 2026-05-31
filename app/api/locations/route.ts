import { created, fail, ok, validationError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { createLocationSchema, parseBbox } from "@/lib/validation";
import { getCurrentUser } from "@/server/auth/session";
import { createLocation, listDatasets, listLocations, toFeatureCollection } from "@/server/db/repositories";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const datasetIds = searchParams.get("datasetIds")?.split(",").filter(Boolean);
  const bbox = parseBbox(searchParams.get("bbox"));
  const locations = await listLocations({
    datasetIds,
    bbox,
    q: searchParams.get("q") ?? undefined,
    limit: Number(searchParams.get("limit") ?? 2000)
  });

  if (searchParams.get("format") === "geojson") {
    const datasets = await listDatasets({ limit: 100 });
    return ok(toFeatureCollection(locations, datasets));
  }

  return ok(locations);
}

export async function POST(request: Request) {
  const limiter = rateLimit(`locations:${request.headers.get("x-forwarded-for") ?? "local"}`, 100);
  if (!limiter.ok) return fail(429, "Rate limit exceeded.");

  const user = await getCurrentUser();
  if (!user) return fail(401, "Authentication required.");

  try {
    const body = createLocationSchema.parse(await request.json());
    const location = await createLocation(body, user.id);
    return created(location);
  } catch (error) {
    return validationError(error);
  }
}

