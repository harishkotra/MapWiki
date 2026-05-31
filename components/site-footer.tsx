import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container grid gap-6 py-8 text-sm text-muted-foreground md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-md">
          <div className="font-semibold text-foreground">MapWiki</div>
          <p className="mt-2">Open geographic knowledge with citations, revision history, and community review.</p>
        </div>
        <nav className="grid gap-2" aria-label="MapWiki links">
          <Link href="/map" className="hover:text-foreground">
            Explore Map
          </Link>
          <Link href="/datasets/new" className="hover:text-foreground">
            Create Dataset
          </Link>
          <Link href="/api/openapi" className="hover:text-foreground">
            OpenAPI
          </Link>
        </nav>
        <nav className="grid gap-2" aria-label="Creator links">
          <Link href="https://harishkotra.me" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Built By Harish Kotra
          </Link>
          <Link href="https://dailybuild.xyz" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Checkout my other builds
          </Link>
        </nav>
      </div>
    </footer>
  );
}
