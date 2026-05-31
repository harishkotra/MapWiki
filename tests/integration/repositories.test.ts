import { describe, expect, it } from "vitest";
import { getDatasetBySlug, listDatasets, listLocations, searchAll } from "@/server/db/repositories";

describe("repository fallback data", () => {
  it("lists seed datasets", async () => {
    const datasets = await listDatasets({ featured: true });
    expect(datasets.length).toBeGreaterThanOrEqual(6);
    expect(datasets[0]).toHaveProperty("slug");
  });

  it("returns locations as map objects", async () => {
    const dataset = await getDatasetBySlug("global-data-centers");
    expect(dataset).not.toBeNull();
    const locations = await listLocations({ datasetIds: [dataset!.id] });
    expect(locations.length).toBe(dataset!.objectCount);
  });

  it("searches datasets and locations", async () => {
    const results = await searchAll("AI");
    expect(results.some((result) => result.type === "dataset")).toBe(true);
  });
});

