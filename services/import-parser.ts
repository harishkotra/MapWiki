import { parse } from "csv-parse/sync";
import { XMLParser } from "fast-xml-parser";
import type { Feature, Geometry, ImportPreviewRow, ImportSummary } from "@/types/domain";

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

function extensionFor(fileName: string): ImportSummary["fileType"] {
  const ext = fileName.toLowerCase().split(".").pop();
  if (ext === "tsv") return "tsv";
  if (ext === "geojson" || ext === "json") return "geojson";
  if (ext === "kml") return "kml";
  if (ext === "gpx") return "gpx";
  return "csv";
}

function asNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function tabularPreview(text: string, fileName: string, delimiter: "," | "\t"): ImportSummary {
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    delimiter,
    bom: true,
    relax_column_count: true,
    trim: true
  }) as Array<Record<string, string>>;

  const preview: ImportPreviewRow[] = records.slice(0, 100).map((record, index) => {
    const latitude = asNumber(record.latitude ?? record.lat ?? record.Latitude ?? record.LAT);
    const longitude = asNumber(record.longitude ?? record.lng ?? record.lon ?? record.Longitude ?? record.LON);
    const title = record.title ?? record.name ?? record.Name ?? `Row ${index + 1}`;
    const errors: string[] = [];
    let geometry: Geometry | undefined;

    if (latitude !== undefined && longitude !== undefined) {
      if (latitude < -90 || latitude > 90) errors.push("Latitude must be between -90 and 90.");
      if (longitude < -180 || longitude > 180) errors.push("Longitude must be between -180 and 180.");
      if (!errors.length) geometry = { type: "Point", coordinates: [longitude, latitude] };
    } else if (!record.address) {
      errors.push("Missing latitude/longitude or address for geocoding.");
    }

    return {
      rowNumber: index + 1,
      title,
      latitude,
      longitude,
      geometry,
      metadata: record,
      errors
    };
  });

  const invalidRows = preview.filter((row) => row.errors.length > 0).length;
  return {
    fileName,
    fileType: delimiter === "\t" ? "tsv" : "csv",
    totalRows: records.length,
    validRows: records.length - invalidRows,
    invalidRows,
    requiresGeocoding: preview.filter((row) => !row.geometry && row.metadata.address).length,
    preview
  };
}

function geoJsonPreview(text: string, fileName: string): ImportSummary {
  const parsed = JSON.parse(text) as { type: string; features?: Feature[] };
  const features = parsed.type === "FeatureCollection" && Array.isArray(parsed.features) ? parsed.features : [];
  const preview = features.slice(0, 100).map<ImportPreviewRow>((feature, index) => ({
    rowNumber: index + 1,
    title: String(feature.properties.name ?? feature.properties.title ?? `Feature ${index + 1}`),
    geometry: feature.geometry,
    metadata: feature.properties,
    errors: feature.geometry ? [] : ["Missing geometry."]
  }));
  const invalidRows = preview.filter((row) => row.errors.length > 0).length;
  return {
    fileName,
    fileType: "geojson",
    totalRows: features.length,
    validRows: features.length - invalidRows,
    invalidRows,
    requiresGeocoding: 0,
    preview
  };
}

function normalizeArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function kmlPreview(text: string, fileName: string): ImportSummary {
  const parsed = xmlParser.parse(text);
  const document = parsed.kml?.Document ?? parsed.kml?.Folder ?? parsed.kml;
  const placemarks = normalizeArray(document?.Placemark);
  const preview = placemarks.slice(0, 100).map<ImportPreviewRow>((placemark: Record<string, any>, index) => {
    const coordText = placemark.Point?.coordinates as string | undefined;
    const coords = coordText?.trim().split(",").map(Number);
    const geometry: Geometry | undefined =
      coords && coords.length >= 2 && Number.isFinite(coords[0]) && Number.isFinite(coords[1])
        ? { type: "Point", coordinates: [coords[0], coords[1]] }
        : undefined;
    return {
      rowNumber: index + 1,
      title: String(placemark.name ?? `Placemark ${index + 1}`),
      geometry,
      metadata: placemark,
      errors: geometry ? [] : ["Only point placemarks are previewed automatically in the MVP."]
    };
  });
  const invalidRows = preview.filter((row) => row.errors.length > 0).length;
  return {
    fileName,
    fileType: "kml",
    totalRows: placemarks.length,
    validRows: placemarks.length - invalidRows,
    invalidRows,
    requiresGeocoding: 0,
    preview
  };
}

function gpxPreview(text: string, fileName: string): ImportSummary {
  const parsed = xmlParser.parse(text);
  const waypoints = normalizeArray(parsed.gpx?.wpt);
  const preview = waypoints.slice(0, 100).map<ImportPreviewRow>((point: Record<string, any>, index) => {
    const longitude = asNumber(point.lon);
    const latitude = asNumber(point.lat);
    const geometry: Geometry | undefined =
      longitude !== undefined && latitude !== undefined ? { type: "Point", coordinates: [longitude, latitude] } : undefined;
    return {
      rowNumber: index + 1,
      title: String(point.name ?? `Waypoint ${index + 1}`),
      latitude,
      longitude,
      geometry,
      metadata: point,
      errors: geometry ? [] : ["Waypoint is missing latitude or longitude."]
    };
  });
  const invalidRows = preview.filter((row) => row.errors.length > 0).length;
  return {
    fileName,
    fileType: "gpx",
    totalRows: waypoints.length,
    validRows: waypoints.length - invalidRows,
    invalidRows,
    requiresGeocoding: 0,
    preview
  };
}

export function parseImportFile(text: string, fileName: string): ImportSummary {
  const type = extensionFor(fileName);
  if (type === "tsv") return tabularPreview(text, fileName, "\t");
  if (type === "geojson") return geoJsonPreview(text, fileName);
  if (type === "kml") return kmlPreview(text, fileName);
  if (type === "gpx") return gpxPreview(text, fileName);
  return tabularPreview(text, fileName, ",");
}

