import type { Comment, Dataset, Location, Revision, User } from "@/types/domain";

const now = new Date("2026-05-01T12:00:00.000Z").toISOString();

export const sampleUsers: User[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Maya Chen",
    email: "maya@example.invalid",
    image: "https://avatars.githubusercontent.com/u/583231?v=4",
    bio: "GIS editor focused on civic infrastructure and public-interest datasets.",
    role: "admin",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Owen Hart",
    email: "owen@example.invalid",
    image: "https://avatars.githubusercontent.com/u/9919?v=4",
    bio: "Historian mapping conflicts, trade routes, and archival sources.",
    role: "moderator",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Asha Rao",
    email: "asha@example.invalid",
    image: "https://avatars.githubusercontent.com/u/810438?v=4",
    bio: "Open data contributor for energy and science datasets.",
    role: "registered",
    createdAt: now,
    updatedAt: now
  }
];

export const sampleDatasets: Dataset[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    slug: "global-data-centers",
    name: "Global Data Centers",
    description:
      "Major cloud, colocation, and hyperscale data center campuses with ownership, capacity notes, and public source references.",
    coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
    category: "Infrastructure",
    tags: ["cloud", "internet", "critical-infrastructure", "energy"],
    creatorId: sampleUsers[0].id,
    creatorName: sampleUsers[0].name,
    visibility: "public",
    status: "published",
    objectCount: 4,
    followers: 1274,
    views: 48230,
    color: "#0f766e",
    defaultOpacity: 0.82,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    slug: "major-historical-battles",
    name: "Major Historical Battles",
    description:
      "Battlefields and campaign areas with dates, belligerents, outcomes, and archival citations.",
    coverImage: "https://images.unsplash.com/photo-1529260830199-42c24126f198",
    category: "History",
    tags: ["history", "conflict", "archives", "education"],
    creatorId: sampleUsers[1].id,
    creatorName: sampleUsers[1].name,
    visibility: "public",
    status: "published",
    objectCount: 4,
    followers: 812,
    views: 22341,
    color: "#b45309",
    defaultOpacity: 0.74,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    slug: "space-launch-sites",
    name: "Space Launch Sites",
    description:
      "Operational and historically significant launch sites, pads, and ranges used by public and commercial space programs.",
    coverImage: "https://images.unsplash.com/photo-1517976487492-5750f3195933",
    category: "Science",
    tags: ["space", "aerospace", "launch", "science"],
    creatorId: sampleUsers[2].id,
    creatorName: sampleUsers[2].name,
    visibility: "public",
    status: "published",
    objectCount: 4,
    followers: 1551,
    views: 61109,
    color: "#2563eb",
    defaultOpacity: 0.78,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    slug: "nuclear-power-plants",
    name: "Nuclear Power Plants",
    description:
      "Civilian nuclear power stations with reactor counts, operating status, capacity, and regulatory source links.",
    coverImage: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e",
    category: "Energy",
    tags: ["nuclear", "electricity", "energy", "reactors"],
    creatorId: sampleUsers[0].id,
    creatorName: sampleUsers[0].name,
    visibility: "public",
    status: "published",
    objectCount: 4,
    followers: 934,
    views: 36718,
    color: "#7c3aed",
    defaultOpacity: 0.7,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    slug: "ai-research-labs",
    name: "AI Research Labs",
    description:
      "Academic, nonprofit, and industry AI research labs with focus areas, founding context, and institutional affiliations.",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    category: "Technology",
    tags: ["ai", "research", "universities", "industry"],
    creatorId: sampleUsers[2].id,
    creatorName: sampleUsers[2].name,
    visibility: "public",
    status: "published",
    objectCount: 5,
    followers: 2140,
    views: 91042,
    color: "#db2777",
    defaultOpacity: 0.82,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    slug: "renewable-energy-projects",
    name: "Renewable Energy Projects",
    description:
      "Utility-scale solar, wind, hydro, and geothermal projects with technology, capacity, and commissioning data.",
    coverImage: "https://images.unsplash.com/photo-1509391366360-2e959784a276",
    category: "Energy",
    tags: ["renewables", "solar", "wind", "climate"],
    creatorId: sampleUsers[0].id,
    creatorName: sampleUsers[0].name,
    visibility: "public",
    status: "published",
    objectCount: 4,
    followers: 1168,
    views: 44190,
    color: "#16a34a",
    defaultOpacity: 0.76,
    createdAt: now,
    updatedAt: now
  }
];

