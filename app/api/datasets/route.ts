import { NextResponse } from "next/server";
import { created, fail, ok, validationError } from "@/lib/api";
import { checkRateLimits, rateLimitExceeded, rateLimitRules, withRateLimitHeaders } from "@/lib/rate-limit";
import { readJsonBody } from "@/lib/request-guards";
import { checkSpam } from "@/lib/spam";
import { createDatasetSchema, datasetQuerySchema } from "@/lib/validation";
import { getCurrentOrAnonymousUser } from "@/server/auth/anonymous";
import { createDataset, listDatasets } from "@/server/db/repositories";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const limiter = await checkRateLimits(request, rateLimitRules.apiRead);
  if (!limiter.ok) return rateLimitExceeded(limiter);

  try {
    const { searchParams } = new URL(request.url);
    const query = datasetQuerySchema.parse(Object.fromEntries(searchParams));
    const datasets = await listDatasets({
      q: query.q,
      category: query.category,
      tag: query.tag,
      featured: query.featured,
      limit: query.limit,
      offset: query.offset
    });

    return withRateLimitHeaders(ok(datasets), limiter);
  } catch (error) {
    return validationError(error);
  }
}

export async function POST(request: Request) {
  const limiter = await checkRateLimits(request, [rateLimitRules.datasetCreateBurst, rateLimitRules.datasetCreateDaily]);
  if (!limiter.ok) return rateLimitExceeded(limiter);

  try {
    const json = await readJsonBody(request, 32 * 1024);
    if (!json.ok) return json.response;

    const raw = json.data && typeof json.data === "object" ? (json.data as Record<string, unknown>) : {};
    const body = createDatasetSchema.parse(json.data);
    const spam = await checkSpam(request, {
      action: "dataset:create",
      allowUrls: body.coverImage ? 2 : 1,
      fields: [
        { name: "name", value: body.name },
        { name: "description", value: body.description },
        { name: "category", value: body.category },
        { name: "tags", value: body.tags },
        { name: "coverImage", value: body.coverImage },
        { name: "website", value: raw.website },
        { name: "homepage", value: raw.homepage },
        { name: "company", value: raw.company }
      ]
    });
    if (!spam.ok) return fail(422, "Submission rejected by spam prevention.", { reasons: spam.reasons });

    const user = await getCurrentOrAnonymousUser();
    const dataset = await createDataset(body, user.id);
    return withRateLimitHeaders(created(dataset), limiter);
  } catch (error) {
    return validationError(error);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
