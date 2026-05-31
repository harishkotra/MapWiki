import { z } from "zod";

export const geometrySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Point"), coordinates: z.tuple([z.number(), z.number()]).or(z.tuple([z.number(), z.number(), z.number()])) }),
  z.object({ type: z.literal("LineString"), coordinates: z.array(z.tuple([z.number(), z.number()])).min(2) }),
  z.object({ type: z.literal("Polygon"), coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))).min(1) }),
  z.object({ type: z.literal("MultiPoint"), coordinates: z.array(z.tuple([z.number(), z.number()])).min(1) }),
  z.object({ type: z.literal("MultiLineString"), coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))).min(1) }),
  z.object({ type: z.literal("MultiPolygon"), coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()])))).min(1) })
]);

export const createDatasetSchema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().min(20).max(5000),
  category: z.string().min(2).max(80),
  tags: z.array(z.string().min(2).max(40)).max(20).default([]),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
  coverImage: z.string().url().optional().nullable(),
  geometryType: z.enum(["Point", "LineString", "Polygon", "Mixed"]).optional()
});

export const createLocationSchema = z.object({
  datasetId: z.string().uuid(),
  title: z.string().min(2).max(160),
  description: z.string().max(5000).default(""),
  geometry: geometrySchema,
  metadata: z.record(z.unknown()).default({}),
  sources: z
    .array(
      z.object({
        title: z.string().min(2).max(200),
        url: z.string().url().optional().nullable(),
        publicationDate: z.string().optional().nullable(),
        notes: z.string().max(2000).optional().nullable(),
        reliabilityScore: z.number().int().min(1).max(5).default(3)
      })
    )
    .default([])
});

export const commentSchema = z.object({
  datasetId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  body: z.string().min(1).max(5000)
});

export function parseBbox(value: string | null): [number, number, number, number] | undefined {
  if (!value) return undefined;
  const parts = value.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return undefined;
  const [west, south, east, north] = parts;
  if (west < -180 || east > 180 || south < -90 || north > 90 || west >= east || south >= north) return undefined;
  return [west, south, east, north];
}

