import { fail, ok, validationError } from "@/lib/api";
import { checkRateLimits, rateLimitExceeded, rateLimitRules, withRateLimitHeaders } from "@/lib/rate-limit";
import { checkSpam } from "@/lib/spam";
import { searchQuerySchema } from "@/lib/validation";
import { searchAll } from "@/server/db/repositories";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const limiter = await checkRateLimits(request, rateLimitRules.search);
  if (!limiter.ok) return rateLimitExceeded(limiter);

  try {
    const { searchParams } = new URL(request.url);
    const { q } = searchQuerySchema.parse(Object.fromEntries(searchParams));
    if (q.trim().length < 2) return withRateLimitHeaders(ok([]), limiter);
    const spam = await checkSpam(request, {
      action: "search",
      allowUrls: 0,
      checkDuplicates: false,
      rejectScore: 100,
      fields: [{ name: "q", value: q }]
    });
    if (!spam.ok) return fail(422, "Search rejected by spam prevention.");

    const results = await searchAll(q);
    return withRateLimitHeaders(ok(results), limiter);
  } catch (error) {
    return validationError(error);
  }
}
