"use server";

import { revalidatePath } from "next/cache";
import { createDatasetSchema, createLocationSchema } from "@/lib/validation";
import { canCreateDataset } from "@/server/auth/permissions";
import { getCurrentUser } from "@/server/auth/session";
import { createDataset, createLocation } from "@/server/db/repositories";

export async function createDatasetAction(input: unknown) {
  const user = await getCurrentUser();
  if (!user || !canCreateDataset(user.role)) {
    return { ok: false, error: "Authentication required." };
  }

  const parsed = createDatasetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Validation failed.", details: parsed.error.flatten() };

  const dataset = await createDataset(parsed.data, user.id);
  revalidatePath("/");
  revalidatePath("/map");
  return { ok: true, data: dataset };
}

export async function createLocationAction(input: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Authentication required." };

  const parsed = createLocationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Validation failed.", details: parsed.error.flatten() };

  const location = await createLocation(parsed.data, user.id);
  revalidatePath("/map");
  return { ok: true, data: location };
}

