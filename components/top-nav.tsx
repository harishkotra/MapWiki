import { Github, Map, Plus, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/features/search/global-search";

export function TopNav() {
  return (
    <header className="mapwiki-top-nav sticky top-0 z-40 border-b bg-background/92 backdrop-blur">
      <div className="container flex h-14 items-center gap-3">
        <Link href="/" className="mapwiki-top-nav-brand flex shrink-0 items-center gap-2 font-semibold" aria-label="MapWiki home">
          <span className="mapwiki-top-nav-mark flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Map className="h-4 w-4" />
          </span>
          <span>MapWiki</span>
        </Link>
        <div className="hidden flex-1 justify-center md:flex">
          <GlobalSearch />
        </div>
        <nav className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href="/map">
              <Map className="h-4 w-4" />
              Map
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/moderation">
              <Shield className="h-4 w-4" />
              Moderation
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="https://github.com/harishkotra/MapWiki" target="_blank" rel="noreferrer">
              <Github className="h-4 w-4" />
              Source
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/datasets/new">
              <Plus className="h-4 w-4" />
              Create
            </Link>
          </Button>
        </nav>
      </div>
      <div className="border-t px-3 py-2 md:hidden">
        <GlobalSearch compact />
      </div>
    </header>
  );
}
