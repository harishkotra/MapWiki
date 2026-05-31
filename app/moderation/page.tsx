import type { Metadata } from "next";
import { AlertTriangle, Ban, Lock, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listDatasets } from "@/server/db/repositories";

export const metadata: Metadata = {
  title: "Moderation"
};

export default async function ModerationPage() {
  const datasets = await listDatasets({ featured: true, limit: 4 });
  const queue = datasets.map((dataset, index) => ({
    id: dataset.id,
    title: dataset.name,
    reason: index % 2 === 0 ? "Source reliability disputed" : "Geometry edit needs review",
    severity: index === 0 ? "high" : "normal"
  }));

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Badge>Moderator workspace</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">Review queue</h1>
        <p className="mt-2 text-muted-foreground">Triage reports, lock volatile datasets, restore revisions, and record audit events.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="divide-y rounded-lg border bg-card">
          {queue.map((item) => (
            <div key={item.id} className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={item.severity === "high" ? "h-4 w-4 text-destructive" : "h-4 w-4 text-primary"} />
                  <span className="font-medium">{item.title}</span>
                  <Badge>{item.severity}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <ShieldCheck className="h-4 w-4" />
                  Approve
                </Button>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4" />
                  Revert
                </Button>
                <Button variant="outline" size="sm">
                  <Lock className="h-4 w-4" />
                  Lock
                </Button>
              </div>
            </div>
          ))}
        </div>
        <aside className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Spam prevention</h2>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-destructive" />
              Ban users from the admin panel.
            </div>
            <div>Rate limits protect search, imports, dataset creation, and map edits.</div>
            <div>Audit logs capture target, actor, IP, user agent, and structured metadata.</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

