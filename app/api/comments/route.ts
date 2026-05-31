import { created, fail, ok, validationError } from "@/lib/api";
import { checkRateLimits, rateLimitExceeded, rateLimitRules, withRateLimitHeaders } from "@/lib/rate-limit";
import { readJsonBody } from "@/lib/request-guards";
import { checkSpam } from "@/lib/spam";
import { commentSchema } from "@/lib/validation";
import { getCurrentOrAnonymousUser } from "@/server/auth/anonymous";
import { addComment, listComments } from "@/server/db/repositories";
import { z } from "zod";

export const runtime = "nodejs";

const commentQuerySchema = z.object({
  datasetId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional()
});

export async function GET(request: Request) {
  const limiter = await checkRateLimits(request, rateLimitRules.apiRead);
  if (!limiter.ok) return rateLimitExceeded(limiter);

  try {
    const { searchParams } = new URL(request.url);
    const query = commentQuerySchema.parse(Object.fromEntries(searchParams));
    const comments = await listComments(query.datasetId, query.locationId);
    return withRateLimitHeaders(ok(comments), limiter);
  } catch (error) {
    return validationError(error);
  }
}

export async function POST(request: Request) {
  const limiter = await checkRateLimits(request, [rateLimitRules.commentCreateBurst, rateLimitRules.commentCreateDaily]);
  if (!limiter.ok) return rateLimitExceeded(limiter);

  try {
    const json = await readJsonBody(request, 16 * 1024);
    if (!json.ok) return json.response;

    const raw = json.data && typeof json.data === "object" ? (json.data as Record<string, unknown>) : {};
    const body = commentSchema.parse(json.data);
    const spam = await checkSpam(request, {
      action: "comment:create",
      allowUrls: 1,
      fields: [
        { name: "body", value: body.body },
        { name: "website", value: raw.website },
        { name: "homepage", value: raw.homepage },
        { name: "company", value: raw.company }
      ]
    });
    if (!spam.ok) return fail(422, "Submission rejected by spam prevention.", { reasons: spam.reasons });

    const user = await getCurrentOrAnonymousUser();
    const comment = await addComment(body, user.id);
    return withRateLimitHeaders(created(comment), limiter);
  } catch (error) {
    return validationError(error);
  }
}