const source = (id: string, title: string, url: string) => ({
  id,
  title,
  url,
  publicationDate: "2025-01-01",
  notes: "Seed citation for MVP demonstration.",
  reliabilityScore: 4
});

export const sampleLocations: Location[] = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    datasetId: sampleDatasets[0].id,
    title: "Equinix Ashburn Campus",
    description: "Dense colocation cluster in Northern Virginia's Data Center Alley.",
    geometry: { type: "Point", coordinates: [-77.4874, 39.0438] },
    geometryType: "Point",
    metadata: { operator: "Equinix", market: "Northern Virginia", status: "operational" },
    sources: [source("30000000-0000-4000-8000-000000000001", "Equinix DC metro overview", "https://www.equinix.com/data-centers/americas-colocation/united-states-colocation/washington-dc-data-centers")],
    createdBy: sampleUsers[0].id,
    updatedBy: sampleUsers[0].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    datasetId: sampleDatasets[0].id,
    title: "Google Council Bluffs Data Center",
    description: "Google hyperscale campus in Iowa supporting cloud and consumer services.",
    geometry: { type: "Point", coordinates: [-95.8608, 41.2619] },
    geometryType: "Point",
    metadata: { operator: "Google", market: "Iowa", status: "operational" },
    sources: [source("30000000-0000-4000-8000-000000000002", "Google data centers", "https://www.google.com/about/datacenters/locations/")],
    createdBy: sampleUsers[0].id,
    updatedBy: sampleUsers[0].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    datasetId: sampleDatasets[0].id,
    title: "AWS Oregon Region",
    description: "Pacific Northwest availability zone cluster serving AWS us-west-2.",
    geometry: { type: "Point", coordinates: [-119.2921, 45.8404] },
    geometryType: "Point",
    metadata: { operator: "Amazon Web Services", region: "us-west-2", status: "operational" },
    sources: [source("30000000-0000-4000-8000-000000000003", "AWS global infrastructure", "https://aws.amazon.com/about-aws/global-infrastructure/")],
    createdBy: sampleUsers[0].id,
    updatedBy: sampleUsers[0].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    datasetId: sampleDatasets[0].id,
    title: "Digital Realty Marseille",
    description: "Mediterranean connectivity hub near submarine cable landing routes.",
    geometry: { type: "Point", coordinates: [5.3698, 43.2965] },
    geometryType: "Point",
    metadata: { operator: "Digital Realty", market: "Marseille", status: "operational" },
    sources: [source("30000000-0000-4000-8000-000000000004", "Digital Realty Marseille", "https://www.digitalrealty.com/data-centers/emea/marseille")],
    createdBy: sampleUsers[0].id,
    updatedBy: sampleUsers[0].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000005",
    datasetId: sampleDatasets[1].id,
    title: "Battle of Gettysburg",
    description: "Three-day battle and turning point of the American Civil War.",
    geometry: {
      type: "Polygon",
      coordinates: [[[-77.255, 39.86], [-77.18, 39.86], [-77.18, 39.785], [-77.255, 39.785], [-77.255, 39.86]]]
    },
    geometryType: "Polygon",
    metadata: { date: "1863-07-01", outcome: "Union victory", belligerents: ["Union", "Confederacy"] },
    sources: [source("30000000-0000-4000-8000-000000000005", "National Park Service Gettysburg", "https://www.nps.gov/gett/index.htm")],
    createdBy: sampleUsers[1].id,
    updatedBy: sampleUsers[1].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000006",
    datasetId: sampleDatasets[1].id,
    title: "Battle of Waterloo",
    description: "Napoleon's final defeat near Waterloo in present-day Belgium.",
    geometry: {
      type: "Polygon",
      coordinates: [[[4.37, 50.715], [4.46, 50.715], [4.46, 50.655], [4.37, 50.655], [4.37, 50.715]]]
    },
    geometryType: "Polygon",
    metadata: { date: "1815-06-18", outcome: "Coalition victory", belligerents: ["French Empire", "Seventh Coalition"] },
    sources: [source("30000000-0000-4000-8000-000000000006", "Waterloo Battlefield", "https://www.waterloo1815.be/")],
    createdBy: sampleUsers[1].id,
    updatedBy: sampleUsers[1].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000007",
    datasetId: sampleDatasets[1].id,
    title: "D-Day Normandy Landing Beaches",
    description: "Allied amphibious landing zones along the Normandy coast.",
    geometry: {
      type: "LineString",
      coordinates: [[-0.99, 49.37], [-0.72, 49.39], [-0.33, 49.36], [-0.06, 49.32]]
    },
    geometryType: "LineString",
    metadata: { date: "1944-06-06", campaign: "Operation Overlord", status: "historic site" },
    sources: [source("30000000-0000-4000-8000-000000000007", "Imperial War Museums D-Day", "https://www.iwm.org.uk/history/the-10-things-you-need-to-know-about-d-day")],
    createdBy: sampleUsers[1].id,
    updatedBy: sampleUsers[1].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000008",
    datasetId: sampleDatasets[1].id,
    title: "Battle of Plassey",
    description: "Decisive 1757 battle near Palashi that reshaped colonial power in Bengal.",
    geometry: { type: "Point", coordinates: [88.2506, 23.8068] },
    geometryType: "Point",
    metadata: { date: "1757-06-23", outcome: "British East India Company victory" },
    sources: [source("30000000-0000-4000-8000-000000000008", "Encyclopaedia Britannica Plassey", "https://www.britannica.com/event/Battle-of-Plassey")],
    createdBy: sampleUsers[1].id,
    updatedBy: sampleUsers[1].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000009",
    datasetId: sampleDatasets[2].id,
    title: "Kennedy Space Center LC-39A",
    description: "Historic launch complex used by Apollo, Space Shuttle, and commercial crew missions.",
    geometry: { type: "Point", coordinates: [-80.604, 28.6083] },
    geometryType: "Point",
    metadata: { operator: "NASA / SpaceX", country: "United States", status: "active" },
    sources: [source("30000000-0000-4000-8000-000000000009", "NASA Kennedy LC-39A", "https://www.nasa.gov/kennedy/launch-complex-39a/")],
    createdBy: sampleUsers[2].id,
    updatedBy: sampleUsers[2].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000010",
    datasetId: sampleDatasets[2].id,
    title: "Baikonur Cosmodrome",
    description: "World's first and largest operational space launch facility.",
    geometry: { type: "Point", coordinates: [63.305, 45.965] },
    geometryType: "Point",
    metadata: { operator: "Roscosmos", country: "Kazakhstan", status: "active" },
    sources: [source("30000000-0000-4000-8000-000000000010", "Baikonur overview", "https://www.roscosmos.ru/")],
    createdBy: sampleUsers[2].id,
    updatedBy: sampleUsers[2].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000011",
    datasetId: sampleDatasets[2].id,
    title: "Satish Dhawan Space Centre",
    description: "ISRO's primary launch center on Sriharikota island.",
    geometry: { type: "Point", coordinates: [80.2304, 13.7336] },
    geometryType: "Point",
    metadata: { operator: "ISRO", country: "India", status: "active" },
    sources: [source("30000000-0000-4000-8000-000000000011", "ISRO SDSC SHAR", "https://www.isro.gov.in/SDSC.html")],
    createdBy: sampleUsers[2].id,
    updatedBy: sampleUsers[2].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000012",
    datasetId: sampleDatasets[2].id,
    title: "Guiana Space Centre",
    description: "European spaceport near Kourou with equatorial launch advantages.",
    geometry: { type: "Point", coordinates: [-52.768, 5.236] },
    geometryType: "Point",
    metadata: { operator: "ESA / CNES", country: "French Guiana", status: "active" },
    sources: [source("30000000-0000-4000-8000-000000000012", "ESA Europe's Spaceport", "https://www.esa.int/Enabling_Support/Space_Transportation/Europe_s_Spaceport")],
    createdBy: sampleUsers[2].id,
    updatedBy: sampleUsers[2].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000013",
    datasetId: sampleDatasets[3].id,
    title: "Kashiwazaki-Kariwa Nuclear Power Plant",
    description: "Large multi-reactor nuclear power station on Japan's west coast.",
    geometry: { type: "Point", coordinates: [138.599, 37.429] },
    geometryType: "Point",
    metadata: { country: "Japan", reactors: 7, status: "regulatory restart process" },
    sources: [source("30000000-0000-4000-8000-000000000013", "IAEA PRIS", "https://pris.iaea.org/")],
    createdBy: sampleUsers[0].id,
    updatedBy: sampleUsers[0].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000014",
    datasetId: sampleDatasets[3].id,
    title: "Bruce Nuclear Generating Station",
    description: "Large CANDU nuclear generating station in Ontario.",
    geometry: { type: "Point", coordinates: [-81.599, 44.326] },
    geometryType: "Point",
    metadata: { country: "Canada", reactors: 8, status: "operational" },
    sources: [source("30000000-0000-4000-8000-000000000014", "Bruce Power", "https://www.brucepower.com/")],
    createdBy: sampleUsers[0].id,
    updatedBy: sampleUsers[0].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000015",
    datasetId: sampleDatasets[3].id,
    title: "Gravelines Nuclear Power Station",
    description: "French nuclear power station near the North Sea coast.",
    geometry: { type: "Point", coordinates: [2.136, 51.015] },
    geometryType: "Point",
    metadata: { country: "France", reactors: 6, status: "operational" },
    sources: [source("30000000-0000-4000-8000-000000000015", "EDF Gravelines", "https://www.edf.fr/")],
    createdBy: sampleUsers[0].id,
    updatedBy: sampleUsers[0].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000016",
    datasetId: sampleDatasets[3].id,
    title: "Vogtle Electric Generating Plant",
    description: "Nuclear power plant in Georgia with newly commissioned AP1000 units.",
    geometry: { type: "Point", coordinates: [-81.762, 33.143] },
    geometryType: "Point",
    metadata: { country: "United States", reactors: 4, status: "operational" },
    sources: [source("30000000-0000-4000-8000-000000000016", "Southern Nuclear Vogtle", "https://www.southernnuclear.com/")],
    createdBy: sampleUsers[0].id,
    updatedBy: sampleUsers[0].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000017",
    datasetId: sampleDatasets[4].id,
    title: "MIT CSAIL",
    description: "Computer Science and Artificial Intelligence Laboratory in Cambridge.",
    geometry: { type: "Point", coordinates: [-71.0906, 42.3616] },
    geometryType: "Point",
    metadata: { institution: "MIT", focus: ["AI", "systems", "robotics"], type: "academic" },
    sources: [source("30000000-0000-4000-8000-000000000017", "MIT CSAIL", "https://www.csail.mit.edu/")],
    createdBy: sampleUsers[2].id,
    updatedBy: sampleUsers[2].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000018",
    datasetId: sampleDatasets[4].id,
    title: "Stanford AI Lab",
    description: "Long-running artificial intelligence research laboratory at Stanford University.",
    geometry: { type: "Point", coordinates: [-122.173, 37.4275] },
    geometryType: "Point",
    metadata: { institution: "Stanford University", focus: ["machine learning", "robotics"], type: "academic" },
    sources: [source("30000000-0000-4000-8000-000000000018", "Stanford AI Lab", "https://ai.stanford.edu/")],
    createdBy: sampleUsers[2].id,
    updatedBy: sampleUsers[2].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000019",
    datasetId: sampleDatasets[4].id,
    title: "Mila - Quebec AI Institute",
    description: "Montreal-based AI research institute with university and industry partnerships.",
    geometry: { type: "Point", coordinates: [-73.5673, 45.5088] },
    geometryType: "Point",
    metadata: { institution: "Mila", focus: ["deep learning", "responsible AI"], type: "nonprofit" },
    sources: [source("30000000-0000-4000-8000-000000000019", "Mila", "https://mila.quebec/en/")],
    createdBy: sampleUsers[2].id,
    updatedBy: sampleUsers[2].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000020",
    datasetId: sampleDatasets[4].id,
    title: "DeepMind London",
    description: "London research office focused on general-purpose learning systems.",
    geometry: { type: "Point", coordinates: [-0.1276, 51.5072] },
    geometryType: "Point",
    metadata: { organization: "Google DeepMind", focus: ["AI research"], type: "industry" },
    sources: [source("30000000-0000-4000-8000-000000000020", "Google DeepMind", "https://deepmind.google/")],
    createdBy: sampleUsers[2].id,
    updatedBy: sampleUsers[2].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000021",
    datasetId: sampleDatasets[4].id,
    title: "Tsinghua AIR",
    description: "Institute for AI Industry Research at Tsinghua University.",
    geometry: { type: "Point", coordinates: [116.3267, 39.9999] },
    geometryType: "Point",
    metadata: { institution: "Tsinghua University", focus: ["industrial AI"], type: "academic" },
    sources: [source("30000000-0000-4000-8000-000000000021", "Tsinghua AIR", "https://air.tsinghua.edu.cn/en/")],
    createdBy: sampleUsers[2].id,
    updatedBy: sampleUsers[2].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000022",
    datasetId: sampleDatasets[5].id,
    title: "Bhadla Solar Park",
    description: "Large utility-scale solar park in Rajasthan.",
    geometry: {
      type: "Polygon",
      coordinates: [[[71.15, 27.61], [71.35, 27.61], [71.35, 27.48], [71.15, 27.48], [71.15, 27.61]]]
    },
    geometryType: "Polygon",
    metadata: { country: "India", technology: "solar", capacityMw: 2245 },
    sources: [source("30000000-0000-4000-8000-000000000022", "IRENA renewable projects", "https://www.irena.org/")],
    createdBy: sampleUsers[0].id,
    updatedBy: sampleUsers[0].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000023",
    datasetId: sampleDatasets[5].id,
    title: "Hornsea Offshore Wind Farm",
    description: "Major offshore wind development in the North Sea.",
    geometry: {
      type: "Polygon",
      coordinates: [[[1.55, 53.95], [2.15, 53.95], [2.15, 53.65], [1.55, 53.65], [1.55, 53.95]]]
    },
    geometryType: "Polygon",
    metadata: { country: "United Kingdom", technology: "offshore wind", capacityMw: 1218 },
    sources: [source("30000000-0000-4000-8000-000000000023", "Orsted Hornsea", "https://orsted.com/")],
    createdBy: sampleUsers[0].id,
    updatedBy: sampleUsers[0].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000024",
    datasetId: sampleDatasets[5].id,
    title: "The Geysers Geothermal Complex",
    description: "Large geothermal power complex in Northern California.",
    geometry: { type: "Point", coordinates: [-122.75, 38.78] },
    geometryType: "Point",
    metadata: { country: "United States", technology: "geothermal", capacityMw: 725 },
    sources: [source("30000000-0000-4000-8000-000000000024", "Calpine The Geysers", "https://www.calpine.com/")],
    createdBy: sampleUsers[0].id,
    updatedBy: sampleUsers[0].id,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "20000000-0000-4000-8000-000000000025",
    datasetId: sampleDatasets[5].id,
    title: "Itaipu Hydroelectric Dam",
    description: "Major hydroelectric dam on the Parana River between Brazil and Paraguay.",
    geometry: {
      type: "LineString",
      coordinates: [[-54.61, -25.39], [-54.57, -25.41], [-54.55, -25.43]]
    },
    geometryType: "LineString",
    metadata: { countries: ["Brazil", "Paraguay"], technology: "hydro", capacityMw: 14000 },
    sources: [source("30000000-0000-4000-8000-000000000025", "Itaipu Binacional", "https://www.itaipu.gov.br/en")],
    createdBy: sampleUsers[0].id,
    updatedBy: sampleUsers[0].id,
    createdAt: now,
    updatedAt: now
  }
];

