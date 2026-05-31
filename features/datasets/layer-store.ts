"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Dataset } from "@/types/domain";

export type LayerSettings = {
  datasetId: string;
  name: string;
  color: string;
  opacity: number;
  enabled: boolean;
  order: number;
};

type LayerState = {
  layers: Record<string, LayerSettings>;
  heatmap: boolean;
  hydrate: (datasets: Dataset[]) => void;
  toggleLayer: (datasetId: string) => void;
  setOpacity: (datasetId: string, opacity: number) => void;
  setColor: (datasetId: string, color: string) => void;
  setHeatmap: (enabled: boolean) => void;
  enableAll: () => void;
  disableAll: () => void;
  focusDatasets: (datasetIds: string[]) => void;
};

export const useLayerStore = create<LayerState>()(
  persist(
    (set) => ({
      layers: {},
      heatmap: false,
      hydrate: (datasets) =>
        set((state) => {
          const next = { ...state.layers };
          datasets.forEach((dataset, index) => {
            next[dataset.id] = {
              datasetId: dataset.id,
              name: dataset.name,
              color: next[dataset.id]?.color ?? dataset.color,
              opacity: next[dataset.id]?.opacity ?? dataset.defaultOpacity,
              enabled: next[dataset.id]?.enabled ?? true,
              order: next[dataset.id]?.order ?? index
            };
          });
          return { layers: next };
        }),
      toggleLayer: (datasetId) =>
        set((state) => ({
          layers: {
            ...state.layers,
            [datasetId]: {
              ...state.layers[datasetId],
              enabled: !state.layers[datasetId]?.enabled
            }
          }
        })),
      setOpacity: (datasetId, opacity) =>
        set((state) => ({
          layers: {
            ...state.layers,
            [datasetId]: {
              ...state.layers[datasetId],
              opacity
            }
          }
        })),
      setColor: (datasetId, color) =>
        set((state) => ({
          layers: {
            ...state.layers,
            [datasetId]: {
              ...state.layers[datasetId],
              color
            }
          }
        })),
      setHeatmap: (heatmap) => set({ heatmap }),
      enableAll: () =>
        set((state) => ({
          layers: Object.fromEntries(Object.entries(state.layers).map(([id, layer]) => [id, { ...layer, enabled: true }]))
        })),
      disableAll: () =>
        set((state) => ({
          layers: Object.fromEntries(Object.entries(state.layers).map(([id, layer]) => [id, { ...layer, enabled: false }]))
        })),
      focusDatasets: (datasetIds) =>
        set((state) => {
          const allowed = new Set(datasetIds);
          return {
            layers: Object.fromEntries(Object.entries(state.layers).map(([id, layer]) => [id, { ...layer, enabled: allowed.has(id) }]))
          };
        })
    }),
    {
      name: "mapwiki-layer-state",
      partialize: (state) => ({ layers: state.layers, heatmap: state.heatmap })
    }
  )
);

