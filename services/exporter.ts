import type { FeatureCollection, Location } from "@/types/domain";
import { toFeatureCollection } from "@/server/db/repositories";

function escapeCsv(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function locationsToCsv(locations: Location[]) {
  const rows = [
    ["id", "datasetId", "title", "description", "geometryType", "longitude", "latitude", "metadata"].map(escapeCsv).join(",")
  ];
  for (const location of locations) {
    const [longitude, latitude] = location.geometry.type === "Point" ? location.geometry.coordinates : [null, null];
    rows.push(
      [
        location.id,
        location.datasetId,
        location.title,
        location.description,
        location.geometryType,
        longitude,
        latitude,
        location.metadata
      ]
        .map(escapeCsv)
        .join(",")
    );
  }
  return rows.join("\n");
}

export function locationsToGeoJson(locations: Location[]): FeatureCollection {
  return toFeatureCollection(locations);
}

export function locationsToKml(locations: Location[]) {
  const placemarks = locations
    .filter((location) => location.geometry.type === "Point")
    .map((location) => {
      const [lng, lat] = location.geometry.type === "Point" ? location.geometry.coordinates : [0, 0];
      return `<Placemark><name>${escapeXml(location.title)}</name><description>${escapeXml(location.description)}</description><Point><coordinates>${lng},${lat},0</coordinates></Point></Placemark>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>${placemarks}</Document></kml>`;
}

export function locationsToGpx(locations: Location[]) {
  const waypoints = locations
    .filter((location) => location.geometry.type === "Point")
    .map((location) => {
      const [lng, lat] = location.geometry.type === "Point" ? location.geometry.coordinates : [0, 0];
      return `<wpt lat="${lat}" lon="${lng}"><name>${escapeXml(location.title)}</name><desc>${escapeXml(location.description)}</desc></wpt>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="MapWiki">${waypoints}</gpx>`;
}
