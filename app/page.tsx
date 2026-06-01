import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronRight, Crosshair, ExternalLink, Home, Minus, Plus, Search, SlidersHorizontal, X } from "lucide-react";

const tags = ["All tags", "Archaeological Sites", "Natural Wonders", "Historical Events", "Endangered Species", "UNESCO Heritage", "Cultural Landmarks"];

const updates = [
  {
    title: "New archaeological discoveries in Greece",
    time: "2 hours ago",
    image: "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?auto=format&fit=crop&w=320&q=80"
  },
  {
    title: "Elephant population data updated",
    time: "5 hours ago",
    image: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=320&q=80"
  },
  {
    title: "Melting rates of Himalayan glaciers mapped",
    time: "1 day ago",
    image: "https://images.unsplash.com/photo-1486911278844-a81c5267e227?auto=format&fit=crop&w=320&q=80"
  }
];

const usefulLinks = [
  { label: "About MapWiki", href: "/map" },
  { label: "Community guidelines", href: "/moderation" },
  { label: "Source code", href: "https://github.com/harishkotra/MapWiki" },
  { label: "API & Data access", href: "/api/openapi" }
];

const exampleTags = ["Archaeological Sites", "Natural Wonders", "Historical Events", "Endangered Species", "UNESCO Heritage"];

const points = [
  [45, 27],
  [49, 29],
  [52, 31],
  [57, 30],
  [60, 34],
  [65, 31],
  [71, 33],
  [78, 35],
  [82, 29],
  [88, 37],
  [35, 37],
  [31, 45],
  [26, 55],
  [40, 59],
  [46, 67],
  [52, 73],
  [61, 78],
  [72, 73],
  [81, 64],
  [88, 55],
  [22, 71],
  [19, 76],
  [74, 22],
  [80, 24],
  [87, 25],
  [91, 33],
  [68, 44],
  [58, 48],
  [50, 43],
  [44, 49],
  [38, 52],
  [30, 33],
  [23, 40],
  [17, 50],
  [16, 66],
  [21, 82],
  [58, 85],
  [64, 89],
  [74, 86],
  [84, 79]
];

const heatSpots = [
  { left: "46%", top: "34%", size: "56px" },
  { left: "52%", top: "36%", size: "78px" },
  { left: "60%", top: "40%", size: "70px" },
  { left: "72%", top: "43%", size: "64px" },
  { left: "84%", top: "55%", size: "78px" },
  { left: "29%", top: "39%", size: "72px" },
  { left: "18%", top: "70%", size: "70px" },
  { left: "22%", top: "78%", size: "60px" },
  { left: "43%", top: "64%", size: "60px" },
  { left: "66%", top: "74%", size: "52px" }
];

const popups = [
  {
    className: "left-[12%] top-[20%] w-[260px]",
    title: "Colosseum",
    place: "Rome, Italy",
    time: "2nd century AD",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=240&q=80"
  },
  {
    className: "right-[11%] top-[45%] w-[250px]",
    title: "Machu Picchu",
    place: "Cusco Region, Peru",
    time: "15th century",
    image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=240&q=80"
  },
  {
    className: "left-[43%] top-[58%] w-[260px]",
    title: "Pyramids of Giza",
    place: "Giza, Egypt",
    time: "c. 2560 BC",
    image: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=240&q=80"
  }
];

