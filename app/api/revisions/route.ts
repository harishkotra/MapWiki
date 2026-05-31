import { fail, ok, validationError } from "@/lib/api";
import { checkRateLimits, rateLimitExceeded, rateLimitRules, withRateLimitHeaders } from "@/lib/rate-limit";
import { readJsonBody } from "@/lib/request-guards";
import { canModerate } from "@/server/auth/permissions";
import { getCurrentUser } from "@/server/auth/session";
import { listRevisions, restoreRevision } from "@/server/db/repositories";
import { z } from "zod";

export const runtime = "nodejs";

const restoreSchema = z.object({
  targetType: z.enum(["dataset", "location"]),
  revisionId: z.string().uuid()
});

const revisionQuerySchema = z.object({
  targetType: z.enum(["dataset", "location"]).optional(),
  targetId: z.string().uuid().optional()
});

export async function GET(request: Request) {
  const limiter = await checkRateLimits(request, rateLimitRules.apiRead);
  if (!limiter.ok) return rateLimitExceeded(limiter);

  try {
    const { searchParams } = new URL(request.url);
    const query = revisionQuerySchema.parse(Object.fromEntries(searchParams));
    const revisions = await listRevisions(query.targetType, query.targetId);
    return withRateLimitHeaders(ok(revisions), limiter);
  } catch (error) {
    return validationError(error);
  }
}

export async function POST(request: Request) {
  const limiter = await checkRateLimits(request, rateLimitRules.revisionRestore);
  if (!limiter.ok) return rateLimitExceeded(limiter);

  const user = await getCurrentUser();
  if (!user || !canModerate(user.role)) return fail(403, "Moderator access required.");

  try {
    const json = await readJsonBody(request, 8 * 1024);
    if (!json.ok) return json.response;
    const body = restoreSchema.parse(json.data);
    const revision = await restoreRevision(body.targetType, body.revisionId, user.id);
    return withRateLimitHeaders(ok(revision), limiter);
  } catch (error) {
    return validationError(error);
  }
}
