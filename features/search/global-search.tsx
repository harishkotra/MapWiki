"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounce";
import type { SearchResult } from "@/types/domain";

async function search(q: string) {
  const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Search failed.");
  return body.data as SearchResult[];
}

export function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 220);
  const results = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => search(debounced),
    enabled: debounced.trim().length >= 2
  });

  return (
    <div className={compact ? "relative w-full" : "relative w-full max-w-md"}>
      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search datasets, places, tags"
        className="pl-9"
        aria-label="Global search"
      />
      {query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-11 z-50 max-h-96 overflow-auto rounded-lg border bg-card shadow-panel">
          {results.isLoading && <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>}
          {results.data?.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>}
          {results.data?.map((result) => (
            <Link
              key={`${result.type}-${result.id}`}
              href={result.href}
              className="block border-b px-3 py-2 text-sm last:border-b-0 hover:bg-muted focus:bg-muted focus:outline-none"
              onClick={() => setQuery("")}
            >
              <span className="block font-medium">{result.title}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {result.type} {result.subtitle ? `· ${result.subtitle}` : ""}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

