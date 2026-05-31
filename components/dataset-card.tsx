import { Database, Eye, Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactNumber } from "@/lib/utils";
import type { Dataset } from "@/types/domain";

export function DatasetCard({ dataset }: { dataset: Dataset }) {
  return (
    <Link href={`/datasets/${dataset.slug}`} className="group block focus:outline-none">
      <Card className="h-full overflow-hidden transition-colors group-hover:border-primary/50 group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <div className="h-2" style={{ backgroundColor: dataset.color }} />
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{dataset.name}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{dataset.category}</p>
            </div>
            <Badge>{dataset.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="line-clamp-3 text-sm text-muted-foreground">{dataset.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {dataset.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} className="bg-background">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Database className="h-3.5 w-3.5" /> {formatCompactNumber(dataset.objectCount)}
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" /> {formatCompactNumber(dataset.followers)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {formatCompactNumber(dataset.views)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

