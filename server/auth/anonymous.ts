import type { User } from "@/types/domain";
import { getPool, hasDatabaseUrl } from "@/server/db/client";
import { getCurrentUser } from "./session";

export const anonymousContributorId = "00000000-0000-4000-8000-000000000004";

const anonymousUser: User = {
  id: anonymousContributorId,
  name: "Anonymous contributor",
  email: null,
  image: null,
  bio: "Open MapWiki contributor without a signed-in account.",
  role: "registered",
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString()
};

export async function ensureAnonymousContributor() {
  if (!hasDatabaseUrl()) return anonymousUser;
  await getPool().query(
    `
      INSERT INTO users (id, name, email, image, bio, role)
      VALUES ($1, $2, NULL, NULL, $3, 'registered')
      ON CONFLICT (id) DO NOTHING
    `,
    [anonymousUser.id, anonymousUser.name, anonymousUser.bio]
  );
  return anonymousUser;
}

export async function getCurrentOrAnonymousUser() {
  const user = await getCurrentUser();
  if (user) return user;
  return ensureAnonymousContributor();
}
