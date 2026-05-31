import { describe, expect, it } from "vitest";
import { parseImportFile } from "@/services/import-parser";

describe("parseImportFile", () => {
  it("validates CSV point rows", () => {
    const summary = parseImportFile("name,latitude,longitude\nAshburn,39.0438,-77.4874\nBad,120,181", "sites.csv");
    expect(summary.fileType).toBe("csv");
    expect(summary.totalRows).toBe(2);
    expect(summary.validRows).toBe(1);
    expect(summary.invalidRows).toBe(1);
    expect(summary.preview[0].geometry).toEqual({ type: "Point", coordinates: [-77.4874, 39.0438] });
  });

  it("previews GeoJSON feature collections", () => {
    const summary = parseImportFile(
      JSON.stringify({
        type: "FeatureCollection",
        features: [{ type: "Feature", geometry: { type: "Point", coordinates: [1, 2] }, properties: { name: "One" } }]
      }),
      "sites.geojson"
    );
    expect(summary.validRows).toBe(1);
    expect(summary.preview[0].title).toBe("One");
  });
});

