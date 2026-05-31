"use client";

import maplibregl, { type GeoJSONSource, type MapLayerMouseEvent } from "maplibre-gl";
import { LocateFixed, Maximize2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { LayerControlPanel } from "@/components/map/layer-control-panel";
import { useDatasets, useLocations } from "@/hooks/use-datasets";
import { cn } from "@/lib/utils";
import { useLayerStore } from "@/features/datasets/layer-store";
import type { Dataset, Feature, FeatureCollection } from "@/types/domain";

const emptyCollection: FeatureCollection = { type: "FeatureCollection", features: [] };

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function splitFeatures(collection: FeatureCollection) {
  const points: Feature[] = [];
  const lines: Feature[] = [];
  const polygons: Feature[] = [];

  for (const feature of collection.features) {
    if (feature.geometry.type === "Point" || feature.geometry.type === "MultiPoint") points.push(feature);
    else if (feature.geometry.type === "LineString" || feature.geometry.type === "MultiLineString") lines.push(feature);
    else polygons.push(feature);
  }

  return {
    points: { type: "FeatureCollection", features: points } satisfies FeatureCollection,
    lines: { type: "FeatureCollection", features: lines } satisfies FeatureCollection,
    polygons: { type: "FeatureCollection", features: polygons } satisfies FeatureCollection
  };
}

function addMapSourcesAndLayers(map: maplibregl.Map) {
  if (map.getSource("mapwiki-points")) return;

  map.addSource("mapwiki-points", {
    type: "geojson",
    data: emptyCollection,
    cluster: true,
    clusterRadius: 48,
    clusterMaxZoom: 9
  });
  map.addSource("mapwiki-lines", { type: "geojson", data: emptyCollection });
  map.addSource("mapwiki-polygons", { type: "geojson", data: emptyCollection });

  map.addLayer({
    id: "mapwiki-polygons-fill",
    type: "fill",
    source: "mapwiki-polygons",
    paint: {
      "fill-color": ["get", "color"],
      "fill-opacity": ["coalesce", ["get", "opacity"], 0.45]
    }
  });
  map.addLayer({
    id: "mapwiki-polygons-outline",
    type: "line",
    source: "mapwiki-polygons",
    paint: {
      "line-color": ["get", "color"],
      "line-width": 1.6,
      "line-opacity": 0.85
    }
  });
  map.addLayer({
    id: "mapwiki-lines",
    type: "line",
    source: "mapwiki-lines",
    paint: {
      "line-color": ["get", "color"],
      "line-width": ["interpolate", ["linear"], ["zoom"], 2, 1.4, 8, 3.2],
      "line-opacity": ["coalesce", ["get", "opacity"], 0.8]
    }
  });
  map.addLayer({
    id: "mapwiki-heat",
    type: "heatmap",
    source: "mapwiki-points",
    layout: { visibility: "none" },
    paint: {
      "heatmap-weight": 0.65,
      "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 0.5, 9, 2.8],
      "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 4, 9, 28],
      "heatmap-opacity": 0.55
    }
  });
  map.addLayer({
    id: "mapwiki-clusters",
    type: "circle",
    source: "mapwiki-points",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#0f766e",
      "circle-radius": ["step", ["get", "point_count"], 18, 20, 24, 75, 30],
      "circle-opacity": 0.9,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2
    }
  });
  map.addLayer({
    id: "mapwiki-cluster-count",
    type: "symbol",
    source: "mapwiki-points",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["Open Sans Regular"],
      "text-size": 12
    },
    paint: {
      "text-color": "#ffffff"
    }
  });
  map.addLayer({
    id: "mapwiki-points",
    type: "circle",
    source: "mapwiki-points",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": ["get", "color"],
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 4, 7, 7, 12, 10],
      "circle-opacity": ["coalesce", ["get", "opacity"], 0.8],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1.4
    }
  });
}

function popupHtml(feature: maplibregl.MapGeoJSONFeature) {
  let metadata = feature.properties?.metadata;
  if (typeof metadata === "string") {
    try {
      metadata = JSON.parse(metadata);
    } catch {
      metadata = {};
    }
  }
  const rows = metadata && typeof metadata === "object" ? Object.entries(metadata).slice(0, 5) : [];
  return `
    <article class="w-72 p-3">
      <div class="text-xs text-muted-foreground">${escapeHtml(feature.properties?.datasetName)}</div>
      <h3 class="mt-1 text-sm font-semibold">${escapeHtml(feature.properties?.title)}</h3>
      <p class="mt-1 line-clamp-3 text-xs text-muted-foreground">${escapeHtml(feature.properties?.description)}</p>
      ${
        rows.length
          ? `<dl class="mt-3 grid grid-cols-2 gap-2 text-xs">${rows
              .map(([key, value]) => `<div><dt class="text-muted-foreground">${escapeHtml(key)}</dt><dd>${escapeHtml(Array.isArray(value) ? value.join(", ") : value)}</dd></div>`)
              .join("")}</dl>`
          : ""
      }
    </article>
  `;
}

