import { Database, GitBranch, Layers3, Users } from "lucide-react";
import { formatCompactNumber } from "@/lib/utils";

export function StatsStrip({ datasets, objects, contributors, revisions }: { datasets: number; objects: number; contributors: number; revisions: number }) {
  const items = [
    { label: "Datasets", value: datasets, icon: Layers3 },
    { label: "Map Objects", value: objects, icon: Database },
    { label: "Contributors", value: contributors, icon: Users },
    { label: "Revisions", value: revisions, icon: GitBranch }
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-card p-4">
          <item.icon className="h-4 w-4 text-primary" aria-hidden="true" />
          <div className="mt-2 text-2xl font-semibold">{formatCompactNumber(item.value)}</div>
          <div className="text-sm text-muted-foreground">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

