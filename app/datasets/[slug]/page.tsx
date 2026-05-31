import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, GitBranch, MessageSquare, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapExplorer } from "@/components/map/map-explorer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCompactNumber } from "@/lib/utils";
import { getDatasetBySlug, getLocationsForDataset, listComments, listRevisions } from "@/server/db/repositories";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dataset = await getDatasetBySlug(slug);
  if (!dataset) return { title: "Dataset not found" };
  return {
    title: dataset.name,
    description: dataset.description,
    openGraph: {
      title: dataset.name,
      description: dataset.description,
      images: dataset.coverImage ? [dataset.coverImage] : undefined
    }
  };
}

export default async function DatasetPage({ params }: PageProps) {
  const { slug } = await params;
  const dataset = await getDatasetBySlug(slug);
  if (!dataset) notFound();

  const [locations, revisions, comments] = await Promise.all([
    getLocationsForDataset(dataset.id),
    listRevisions("dataset", dataset.id),
    listComments(dataset.id)
  ]);

  return (
    <div>
      <section className="border-b bg-muted/45">
        <div className="container grid gap-8 py-8 lg:grid-cols-[1fr_420px]">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>{dataset.category}</Badge>
              <Badge>{dataset.status}</Badge>
              <Badge>{dataset.visibility}</Badge>
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal">{dataset.name}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{dataset.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {dataset.tags.map((tag) => (
                <Badge key={tag}>#{tag}</Badge>
              ))}
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border bg-background p-3">
                <div className="text-2xl font-semibold">{locations.length}</div>
                <div className="text-xs text-muted-foreground">Objects</div>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <div className="text-2xl font-semibold">{formatCompactNumber(dataset.followers)}</div>
                <div className="text-xs text-muted-foreground">Followers</div>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <div className="text-2xl font-semibold">{formatCompactNumber(dataset.views)}</div>
                <div className="text-xs text-muted-foreground">Views</div>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <div className="text-2xl font-semibold">{revisions.length}</div>
                <div className="text-xs text-muted-foreground">Revisions</div>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border bg-card">
            <MapExplorer minimal initialDatasetIds={[dataset.id]} className="min-h-[360px]" />
          </div>
        </div>
      </section>

      <section className="container py-8">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="exports">Exports</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <Card>
              <CardHeader>
                <CardTitle>Objects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y rounded-md border">
                  {locations.slice(0, 12).map((location) => (
                    <div key={location.id} className="p-3">
                      <div className="font-medium">{location.title}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{location.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{location.geometryType}</span>
                        <span>{location.sources.length} sources</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contributors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Created by {dataset.creatorName}
                  </div>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    {revisions.length} tracked revisions
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    {formatCompactNumber(dataset.followers)} followers
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="history">
            <div className="divide-y rounded-lg border bg-card">
              {revisions.map((revision) => (
                <div key={revision.id} className="grid gap-2 p-4 md:grid-cols-[1fr_220px]">
                  <div>
                    <div className="font-medium">{revision.changeSummary}</div>
                    <div className="text-sm text-muted-foreground">{revision.authorName}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{new Date(revision.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="comments">
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    {comment.authorName}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{comment.body}</p>
                </div>
              ))}
              {!comments.length && <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">No comments yet.</div>}
            </div>
          </TabsContent>
          <TabsContent value="exports">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {["geojson", "csv", "json", "kml", "gpx"].map((format) => (
                <Button key={format} asChild variant="outline" className="justify-start">
                  <Link href={`/api/exports?datasetId=${dataset.id}&format=${format}`}>
                    <Download className="h-4 w-4" />
                    {format.toUpperCase()}
                  </Link>
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
