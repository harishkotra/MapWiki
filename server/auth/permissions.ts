import type { Dataset, UserRole } from "@/types/domain";

const rank: Record<UserRole, number> = {
  anonymous: 0,
  registered: 1,
  moderator: 2,
  admin: 3
};

export function hasRole(userRole: UserRole | undefined, minimum: UserRole) {
  return rank[userRole ?? "anonymous"] >= rank[minimum];
}

export function canCreateDataset(userRole: UserRole | undefined) {
  return hasRole(userRole, "registered");
}

export function canEditDataset(userId: string | undefined, userRole: UserRole | undefined, dataset: Dataset) {
  if (!userId) return false;
  if (hasRole(userRole, "moderator")) return true;
  return dataset.creatorId === userId && dataset.status !== "locked";
}

export function canModerate(userRole: UserRole | undefined) {
  return hasRole(userRole, "moderator");
}

