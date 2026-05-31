import type { Metadata } from "next";
import { Database, Lock, Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { listDatasets, listLocations, listUsers } from "@/server/db/repositories";

export const metadata: Metadata = {
  title: "Admin"
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [datasets, locations, users] = await Promise.all([listDatasets({ limit: 100 }), listLocations({ limit: 5000 }), listUsers()]);
  const cards = [
    { label: "Users", value: users.length, icon: Users },
    { label: "Datasets", value: datasets.length, icon: Database },
    { label: "Objects", value: locations.length, icon: Shield },
    { label: "Locked", value: datasets.filter((dataset) => dataset.status === "locked").length, icon: Lock }
  ];

  return (
    <div className="container py-8">
      <Badge>Admin</Badge>
      <h1 className="mt-3 text-3xl font-semibold tracking-normal">System overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-5">
            <card.icon className="h-5 w-5 text-primary" />
            <div className="mt-3 text-3xl font-semibold">{card.value}</div>
            <div className="text-sm text-muted-foreground">{card.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-lg border bg-card">
        <div className="border-b p-4 font-medium">Role management</div>
        <div className="divide-y">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
              <Badge>{user.role}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