export function MapExplorer({
  className,
  minimal = false,
  initialDatasetIds
}: {
  className?: string;
  minimal?: boolean;
  initialDatasetIds?: string[];
}) {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const collectionRef = useRef<FeatureCollection>(emptyCollection);
  const datasets = useDatasets({ featured: true });
  const { layers, heatmap, hydrate, focusDatasets } = useLayerStore();

  useEffect(() => {
    if (datasets.data) {
      hydrate(datasets.data);
      if (initialDatasetIds?.length) focusDatasets(initialDatasetIds);
    }
  }, [datasets.data, focusDatasets, hydrate, initialDatasetIds]);

  const enabledDatasetIds = useMemo(() => {
    if (initialDatasetIds?.length) return initialDatasetIds;
    const ids = Object.values(layers)
      .filter((layer) => layer.enabled)
      .sort((a, b) => a.order - b.order)
      .map((layer) => layer.datasetId);
    return ids.length ? ids : datasets.data?.map((dataset) => dataset.id) ?? [];
  }, [datasets.data, initialDatasetIds, layers]);

  const locations = useLocations(enabledDatasetIds);

  const styledCollection = useMemo<FeatureCollection>(() => {
    const data = locations.data ?? emptyCollection;
    const datasetById = new Map((datasets.data ?? []).map((dataset) => [dataset.id, dataset]));
    return {
      type: "FeatureCollection",
      features: data.features
        .filter((feature) => {
          const datasetId = String(feature.properties.datasetId ?? "");
          return enabledDatasetIds.includes(datasetId);
        })
        .map((feature) => {
          const datasetId = String(feature.properties.datasetId ?? "");
          const dataset = datasetById.get(datasetId);
          const layer = layers[datasetId];
          return {
            ...feature,
            properties: {
              ...feature.properties,
              datasetName: dataset?.name ?? feature.properties.datasetName,
              color: layer?.color ?? dataset?.color ?? feature.properties.color ?? "#0f766e",
              opacity: layer?.opacity ?? dataset?.defaultOpacity ?? 0.8
            }
          };
        })
    };
  }, [datasets.data, enabledDatasetIds, layers, locations.data]);

  useEffect(() => {
    collectionRef.current = styledCollection;
  }, [styledCollection]);

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapNode.current,
      style: {
        version: 8,
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors"
          }
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }]
      },
      center: [16, 24],
      zoom: minimal ? 1.2 : 1.45,
      attributionControl: false
    });

    mapRef.current = map;
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    if (!minimal) {
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
      map.addControl(new maplibregl.FullscreenControl(), "top-right");
      map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), "top-right");
    }

    const interactiveLayers = ["mapwiki-points", "mapwiki-polygons-fill", "mapwiki-lines"];
    const showPopup = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature) return;
      popupRef.current?.remove();
      popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: "320px" })
        .setLngLat(event.lngLat)
        .setHTML(popupHtml(feature))
        .addTo(map);
    };

    map.on("load", () => {
      addMapSourcesAndLayers(map);
      const split = splitFeatures(collectionRef.current);
      (map.getSource("mapwiki-points") as GeoJSONSource | undefined)?.setData(split.points);
      (map.getSource("mapwiki-lines") as GeoJSONSource | undefined)?.setData(split.lines);
      (map.getSource("mapwiki-polygons") as GeoJSONSource | undefined)?.setData(split.polygons);

      interactiveLayers.forEach((layerId) => {
        map.on("click", layerId, showPopup);
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
      });

      map.on("click", "mapwiki-clusters", async (event) => {
        const feature = event.features?.[0];
        const clusterId = feature?.properties?.cluster_id;
        const source = map.getSource("mapwiki-points") as GeoJSONSource;
        if (clusterId === undefined || !source) return;
        const zoom = await source.getClusterExpansionZoom(Number(clusterId));
        map.easeTo({ center: event.lngLat, zoom });
      });
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [minimal]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource("mapwiki-points")) return;
    const split = splitFeatures(styledCollection);
    (map.getSource("mapwiki-points") as GeoJSONSource | undefined)?.setData(split.points);
    (map.getSource("mapwiki-lines") as GeoJSONSource | undefined)?.setData(split.lines);
    (map.getSource("mapwiki-polygons") as GeoJSONSource | undefined)?.setData(split.polygons);
  }, [styledCollection]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("mapwiki-heat")) return;
    map.setLayoutProperty("mapwiki-heat", "visibility", heatmap ? "visible" : "none");
  }, [heatmap]);

  return (
    <section className={cn("relative grid min-h-[620px] overflow-hidden rounded-none bg-muted", minimal ? "min-h-[520px]" : "lg:grid-cols-[320px_1fr]", className)}>
      {!minimal && (
        <div className="z-10 min-h-0 p-3">
          <LayerControlPanel datasets={datasets.data ?? []} />
        </div>
      )}
      <div className="relative min-h-[520px]">
        <div ref={mapNode} className="absolute inset-0" aria-label="Interactive MapWiki map" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-background/35" />
        {!minimal && (
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card/92 p-2 shadow-panel backdrop-blur md:left-auto md:right-4 md:w-auto">
            <span className="px-2 text-xs text-muted-foreground">
              {locations.data?.features.length ?? 0} rendered objects · viewport queries ready
            </span>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => locations.refetch()} aria-label="Refresh map data" title="Refresh map data">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => mapRef.current?.resize()} aria-label="Resize map" title="Resize map">
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => navigator.geolocation?.getCurrentPosition((position) => mapRef.current?.flyTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 10 }))}
                aria-label="Go to my location"
                title="Go to my location"
              >
                <LocateFixed className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
