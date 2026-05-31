import { fail, ok, validationError } from "@/lib/api";
import { canModerate } from "@/server/auth/permissions";
import { getCurrentUser } from "@/server/auth/session";
import { listRevisions, restoreRevision } from "@/server/db/repositories";
import { z } from "zod";

export const runtime = "nodejs";

const restoreSchema = z.object({
  targetType: z.enum(["dataset", "location"]),
  revisionId: z.string().uuid()
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get("targetType") as "dataset" | "location" | null;
  const targetId = searchParams.get("targetId") ?? undefined;
  const revisions = await listRevisions(targetType ?? undefined, targetId);
  return ok(revisions);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !canModerate(user.role)) return fail(403, "Moderator access required.");

  try {
    const body = restoreSchema.parse(await request.json());
    const revision = await restoreRevision(body.targetType, body.revisionId, user.id);
    return ok(revision);
  } catch (error) {
    return validationError(error);
  }
}

