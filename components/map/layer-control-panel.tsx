"use client";

import { Eye, EyeOff, Flame, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLayerStore } from "@/features/datasets/layer-store";
import type { Dataset } from "@/types/domain";

const swatches = ["#0f766e", "#2563eb", "#b45309", "#7c3aed", "#db2777", "#16a34a", "#dc2626", "#525252"];

export function LayerControlPanel({ datasets }: { datasets: Dataset[] }) {
  const { layers, heatmap, toggleLayer, setOpacity, setColor, setHeatmap, enableAll, disableAll } = useLayerStore();
  const enabledCount = Object.values(layers).filter((layer) => layer.enabled).length;

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-lg border bg-card shadow-panel" aria-label="Layer controls">
      <div className="border-b p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Layers3 className="h-4 w-4" /> Layers
            </h2>
            <p className="text-xs text-muted-foreground">{enabledCount} visible datasets</p>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={enableAll} aria-label="Enable all layers" title="Enable all layers">
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={disableAll} aria-label="Disable all layers" title="Disable all layers">
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <label className="mt-4 flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm">
          <span className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            Heatmap
          </span>
          <Switch checked={heatmap} onCheckedChange={setHeatmap} aria-label="Toggle heatmap" />
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {datasets.map((dataset) => {
          const layer = layers[dataset.id];
          return (
            <div key={dataset.id} className="mb-3 rounded-md border bg-background p-3 last:mb-0">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  className="flex min-w-0 items-start gap-2 text-left"
                  onClick={() => toggleLayer(dataset.id)}
                  aria-pressed={layer?.enabled ?? true}
                >
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: layer?.color ?? dataset.color }} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{dataset.name}</span>
                    <span className="block text-xs text-muted-foreground">{dataset.objectCount} objects</span>
                  </span>
                </button>
                <Switch checked={layer?.enabled ?? true} onCheckedChange={() => toggleLayer(dataset.id)} aria-label={`Toggle ${dataset.name}`} />
              </div>
              <div className="mt-3">
                <label className="text-xs text-muted-foreground" htmlFor={`opacity-${dataset.id}`}>
                  Opacity {Math.round((layer?.opacity ?? dataset.defaultOpacity) * 100)}%
                </label>
                <input
                  id={`opacity-${dataset.id}`}
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={layer?.opacity ?? dataset.defaultOpacity}
                  onChange={(event) => setOpacity(dataset.id, Number(event.target.value))}
                  className="mt-1 w-full accent-primary"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label={`Color swatches for ${dataset.name}`}>
                {swatches.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="h-6 w-6 rounded border ring-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{ backgroundColor: color }}
                    onClick={() => setColor(dataset.id, color)}
                    aria-label={`Set color ${color}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

