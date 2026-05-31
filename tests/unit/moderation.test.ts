import { describe, expect, it } from "vitest";
import { resolveModerationDecision } from "@/server/moderation/workflows";

describe("moderation workflows", () => {
  it("locks datasets for moderator decisions", () => {
    expect(resolveModerationDecision({ actorRole: "moderator", decision: "lock" })).toMatchObject({
      datasetStatus: "locked",
      auditAction: "lock"
    });
  });

  it("rejects registered users", () => {
    expect(() => resolveModerationDecision({ actorRole: "registered", decision: "approve" })).toThrow("Moderator access required.");
  });
});

