import { describe, expect, it } from "vitest";
import { locationsToCsv, locationsToGeoJson, locationsToGpx, locationsToKml } from "@/services/exporter";
import { sampleLocations } from "@/database/seeds/sample-data";

describe("exporter", () => {
  const locations = sampleLocations.slice(0, 2);

  it("exports CSV with escaped metadata", () => {
    const csv = locationsToCsv(locations);
    expect(csv).toContain('"title"');
    expect(csv).toContain("Equinix Ashburn Campus");
  });

  it("exports GeoJSON feature collections", () => {
    const geojson = locationsToGeoJson(locations);
    expect(geojson.type).toBe("FeatureCollection");
    expect(geojson.features).toHaveLength(2);
  });

  it("exports XML formats", () => {
    expect(locationsToKml(locations)).toContain("<kml");
    expect(locationsToGpx(locations)).toContain("<gpx");
  });
});

