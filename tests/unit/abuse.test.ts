import { describe, expect, it } from "vitest";
import { checkRateLimits } from "@/lib/rate-limit";
import { checkSpam } from "@/lib/spam";
import { createLocationSchema } from "@/lib/validation";

function request(path = "/api/comments") {
  return new Request(`https://mapwiki.test${path}`, {
    headers: {
      "x-forwarded-for": "203.0.113.10",
      "user-agent": "vitest"
    }
  });
}

describe("abuse controls", () => {
  it("blocks obvious spam payloads", async () => {
    const result = await checkSpam(request(), {
      action: "comment:create",
      allowUrls: 1,
      fields: [{ name: "body", value: "FREE MONEY crypto giveaway casino bonus https://a.example https://b.example https://c.example" }]
    });

    expect(result.ok).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it("rejects honeypot fields", async () => {
    const result = await checkSpam(request("/api/datasets"), {
      action: "dataset:create",
      fields: [
        { name: "name", value: "Global Libraries" },
        { name: "website", value: "https://spam.example" }
      ]
    });

    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("Hidden anti-bot field was filled.");
  });

  it("enforces fallback rate limits when no database is configured", async () => {
    const rule = { id: `test:${crypto.randomUUID()}`, limit: 1, windowMs: 60_000 };
    const first = await checkRateLimits(request("/api/search"), rule);
    const second = await checkRateLimits(request("/api/search"), rule);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    expect(second.retryAfter).toBeGreaterThan(0);
  });

  it("bounds submitted geometry", () => {
    const parsed = createLocationSchema.safeParse({
      datasetId: "10000000-0000-4000-8000-000000000001",
      title: "Bad point",
      description: "",
      geometry: { type: "Point", coordinates: [200, 95] },
      metadata: {}
    });

    expect(parsed.success).toBe(false);
  });
});
