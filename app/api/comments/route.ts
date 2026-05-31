import { created, fail, ok, validationError } from "@/lib/api";
import { commentSchema } from "@/lib/validation";
import { getCurrentUser } from "@/server/auth/session";
import { addComment, listComments } from "@/server/db/repositories";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const comments = await listComments(searchParams.get("datasetId") ?? undefined, searchParams.get("locationId") ?? undefined);
  return ok(comments);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "Authentication required.");
  try {
    const body = commentSchema.parse(await request.json());
    const comment = await addComment(body, user.id);
    return created(comment);
  } catch (error) {
    return validationError(error);
  }
}

