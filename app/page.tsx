import Link from "next/link";
import { ArrowRight, GitBranch, Layers3, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatasetCard } from "@/components/dataset-card";
import { MapExplorer } from "@/components/map/map-explorer";
import { SiteFooter } from "@/components/site-footer";
import { StatsStrip } from "@/components/stats-strip";
import { Badge } from "@/components/ui/badge";
import { listDatasets, listLocations, listRevisions, listUsers } from "@/server/db/repositories";

export default async function HomePage() {
  const [datasets, locations, users, revisions] = await Promise.all([
    listDatasets({ featured: true, limit: 6 }),
    listLocations({ limit: 5000 }),
    listUsers(),
    listRevisions()
  ]);
  const categories = Array.from(new Set(datasets.map((dataset) => dataset.category)));

  return (
    <>
      <section className="relative min-h-[82vh] overflow-hidden border-b">
        <div className="absolute inset-0">
          <MapExplorer minimal className="h-full min-h-full" />
        </div>
        <div className="absolute inset-0 bg-background/30" />
        <div className="container relative z-10 flex min-h-[82vh] items-center pb-16 pt-12">
          <div className="max-w-3xl">
            <Badge className="border-primary/30 bg-background/85 text-primary">Open-source geographic knowledge graph</Badge>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-normal text-foreground md:text-7xl">MapWiki</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-foreground/82 md:text-xl">
              Create, cite, edit, overlay, and compare community-curated map datasets with recoverable revision history.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/datasets/new">
                  Create Dataset
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-background/85">
                <Link href="/map">Explore Map</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-10">
        <StatsStrip datasets={datasets.length} objects={locations.length} contributors={users.length} revisions={revisions.length} />
      </section>

      <section className="container py-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal">Featured datasets</h2>
            <p className="mt-1 text-sm text-muted-foreground">Seeded MVP layers that demonstrate points, lines, polygons, citations, and overlays.</p>
          </div>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/map">View all</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {datasets.map((dataset) => (
            <DatasetCard key={dataset.id} dataset={dataset} />
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/55">
        <div className="container grid gap-6 py-10 md:grid-cols-3">
          {[
            { icon: Layers3, title: "Stack layers", body: "Enable universities, AI labs, and VC firms together to inspect geographic relationships." },
            { icon: GitBranch, title: "Recover edits", body: "Every dataset and object edit creates a revision with parent history, diff, and restoration path." },
            { icon: ShieldCheck, title: "Moderate safely", body: "Reports, audit logs, locks, roles, and citation requirements keep public data maintainable." }
          ].map((item) => (
            <div key={item.title} className="rounded-lg border bg-background p-5">
              <item.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">Recently updated</h2>
          <div className="mt-4 divide-y rounded-lg border bg-card">
            {datasets.slice(0, 5).map((dataset) => (
              <Link key={dataset.id} href={`/datasets/${dataset.slug}`} className="flex items-center justify-between gap-4 p-4 hover:bg-muted">
                <div>
                  <div className="font-medium">{dataset.name}</div>
                  <div className="text-sm text-muted-foreground">{dataset.creatorName}</div>
                </div>
                <span className="text-sm text-muted-foreground">{dataset.objectCount} objects</span>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">Popular categories</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link key={category} href={`/map?category=${encodeURIComponent(category)}`} className="rounded-md border bg-card px-3 py-2 text-sm hover:border-primary/50">
                <MapPin className="mr-1 inline h-3.5 w-3.5 text-primary" />
                {category}
              </Link>
            ))}
          </div>
          <div className="mt-8 rounded-lg border bg-card p-5">
            <h3 className="font-semibold">Open source mission</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              MapWiki is built for transparent civic data: cited claims, public APIs, portable exports, and governance that can scale with contributors.
            </p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}

