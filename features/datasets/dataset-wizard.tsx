"use client";

import { ArrowLeft, ArrowRight, Check, Database, FileUp, Globe2, MapPin, PenLine } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImportDropzone } from "@/features/imports/import-dropzone";
import { createDatasetAction } from "@/server/actions/datasets";

const steps = [
  { title: "Metadata", icon: PenLine },
  { title: "Geometry", icon: MapPin },
  { title: "Objects", icon: FileUp },
  { title: "Preview", icon: Database },
  { title: "Publish", icon: Globe2 }
];

export function DatasetWizard() {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Infrastructure",
    tags: "open-data, community",
    visibility: "public",
    geometryType: "Point"
  });

  const payload = useMemo(
    () => ({
      ...form,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    }),
    [form]
  );

  function publish() {
    startTransition(async () => {
      const result = await createDatasetAction(payload);
      if (result.ok && result.data) {
        setMessage(`Created ${result.data.name} as a draft.`);
      } else {
        setMessage(result.error ?? "Could not publish dataset.");
      }
    });
  }

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal">Create dataset</h1>
        <p className="mt-2 text-muted-foreground">Build a cited map layer with recoverable edits and import-ready objects.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav className="rounded-lg border bg-card p-2" aria-label="Dataset creation steps">
          {steps.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setStep(index)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm ${step === index ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </button>
          ))}
        </nav>
        <Card>
          <CardHeader>
            <CardTitle>{steps[step].title}</CardTitle>
          </CardHeader>
          <CardContent>
            {step === 0 && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Global Universities" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="Describe the inclusion criteria, source expectations, and scope."
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input id="tags" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
                  </div>
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Geometry type</Label>
                  <Select value={form.geometryType} onValueChange={(value) => setForm({ ...form, geometryType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose geometry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Point">Point</SelectItem>
                      <SelectItem value="LineString">LineString</SelectItem>
                      <SelectItem value="Polygon">Polygon</SelectItem>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 rounded-lg border bg-background p-4 text-sm text-muted-foreground md:grid-cols-3">
                  <div>Points: facilities, discoveries, sites, labs.</div>
                  <div>Lines: routes, borders, campaigns, cables.</div>
                  <div>Polygons: campuses, reserves, historical regions.</div>
                </div>
              </div>
            )}
            {step === 2 && <ImportDropzone />}
            {step === 3 && (
              <div className="rounded-lg border bg-background p-4">
                <h3 className="font-medium">{form.name || "Untitled dataset"}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{form.description || "No description yet."}</p>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                  <div className="rounded-md border bg-card p-3">Category: {form.category}</div>
                  <div className="rounded-md border bg-card p-3">Geometry: {form.geometryType}</div>
                  <div className="rounded-md border bg-card p-3">Visibility: {form.visibility}</div>
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-background p-4">
                  <div className="flex items-center gap-2 font-medium">
                    <Check className="h-4 w-4 text-primary" />
                    Draft dataset ready
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Publishing creates a draft revision. Moderation can approve, lock, or restore it later.</p>
                </div>
                {message && <div className="rounded-md border bg-muted p-3 text-sm">{message}</div>}
                <Button onClick={publish} disabled={pending}>
                  {pending ? "Publishing..." : "Publish draft"}
                </Button>
              </div>
            )}
            <div className="mt-6 flex justify-between border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button type="button" onClick={() => setStep(Math.min(steps.length - 1, step + 1))} disabled={step === steps.length - 1}>
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
