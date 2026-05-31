import { fail, ok } from "@/lib/api";
import { checkRateLimits, rateLimitExceeded, rateLimitRules, withRateLimitHeaders } from "@/lib/rate-limit";
import { assertContentLength } from "@/lib/request-guards";
import { checkSpam } from "@/lib/spam";
import { parseImportFile } from "@/services/import-parser";

export const runtime = "nodejs";

const maxUploadBytes = 20 * 1024 * 1024;
const acceptedExtensions = new Set(["csv", "tsv", "geojson", "json", "kml", "gpx"]);

export async function POST(request: Request) {
  const limiter = await checkRateLimits(request, rateLimitRules.importPreview);
  if (!limiter.ok) return rateLimitExceeded(limiter);
  const tooLarge = assertContentLength(request, maxUploadBytes + 1024);
  if (tooLarge) return tooLarge;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail(400, "A file field is required.");
  if (file.size > maxUploadBytes) return fail(413, "File is too large. The MVP limit is 20 MB.");
  if (file.size === 0) return fail(400, "File is empty.");
  if (file.name.length > 180) return fail(422, "File name is too long.");
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (!acceptedExtensions.has(ext)) return fail(422, "Unsupported import file type.");

  try {
    const text = await file.text();
    const spam = await checkSpam(request, {
      action: "import:preview",
      allowUrls: 30,
      rejectScore: 100,
      fields: [
        { name: "fileName", value: file.name },
        { name: "preview", value: text.slice(0, 20_000) }
      ]
    });
    if (!spam.ok) return fail(422, "Import rejected by spam prevention.", { reasons: spam.reasons });

    const summary = parseImportFile(text, file.name);
    return withRateLimitHeaders(ok(summary), limiter);
  } catch (error) {
    return fail(422, "Could not parse import file.", error instanceof Error ? error.message : error);
  }
}
