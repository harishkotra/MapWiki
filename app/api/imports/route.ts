import { fail, ok } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/server/auth/session";
import { parseImportFile } from "@/services/import-parser";

export const runtime = "nodejs";

const maxUploadBytes = 20 * 1024 * 1024;

export async function POST(request: Request) {
  const limiter = rateLimit(`imports:${request.headers.get("x-forwarded-for") ?? "local"}`, 20);
  if (!limiter.ok) return fail(429, "Rate limit exceeded.");

  const user = await getCurrentUser();
  if (!user) return fail(401, "Authentication required.");

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail(400, "A file field is required.");
  if (file.size > maxUploadBytes) return fail(413, "File is too large. The MVP limit is 20 MB.");

  try {
    const summary = parseImportFile(await file.text(), file.name);
    return ok(summary);
  } catch (error) {
    return fail(422, "Could not parse import file.", error instanceof Error ? error.message : error);
  }
}

