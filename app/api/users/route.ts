import { fail, ok } from "@/lib/api";
import { getUserById, listUsers } from "@/server/db/repositories";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const user = await getUserById(id);
    if (!user) return fail(404, "User not found.");
    return ok(user);
  }
  return ok(await listUsers());
}

