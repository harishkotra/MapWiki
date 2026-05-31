"use client";

import { useQuery } from "@tanstack/react-query";
import type { Dataset, FeatureCollection } from "@/types/domain";

async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Request failed.");
  return body.data as T;
}

export function useDatasets(params: { featured?: boolean; q?: string; category?: string } = {}) {
  const search = new URLSearchParams();
  if (params.featured) search.set("featured", "true");
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  return useQuery({
    queryKey: ["datasets", params],
    queryFn: () => fetchData<Dataset[]>(`/api/datasets?${search.toString()}`)
  });
}

export function useLocations(datasetIds: string[]) {
  const search = new URLSearchParams({ format: "geojson", limit: "5000" });
  if (datasetIds.length) search.set("datasetIds", datasetIds.join(","));
  return useQuery({
    queryKey: ["locations", [...datasetIds].sort()],
    queryFn: () => fetchData<FeatureCollection>(`/api/locations?${search.toString()}`),
    enabled: datasetIds.length > 0
  });
}