export const sampleRevisions: Revision[] = sampleDatasets.map((dataset) => ({
  id: `40000000-0000-4000-8000-${dataset.id.slice(-12)}`,
  targetType: "dataset",
  targetId: dataset.id,
  parentRevisionId: null,
  authorId: dataset.creatorId,
  authorName: dataset.creatorName,
  changeSummary: `Created ${dataset.name}`,
  diff: { op: "create", fields: ["name", "description", "category", "tags"] },
  snapshot: dataset,
  createdAt: dataset.createdAt
}));

export const sampleComments: Comment[] = [
  {
    id: "50000000-0000-4000-8000-000000000001",
    datasetId: sampleDatasets[4].id,
    locationId: null,
    parentId: null,
    authorId: sampleUsers[0].id,
    authorName: sampleUsers[0].name,
    body: "Add source quality notes when adding new labs so readers can distinguish formal institutes from satellite offices.",
    voteScore: 12,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "50000000-0000-4000-8000-000000000002",
    datasetId: sampleDatasets[0].id,
    locationId: null,
    parentId: null,
    authorId: sampleUsers[2].id,
    authorName: sampleUsers[2].name,
    body: "Capacity data is intentionally omitted unless public filings are available.",
    voteScore: 8,
    createdAt: now,
    updatedAt: now
  }
];

