import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { KnowledgeMapStage } from "@/components/wikimap/knowledge-map-stage";

const tags = ["All nodes", "Archaeological Sites", "Energy Infrastructure", "Historical Events", "Industrial Sites", "Disasters", "Cultural Landmarks"];

const updates = [
  {
    title: "WW2 battle casualty attributes updated",
    time: "2 hours ago",
    image: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=320&q=80"
  },
  {
    title: "Offshore platform source package added",
    time: "5 hours ago",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=320&q=80"
  },
  {
    title: "Archaeological survey polygon published",
    time: "1 day ago",
    image: "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?auto=format&fit=crop&w=320&q=80"
  }
];

const usefulLinks = [
  { label: "About Wikimap", href: "/map" },
  { label: "Community guidelines", href: "/moderation" },
  { label: "Source code", href: "https://github.com/harishkotra/MapWiki" },
  { label: "API & Data access", href: "/api/openapi" }
];

const exampleTags = ["battle", "ww2", "deaths > 10000", "nuclear", "oil_platform", "archaeology", "disaster"];

function WikiLogo() {
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-neutral-300 bg-[radial-gradient(circle_at_35%_28%,#ffffff,#d8d8d4_48%,#a8a8a2_100%)] shadow-sm">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_47%,rgba(0,0,0,0.18)_48%,transparent_49%),linear-gradient(0deg,transparent_48%,rgba(0,0,0,0.12)_49%,transparent_50%)] bg-[length:18px_18px]" />
      {["W", "I", "K", "I", "M", "A", "P"].map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          className="absolute font-serif text-[10px] font-semibold text-neutral-700"
          style={{
            left: `${18 + (index % 3) * 16}%`,
            top: `${18 + Math.floor(index / 3) * 20}%`,
            transform: `rotate(${index % 2 ? -12 : 10}deg)`
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <section className="min-h-screen overflow-hidden bg-[#f7f7f4] text-neutral-950">
      <div className="grid min-h-screen lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="z-20 flex min-h-screen flex-col border-r border-neutral-200 bg-[#fbfbf8]/95 px-6 py-8 shadow-[1px_0_0_rgba(255,255,255,0.9)] lg:px-7">
          <Link href="/" className="flex items-center gap-4" aria-label="Wikimap home">
            <WikiLogo />
            <div>
              <div className="font-serif text-4xl uppercase leading-none tracking-[0.02em]">Wikimap</div>
              <p className="mt-1 text-sm text-neutral-600">The world, sourced.</p>
            </div>
          </Link>

          <div className="mt-12">
            <h1 className="font-serif text-3xl leading-tight tracking-normal">Welcome to Wikimap</h1>
            <p className="mt-5 max-w-[292px] text-[15px] leading-7 text-neutral-700">
              Wikimap is built around geolocated knowledge nodes. Each entry can hold geometry, tags, structured attributes, descriptions, and cited sources.
            </p>
          </div>

          <section className="mt-10">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="font-serif text-lg font-semibold">Latest updates</h2>
              <Link href="/map" className="text-sm text-neutral-500 hover:text-neutral-950">
                View all
              </Link>
            </div>
            <div className="mt-4 grid gap-4">
              {updates.map((update, index) => (
                <article key={update.title} className="grid grid-cols-[110px_1fr] gap-4">
                  <Image src={update.image} alt="" width={220} height={150} priority={index === 0} className="h-[74px] w-[110px] rounded-md object-cover" />
                  <div className="min-w-0 pt-1">
                    <h3 className="font-serif text-[15px] leading-5 text-neutral-950">{update.title}</h3>
                    <p className="mt-2 text-xs text-neutral-500">{update.time}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-9">
            <h2 className="border-b border-neutral-200 pb-3 font-serif text-lg font-semibold">Useful links</h2>
            <div className="mt-3 grid gap-1">
              {usefulLinks.map((item) => {
                const isExternal = item.href.startsWith("https://");
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer" : undefined}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
                  >
                    <span>{item.label}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="font-serif text-lg font-semibold">Example tags</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {exampleTags.map((tag, index) => (
                <Link
                  key={tag}
                  href={`/map?tag=${encodeURIComponent(tag)}`}
                  className={`rounded-md border px-3 py-2 text-xs transition-colors ${
                    index === 0 ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400"
                  }`}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </section>

          <div className="mt-auto pt-8 text-sm leading-6 text-neutral-500">
            <p>
              Built By{" "}
              <Link href="https://harishkotra.me" className="text-neutral-800 underline-offset-4 hover:underline">
                Harish Kotra
              </Link>
              .
            </p>
            <p>
              Checkout my other builds at{" "}
              <Link href="https://dailybuild.xyz" className="text-neutral-800 underline-offset-4 hover:underline">
                DailyBuild
              </Link>
              .
            </p>
          </div>
        </aside>

        <div className="relative min-h-screen overflow-hidden">
          <nav
            className="relative z-20 flex h-[92px] items-center gap-8 overflow-x-auto border-b border-transparent px-6 text-[15px] text-neutral-700 [-ms-overflow-style:none] [scrollbar-width:none] lg:px-10 [&::-webkit-scrollbar]:hidden"
            aria-label="Knowledge tags"
          >
            {tags.map((tag, index) => (
              <Link key={tag} href={index === 0 ? "/map" : `/map?tag=${encodeURIComponent(tag)}`} className={`relative shrink-0 whitespace-nowrap py-8 ${index === 1 ? "font-serif text-lg text-neutral-950" : ""}`}>
                {tag}
                {index === 1 && <span className="absolute inset-x-8 -bottom-px h-px bg-neutral-950" />}
              </Link>
            ))}
            <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-neutral-700" />
          </nav>

          <KnowledgeMapStage />
        </div>
      </div>
    </section>
  );
}
