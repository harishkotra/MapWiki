import { created, fail, ok, validationError } from "@/lib/api";
import { checkRateLimits, rateLimitExceeded, rateLimitRules, withRateLimitHeaders } from "@/lib/rate-limit";
import { readJsonBody } from "@/lib/request-guards";
import { checkSpam } from "@/lib/spam";
import { createLocationSchema, locationQuerySchema, parseBbox } from "@/lib/validation";
import { getCurrentOrAnonymousUser } from "@/server/auth/anonymous";
import { createLocation, listDatasets, listLocations, toFeatureCollection } from "@/server/db/repositories";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const limiter = await checkRateLimits(request, rateLimitRules.apiRead);
  if (!limiter.ok) return rateLimitExceeded(limiter);

  try {
    const { searchParams } = new URL(request.url);
    const query = locationQuerySchema.parse(Object.fromEntries(searchParams));
    const bbox = parseBbox(query.bbox ?? null);
    if (query.bbox && !bbox) return fail(422, "Invalid bbox parameter.");
    const locations = await listLocations({
      datasetIds: query.datasetIds,
      bbox,
      q: query.q,
      limit: query.limit
    });

    if (query.format === "geojson") {
      const datasets = await listDatasets({ limit: 100 });
      return withRateLimitHeaders(ok(toFeatureCollection(locations, datasets)), limiter);
    }

    return withRateLimitHeaders(ok(locations), limiter);
  } catch (error) {
    return validationError(error);
  }
}

export async function POST(request: Request) {
  const limiter = await checkRateLimits(request, [rateLimitRules.locationCreateBurst, rateLimitRules.locationCreateDaily]);
  if (!limiter.ok) return rateLimitExceeded(limiter);

  try {
    const json = await readJsonBody(request, 256 * 1024);
    if (!json.ok) return json.response;

    const raw = json.data && typeof json.data === "object" ? (json.data as Record<string, unknown>) : {};
    const body = createLocationSchema.parse(json.data);
    const spam = await checkSpam(request, {
      action: "location:create",
      allowUrls: 5,
      fields: [
        { name: "title", value: body.title },
        { name: "description", value: body.description },
        { name: "metadata", value: body.metadata },
        { name: "sources", value: body.sources },
        { name: "website", value: raw.website },
        { name: "homepage", value: raw.homepage },
        { name: "company", value: raw.company }
      ]
    });
    if (!spam.ok) return fail(422, "Submission rejected by spam prevention.", { reasons: spam.reasons });

    const user = await getCurrentOrAnonymousUser();
    const location = await createLocation(body, user.id);
    return withRateLimitHeaders(created(location), limiter);
  } catch (error) {
    return validationError(error);
  }
}
