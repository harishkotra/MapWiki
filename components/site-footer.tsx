import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container grid gap-6 py-8 text-sm text-muted-foreground md:grid-cols-4">
        <div>
          <div className="font-semibold text-foreground">MapWiki</div>
          <p className="mt-2">Open geographic knowledge with citations, revision history, and community review.</p>
        </div>
        <Link href="/map" className="hover:text-foreground">
          Explore Map
        </Link>
        <Link href="/datasets/new" className="hover:text-foreground">
          Create Dataset
        </Link>
        <Link href="/api/openapi" className="hover:text-foreground">
          OpenAPI
        </Link>
      </div>
    </footer>
  );
}

