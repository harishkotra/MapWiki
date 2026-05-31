"use client";

import { UploadCloud } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ImportSummary } from "@/types/domain";

export function ImportDropzone() {
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function upload(file: File) {
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/imports", { method: "POST", body: form });
    const body = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(body.error ?? "Import failed.");
      return;
    }
    setSummary(body.data as ImportSummary);
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-background px-4 py-8 text-center hover:bg-muted">
        <UploadCloud className="h-7 w-7 text-primary" />
        <span className="mt-2 text-sm font-medium">Upload CSV, TSV, GeoJSON, KML, or GPX</span>
        <span className="mt-1 text-xs text-muted-foreground">Files are validated and previewed before anything is published.</span>
        <input
          type="file"
          className="sr-only"
          accept=".csv,.tsv,.geojson,.json,.kml,.gpx"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </label>
      {loading && <p className="mt-3 text-sm text-muted-foreground">Validating file...</p>}
      {error && (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {summary && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{summary.fileType.toUpperCase()}</Badge>
            <Badge>{summary.totalRows} rows</Badge>
            <Badge>{summary.validRows} valid</Badge>
            <Badge>{summary.invalidRows} invalid</Badge>
            <Badge>{summary.requiresGeocoding} need geocoding</Badge>
          </div>
          <div className="max-h-56 overflow-auto rounded-md border">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-muted text-muted-foreground">
                <tr>
                  <th className="px-2 py-1">Row</th>
                  <th className="px-2 py-1">Title</th>
                  <th className="px-2 py-1">Geometry</th>
                  <th className="px-2 py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.preview.slice(0, 12).map((row) => (
                  <tr key={row.rowNumber} className="border-t">
                    <td className="px-2 py-1">{row.rowNumber}</td>
                    <td className="px-2 py-1">{row.title}</td>
                    <td className="px-2 py-1">{row.geometry?.type ?? "geocode"}</td>
                    <td className="px-2 py-1">{row.errors.length ? row.errors[0] : "Ready"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Button type="button" variant="outline" className="mt-3" disabled={!summary}>
        Use previewed rows
      </Button>
    </div>
  );
}

