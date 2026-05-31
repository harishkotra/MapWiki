export type UserRole = "anonymous" | "registered" | "moderator" | "admin";
export type DatasetVisibility = "public" | "unlisted" | "private";
export type DatasetStatus = "draft" | "pending_review" | "published" | "locked" | "archived";
export type GeometryKind = "Point" | "LineString" | "Polygon" | "MultiPoint" | "MultiLineString" | "MultiPolygon";
export type VoteTargetType = "dataset" | "location" | "comment";
export type RevisionTargetType = "dataset" | "location";
export type ReportStatus = "open" | "triaged" | "resolved" | "dismissed";

export type Position = [number, number] | [number, number, number];

export type PointGeometry = {
  type: "Point";
  coordinates: Position;
};

export type LineStringGeometry = {
  type: "LineString";
  coordinates: Position[];
};

export type PolygonGeometry = {
  type: "Polygon";
  coordinates: Position[][];
};

export type MultiPointGeometry = {
  type: "MultiPoint";
  coordinates: Position[];
};

export type MultiLineStringGeometry = {
  type: "MultiLineString";
  coordinates: Position[][];
};

export type MultiPolygonGeometry = {
  type: "MultiPolygon";
  coordinates: Position[][][];
};

export type Geometry =
  | PointGeometry
  | LineStringGeometry
  | PolygonGeometry
  | MultiPointGeometry
  | MultiLineStringGeometry
  | MultiPolygonGeometry;

export type Feature = {
  type: "Feature";
  geometry: Geometry;
  properties: Record<string, unknown>;
};

export type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
};

export type User = {
  id: string;
  name: string;
  email?: string | null;
  image?: string | null;
  bio?: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type Source = {
  id: string;
  title: string;
  url?: string | null;
  publicationDate?: string | null;
  notes?: string | null;
  reliabilityScore: number;
};

export type Media = {
  id: string;
  ownerId: string;
  ownerType: "dataset" | "location" | "comment";
  url: string;
  mimeType: string;
  altText?: string | null;
  createdBy: string;
  createdAt: string;
};

export type Dataset = {
  id: string;
  slug: string;
  name: string;
  description: string;
  coverImage?: string | null;
  category: string;
  tags: string[];
  creatorId: string;
  creatorName: string;
  visibility: DatasetVisibility;
  status: DatasetStatus;
  objectCount: number;
  followers: number;
  views: number;
  color: string;
  defaultOpacity: number;
  createdAt: string;
  updatedAt: string;
};

export type Location = {
  id: string;
  datasetId: string;
  title: string;
  description: string;
  geometry: Geometry;
  geometryType: GeometryKind;
  metadata: Record<string, unknown>;
  sources: Source[];
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type Revision = {
  id: string;
  targetType: RevisionTargetType;
  targetId: string;
  parentRevisionId?: string | null;
  authorId: string;
  authorName: string;
  changeSummary: string;
  diff: Record<string, unknown>;
  snapshot: Record<string, unknown>;
  createdAt: string;
};

export type Comment = {
  id: string;
  datasetId?: string | null;
  locationId?: string | null;
  parentId?: string | null;
  authorId: string;
  authorName: string;
  body: string;
  voteScore: number;
  createdAt: string;
  updatedAt: string;
};

export type SearchResult = {
  id: string;
  type: "dataset" | "location" | "user" | "tag" | "category";
  title: string;
  subtitle?: string;
  href: string;
  score: number;
};

export type ImportPreviewRow = {
  rowNumber: number;
  title?: string;
  latitude?: number;
  longitude?: number;
  geometry?: Geometry;
  metadata: Record<string, unknown>;
  errors: string[];
};

export type ImportSummary = {
  fileName: string;
  fileType: "csv" | "tsv" | "geojson" | "kml" | "gpx";
  totalRows: number;
  validRows: number;
  invalidRows: number;
  requiresGeocoding: number;
  preview: ImportPreviewRow[];
};

export type ApiError = {
  error: string;
  details?: unknown;
};

