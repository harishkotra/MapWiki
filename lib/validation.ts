import { z } from "zod";

const safeText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((value) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value), "Control characters are not allowed.");

const optionalSafeText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value), "Control characters are not allowed.")
    .optional()
    .nullable();

const longitude = z.number().finite().min(-180).max(180);
const latitude = z.number().finite().min(-90).max(90);
const altitude = z.number().finite().min(-11_000).max(100_000);
const position = z.tuple([longitude, latitude]).or(z.tuple([longitude, latitude, altitude]));
const ring = z
  .array(position)
  .min(4)
  .max(5000)
  .refine((positions) => {
    const first = positions[0];
    const last = positions[positions.length - 1];
    return Boolean(first && last && first[0] === last[0] && first[1] === last[1]);
  }, "Polygon rings must be closed.");

export const geometrySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Point"), coordinates: position }),
  z.object({ type: z.literal("LineString"), coordinates: z.array(position).min(2).max(10_000) }),
  z.object({ type: z.literal("Polygon"), coordinates: z.array(ring).min(1).max(100) }),
  z.object({ type: z.literal("MultiPoint"), coordinates: z.array(position).min(1).max(10_000) }),
  z.object({ type: z.literal("MultiLineString"), coordinates: z.array(z.array(position).min(2).max(10_000)).min(1).max(100) }),
  z.object({ type: z.literal("MultiPolygon"), coordinates: z.array(z.array(ring).min(1).max(100)).min(1).max(50) })
]);

const metadataSchema = z.record(z.unknown()).refine((value) => JSON.stringify(value).length <= 20_000, "Metadata is too large.");

export const createDatasetSchema = z.object({
  name: safeText(3, 120),
  description: safeText(20, 5000),
  category: safeText(2, 80),
  tags: z
    .array(
      safeText(2, 40).transform((tag) =>
        tag
          .toLowerCase()
          .replace(/[^a-z0-9-_\s]/g, "")
          .replace(/\s+/g, "-")
      )
    )
    .max(20)
    .default([]),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
  coverImage: z.string().trim().url().max(2048).optional().nullable(),
  geometryType: z.enum(["Point", "LineString", "Polygon", "Mixed"]).optional()
});

export const createLocationSchema = z.object({
  datasetId: z.string().uuid(),
  title: safeText(2, 160),
  description: safeText(0, 5000).default(""),
  geometry: geometrySchema,
  metadata: metadataSchema.default({}),
  sources: z
    .array(
      z.object({
        title: safeText(2, 200),
        url: z.string().trim().url().max(2048).optional().nullable(),
        publicationDate: optionalSafeText(40),
        notes: optionalSafeText(2000),
        reliabilityScore: z.number().int().min(1).max(5).default(3)
      })
    )
    .max(20)
    .default([])
});

export const commentSchema = z.object({
  datasetId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  body: safeText(2, 5000)
});

export const datasetQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  tag: z.string().trim().max(40).optional(),
  featured: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10_000).default(0)
});

export const locationQuerySchema = z.object({
  datasetIds: z
    .string()
    .optional()
    .transform((value) => value?.split(",").filter(Boolean) ?? undefined)
    .pipe(z.array(z.string().uuid()).max(50).optional()),
  bbox: z.string().max(120).optional(),
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(5000).default(2000),
  format: z.enum(["json", "geojson"]).default("json")
});

export const searchQuerySchema = z.object({
  q: z.string().trim().max(120).default("")
});

export const exportQuerySchema = z.object({
  datasetId: z.string().uuid(),
  format: z.enum(["geojson", "csv", "json", "kml", "gpx"]).default("geojson")
});

export function parseBbox(value: string | null): [number, number, number, number] | undefined {
  if (!value) return undefined;
  const parts = value.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return undefined;
  const [west, south, east, north] = parts;
  if (west < -180 || east > 180 || south < -90 || north > 90 || west >= east || south >= north) return undefined;
  return [west, south, east, north];
}
