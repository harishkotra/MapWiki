import { NextResponse } from "next/server";
import { created, fail, ok, validationError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { createDatasetSchema } from "@/lib/validation";
import { canCreateDataset } from "@/server/auth/permissions";
import { getCurrentUser } from "@/server/auth/session";
import { createDataset, listDatasets } from "@/server/db/repositories";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const datasets = await listDatasets({
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    tag: searchParams.get("tag") ?? undefined,
    featured: searchParams.get("featured") === "true",
    limit: Number(searchParams.get("limit") ?? 50),
    offset: Number(searchParams.get("offset") ?? 0)
  });

  return ok(datasets);
}

export async function POST(request: Request) {
  const limiter = rateLimit(`datasets:${request.headers.get("x-forwarded-for") ?? "local"}`, 40);
  if (!limiter.ok) return fail(429, "Rate limit exceeded.");

  const user = await getCurrentUser();
  if (!user || !canCreateDataset(user.role)) return fail(401, "Authentication required.");

  try {
    const body = createDatasetSchema.parse(await request.json());
    const dataset = await createDataset(body, user.id);
    return created(dataset);
  } catch (error) {
    return validationError(error);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