function WikiLogo() {
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-neutral-300 bg-[radial-gradient(circle_at_35%_28%,#ffffff,#d8d8d4_48%,#a8a8a2_100%)] shadow-sm">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_47%,rgba(0,0,0,0.18)_48%,transparent_49%),linear-gradient(0deg,transparent_48%,rgba(0,0,0,0.12)_49%,transparent_50%)] bg-[length:18px_18px]" />
      {["M", "W", "K", "I", "A", "P", "G", "H"].map((letter, index) => (
        <span
          key={letter}
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

function HeatSpot({ left, top, size }: { left: string; top: string; size: string }) {
  return (
    <span
      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 blur-[0.3px]"
      style={{
        left,
        top,
        width: size,
        height: size,
        background:
          "radial-gradient(circle, rgba(239,68,68,0.95) 0 10%, rgba(250,204,21,0.9) 16%, rgba(34,211,238,0.65) 35%, rgba(59,130,246,0.18) 58%, transparent 72%)"
      }}
    />
  );
}

function GlobeMap() {
  return (
    <div className="absolute left-1/2 top-4 h-[780px] w-[780px] -translate-x-1/2 overflow-hidden rounded-full border border-neutral-300/80 bg-[#f2f2ef] shadow-[inset_28px_20px_70px_rgba(255,255,255,0.95),inset_-38px_-20px_90px_rgba(0,0,0,0.08)] md:h-[920px] md:w-[920px] xl:h-[1120px] xl:w-[1120px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(255,255,255,0.92),rgba(255,255,255,0.24)_46%,rgba(0,0,0,0.08)_100%)]" />
      <svg className="absolute inset-[2%] h-[96%] w-[96%] opacity-75" viewBox="0 0 1000 1000" aria-hidden="true">
        <defs>
          <clipPath id="globeClip">
            <circle cx="500" cy="500" r="488" />
          </clipPath>
        </defs>
        <g clipPath="url(#globeClip)" fill="none">
          {[-360, -240, -120, 0, 120, 240, 360].map((x) => (
            <ellipse key={x} cx={500 + x} cy="500" rx="305" ry="488" stroke="#d7d7d2" strokeWidth="0.7" />
          ))}
          {[230, 310, 390, 470, 550, 630, 710, 790].map((y) => (
            <path key={y} d={`M20 ${y} C260 ${y - 48} 740 ${y - 48} 980 ${y}`} stroke="#d9d9d4" strokeWidth="0.7" />
          ))}
          <g stroke="#7d7d78" strokeWidth="1.25">
            <path d="M430 250c42-34 90-40 135-24 24 9 49 9 76 0 39-12 84 2 116 26-52 11-82 34-108 70-35 48-71 58-122 34-27-13-56-8-83 9-29 18-59 11-84-12-28-26-31-70 70-103Z" />
            <path d="M380 295c-42 16-71 49-92 86-18 33-44 49-79 51-46 2-75 27-87 67 50-10 84 9 104 48 20 40 54 48 99 33 51-17 72 0 94 43 15 29 42 36 73 23 40-16 56-50 46-100-8-39 8-70 40-94 34-25 28-62-15-81-54-24-68-62-44-114-53 40-89 52-139 38Z" />
            <path d="M585 365c36 15 62 44 80 87 12 28 36 46 70 55 46 13 68 44 61 88-36-22-68-21-98 1-31 23-58 18-83-16-27-36-52-43-88-23-39 22-68 9-82-35-11-33-4-66 22-99 27-34 68-52 118-58Z" />
            <path d="M735 325c49-18 96-18 142 2 38 16 64 46 78 89-47-13-78-5-94 25-19 34-51 45-96 32-43-12-70 2-84 45-21-60-2-125 54-193Z" />
            <path d="M775 580c36 12 58 39 65 81 7 44-6 85-40 122-24 26-34 59-31 99-52-57-69-125-51-205 10-44 29-76 57-97Z" />
            <path d="M265 625c43 11 69 40 77 88 9 52-7 103-49 153-52-47-67-105-46-175 7-25 13-47 18-66Z" />
            <path d="M500 706c50 15 88 46 114 93 22 40 24 83 8 128-39-58-80-84-123-76-35 7-63-8-84-45-23-42-14-75 28-99 18-10 37-10 57-1Z" />
            <path d="M168 410c-33 12-58 35-76 68-18 32-22 65-13 99 40-30 68-26 84 12 12 32 35 43 70 33-21-59-22-129-65-212Z" />
          </g>
          <g stroke="#a9a9a3" strokeWidth="0.65" opacity="0.75">
            <path d="M510 282c16 12 18 28 8 47M557 245c-8 29-3 58 16 87M320 390c28 12 47 35 57 69M260 507c24-11 51-12 80-2M649 408c42-5 72 8 92 40M760 394c23 22 31 52 24 89M543 590c29 33 38 74 27 124M315 711c-20 37-23 77-9 120M792 647c-29 51-37 103-24 156" />
          </g>
        </g>
      </svg>
      {heatSpots.map((spot, index) => (
        <HeatSpot key={`${spot.left}-${spot.top}-${index}`} {...spot} />
      ))}
      {points.map(([left, top], index) => (
        <span
          key={`${left}-${top}-${index}`}
          className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-700 shadow-[0_0_0_2px_rgba(255,255,255,0.72),0_0_10px_rgba(91,33,182,0.55)]"
          style={{ left: `${left}%`, top: `${top}%` }}
        />
      ))}
    </div>
  );
}

function MapPopup({ popup }: { popup: (typeof popups)[number] }) {
  return (
    <article className={`absolute hidden rounded-lg border border-neutral-200 bg-white/92 p-3 shadow-[0_12px_36px_rgba(0,0,0,0.12)] backdrop-blur md:block ${popup.className}`}>
      <button type="button" className="absolute right-2 top-2 text-neutral-500" aria-label={`Close ${popup.title} preview`}>
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex gap-3 pr-4">
        <Image src={popup.image} alt="" width={86} height={72} className="h-[72px] w-[86px] rounded-md object-cover" />
        <div className="pt-1">
          <h3 className="text-sm font-semibold text-neutral-950">{popup.title}</h3>
          <p className="mt-1 text-xs leading-5 text-neutral-700">{popup.place}</p>
          <p className="text-xs leading-5 text-neutral-700">{popup.time}</p>
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  return (
    <section className="min-h-screen overflow-hidden bg-[#f7f7f4] text-neutral-950">
      <div className="grid min-h-screen lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="z-20 flex min-h-screen flex-col border-r border-neutral-200 bg-[#fbfbf8]/95 px-6 py-8 shadow-[1px_0_0_rgba(255,255,255,0.9)] lg:px-7">
          <Link href="/" className="flex items-center gap-4" aria-label="MapWiki home">
            <WikiLogo />
            <div>
              <div className="font-serif text-4xl uppercase leading-none tracking-[0.02em]">MapWiki</div>
              <p className="mt-1 text-sm text-neutral-600">The world, together.</p>
            </div>
          </Link>

          <div className="mt-12">
            <h1 className="font-serif text-3xl leading-tight tracking-normal">Welcome to MapWiki</h1>
            <p className="mt-5 max-w-[280px] text-[15px] leading-7 text-neutral-700">
              MapWiki is a collaborative map of the world. Explore, learn, and contribute to build the most comprehensive map of human knowledge.
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
              {updates.map((update) => (
                <article key={update.title} className="grid grid-cols-[110px_1fr] gap-4">
                  <Image src={update.image} alt="" width={220} height={150} className="h-[74px] w-[110px] rounded-md object-cover" />
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
              {usefulLinks.map((item) => (
                <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950">
                  <span>{item.label}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              ))}
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
              Built by{" "}
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
            aria-label="Map tags"
          >
            {tags.map((tag, index) => (
              <Link key={tag} href={index === 0 ? "/map" : `/map?tag=${encodeURIComponent(tag)}`} className={`relative shrink-0 whitespace-nowrap py-8 ${index === 1 ? "font-serif text-lg text-neutral-950" : ""}`}>
                {tag}
                {index === 1 && <span className="absolute inset-x-8 -bottom-px h-px bg-neutral-950" />}
              </Link>
            ))}
            <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-neutral-700" />
          </nav>

          <div className="relative h-[calc(100vh-92px)] min-h-[760px]">
            <GlobeMap />

            <div className="absolute left-7 top-[12%] z-20 grid gap-3">
              <Link href="/" className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white/88 text-neutral-950 shadow-[0_12px_28px_rgba(0,0,0,0.08)] backdrop-blur" aria-label="Home">
                <Home className="h-5 w-5" />
              </Link>
              <div className="grid overflow-hidden rounded-2xl border border-neutral-200 bg-white/88 shadow-[0_12px_28px_rgba(0,0,0,0.08)] backdrop-blur">
                <button type="button" className="flex h-12 w-12 items-center justify-center border-b border-neutral-200" aria-label="Zoom in">
                  <Plus className="h-5 w-5" />
                </button>
                <button type="button" className="flex h-12 w-12 items-center justify-center" aria-label="Zoom out">
                  <Minus className="h-5 w-5" />
                </button>
              </div>
              <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white/88 text-neutral-950 shadow-[0_12px_28px_rgba(0,0,0,0.08)] backdrop-blur" aria-label="Locate">
                <Crosshair className="h-5 w-5" />
              </button>
            </div>

            <aside className="absolute right-6 top-7 z-20 w-[188px] rounded-xl border border-neutral-200 bg-white/90 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.1)] backdrop-blur">
              <div className="border-b border-neutral-200 pb-4">
                <p className="text-xs text-neutral-700">Time period</p>
                <button type="button" className="mt-4 flex w-full items-center justify-between text-sm text-neutral-950">
                  All time
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <div className="pt-5">
                <p className="text-xs text-neutral-700">View options</p>
                <div className="mt-4 grid gap-4">
                  {["Heatmap", "Points", "Borders", "Labels"].map((label, index) => (
                    <div key={label} className="flex items-center justify-between text-sm text-neutral-800">
                      <span>{label}</span>
                      <span className={`relative h-5 w-9 rounded-full ${index < 3 ? "bg-blue-700" : "bg-neutral-300"}`} aria-hidden="true">
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm ${index < 3 ? "right-0.5" : "left-0.5"}`} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {popups.map((popup) => (
              <MapPopup key={popup.title} popup={popup} />
            ))}

            <div className="absolute bottom-14 left-7 z-20 rounded-xl border border-neutral-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.1)] backdrop-blur">
              <div className="flex items-center gap-4 text-sm text-neutral-800">
                <span className="h-2 w-2 rounded-full bg-blue-700 shadow-[0_0_0_2px_rgba(37,99,235,0.12)]" />
                Point of interest
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-neutral-800">
                <span
                  className="h-6 w-6 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(239,68,68,0.95) 0 16%, rgba(250,204,21,0.9) 34%, rgba(34,211,238,0.65) 58%, rgba(59,130,246,0.18) 78%)"
                  }}
                />
                High density area
              </div>
            </div>

            <div className="absolute bottom-12 right-6 z-20 flex flex-wrap justify-end gap-3">
              <Link href="/map" className="flex h-12 items-center gap-3 rounded-full border border-neutral-200 bg-white/92 px-5 text-sm text-neutral-950 shadow-[0_14px_30px_rgba(0,0,0,0.09)] backdrop-blur">
                <Search className="h-5 w-5" />
                Search
              </Link>
              <Link href="/map" className="flex h-12 items-center gap-3 rounded-full border border-neutral-200 bg-white/92 px-5 text-sm text-neutral-950 shadow-[0_14px_30px_rgba(0,0,0,0.09)] backdrop-blur">
                <SlidersHorizontal className="h-5 w-5" />
                Filters
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
