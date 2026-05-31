import { fail, ok } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { searchAll } from "@/server/db/repositories";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const limiter = rateLimit(`search:${request.headers.get("x-forwarded-for") ?? "local"}`, 180);
  if (!limiter.ok) return fail(429, "Rate limit exceeded.");

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  if (q.trim().length < 2) return ok([]);

  const results = await searchAll(q);
  return ok(results);
}

