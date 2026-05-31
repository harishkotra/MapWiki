import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { DatasetCard } from "@/components/dataset-card";
import { getUserById, listDatasets, listRevisions } from "@/server/db/repositories";

type PageProps = {
  params: { id: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getUserById(params.id);
  return { title: user ? user.name : "Profile not found" };
}

export default async function ProfilePage({ params }: PageProps) {
  const user = await getUserById(params.id);
  if (!user) notFound();

  const [datasets, revisions] = await Promise.all([listDatasets({ limit: 100 }), listRevisions()]);
  const created = datasets.filter((dataset) => dataset.creatorId === user.id);
  const authored = revisions.filter((revision) => revision.authorId === user.id);

  return (
    <div className="container py-8">
      <section className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {user.image ? <img src={user.image} alt="" className="h-20 w-20 rounded-lg object-cover" /> : <div className="h-20 w-20 rounded-lg bg-muted" />}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-normal">{user.name}</h1>
              <Badge>{user.role}</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-muted-foreground">{user.bio ?? "MapWiki contributor"}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border bg-background p-3">
            <div className="text-2xl font-semibold">{created.length}</div>
            <div className="text-sm text-muted-foreground">Created datasets</div>
          </div>
          <div className="rounded-md border bg-background p-3">
            <div className="text-2xl font-semibold">{authored.length}</div>
            <div className="text-sm text-muted-foreground">Revisions</div>
          </div>
          <div className="rounded-md border bg-background p-3">
            <div className="text-2xl font-semibold">3</div>
            <div className="text-sm text-muted-foreground">Badges</div>
          </div>
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-2xl font-semibold tracking-normal">Created datasets</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {created.map((dataset) => (
            <DatasetCard key={dataset.id} dataset={dataset} />
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-2xl font-semibold tracking-normal">Activity feed</h2>
        <div className="mt-4 divide-y rounded-lg border bg-card">
          {authored.map((revision) => (
            <div key={revision.id} className="p-4">
              <div className="font-medium">{revision.changeSummary}</div>
              <div className="text-sm text-muted-foreground">{new Date(revision.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

