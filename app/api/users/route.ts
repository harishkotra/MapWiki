import { fail, ok, validationError } from "@/lib/api";
import { checkRateLimits, rateLimitExceeded, rateLimitRules, withRateLimitHeaders } from "@/lib/rate-limit";
import { getUserById, listUsers } from "@/server/db/repositories";
import { z } from "zod";

export const runtime = "nodejs";

const usersQuerySchema = z.object({
  id: z.string().uuid().optional()
});

export async function GET(request: Request) {
  const limiter = await checkRateLimits(request, rateLimitRules.apiRead);
  if (!limiter.ok) return rateLimitExceeded(limiter);

  try {
    const query = usersQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    if (query.id) {
      const user = await getUserById(query.id);
      if (!user) return fail(404, "User not found.");
      return withRateLimitHeaders(ok(user), limiter);
    }
    return withRateLimitHeaders(ok(await listUsers()), limiter);
  } catch (error) {
    return validationError(error);
  }
}
