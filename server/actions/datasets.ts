"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { checkRateLimits, rateLimitRules } from "@/lib/rate-limit";
import { checkSpam } from "@/lib/spam";
import { createDatasetSchema, createLocationSchema } from "@/lib/validation";
import { getCurrentOrAnonymousUser } from "@/server/auth/anonymous";
import { createDataset, createLocation } from "@/server/db/repositories";

async function actionRequest(action: string) {
  const incoming = await headers();
  const requestHeaders = new Headers();
  incoming.forEach((value, key) => requestHeaders.set(key, value));
  const host = incoming.get("host") ?? "localhost";
  const protocol = incoming.get("x-forwarded-proto") ?? "https";
  return new Request(`${protocol}://${host}/_actions/${action}`, {
    method: "POST",
    headers: requestHeaders
  });
}

export async function createDatasetAction(input: unknown) {
  const request = await actionRequest("dataset:create");
  const limiter = await checkRateLimits(request, [rateLimitRules.serverAction, rateLimitRules.datasetCreateBurst, rateLimitRules.datasetCreateDaily]);
  if (!limiter.ok) return { ok: false, error: "Too many requests. Please wait before trying again.", retryAfter: limiter.retryAfter };

  const parsed = createDatasetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Validation failed.", details: parsed.error.flatten() };

  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const spam = await checkSpam(request, {
    action: "dataset:create",
    allowUrls: parsed.data.coverImage ? 2 : 1,
    fields: [
      { name: "name", value: parsed.data.name },
      { name: "description", value: parsed.data.description },
      { name: "category", value: parsed.data.category },
      { name: "tags", value: parsed.data.tags },
      { name: "coverImage", value: parsed.data.coverImage },
      { name: "website", value: raw.website },
      { name: "homepage", value: raw.homepage },
      { name: "company", value: raw.company }
    ]
  });
  if (!spam.ok) return { ok: false, error: "Submission rejected by spam prevention.", details: { reasons: spam.reasons } };

  const user = await getCurrentOrAnonymousUser();
  const dataset = await createDataset(parsed.data, user.id);
  revalidatePath("/");
  revalidatePath("/map");
  return { ok: true, data: dataset };
}

export async function createLocationAction(input: unknown) {
  const request = await actionRequest("location:create");
  const limiter = await checkRateLimits(request, [rateLimitRules.serverAction, rateLimitRules.locationCreateBurst, rateLimitRules.locationCreateDaily]);
  if (!limiter.ok) return { ok: false, error: "Too many requests. Please wait before trying again.", retryAfter: limiter.retryAfter };

  const parsed = createLocationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Validation failed.", details: parsed.error.flatten() };

  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const spam = await checkSpam(request, {
    action: "location:create",
    allowUrls: 5,
    fields: [
      { name: "title", value: parsed.data.title },
      { name: "description", value: parsed.data.description },
      { name: "metadata", value: parsed.data.metadata },
      { name: "sources", value: parsed.data.sources },
      { name: "website", value: raw.website },
      { name: "homepage", value: raw.homepage },
      { name: "company", value: raw.company }
    ]
  });
  if (!spam.ok) return { ok: false, error: "Submission rejected by spam prevention.", details: { reasons: spam.reasons } };

  const user = await getCurrentOrAnonymousUser();
  const location = await createLocation(parsed.data, user.id);
  revalidatePath("/map");
  return { ok: true, data: location };
}
