export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "MapWiki API",
    version: "0.1.0",
    description: "REST API for collaborative geographic datasets, map objects, revisions, comments, imports, exports, and search."
  },
  servers: [{ url: "/api" }],
  paths: {
    "/datasets": {
      get: {
        summary: "List public datasets",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "tag", in: "query", schema: { type: "string" } },
          { name: "featured", in: "query", schema: { type: "boolean" } }
        ],
        responses: { "200": { description: "Datasets" } }
      },
      post: {
        summary: "Create a dataset",
        security: [{ session: [] }],
        responses: { "201": { description: "Created dataset" }, "401": { description: "Authentication required" } }
      }
    },
    "/locations": {
      get: {
        summary: "List locations or return GeoJSON for map rendering",
        parameters: [
          { name: "datasetIds", in: "query", schema: { type: "string" } },
          { name: "bbox", in: "query", schema: { type: "string", example: "-180,-90,180,90" } },
          { name: "format", in: "query", schema: { enum: ["json", "geojson"] } }
        ],
        responses: { "200": { description: "Locations or feature collection" } }
      },
      post: {
        summary: "Create a map object",
        security: [{ session: [] }],
        responses: { "201": { description: "Created location" } }
      }
    },
    "/search": {
      get: {
        summary: "Search datasets, locations, users, tags, and categories",
        parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Ranked search results" } }
      }
    },
    "/users": {
      get: {
        summary: "List users or fetch a profile by id",
        responses: { "200": { description: "Users" } }
      }
    },
    "/revisions": {
      get: {
        summary: "List dataset or location revision history",
        responses: { "200": { description: "Revision list" } }
      },
      post: {
        summary: "Restore a prior revision",
        security: [{ session: [] }],
        responses: { "200": { description: "Restored revision" }, "403": { description: "Moderator access required" } }
      }
    },
    "/comments": {
      get: {
        summary: "List comments for a dataset or location",
        responses: { "200": { description: "Comments" } }
      },
      post: {
        summary: "Create a comment",
        security: [{ session: [] }],
        responses: { "201": { description: "Created comment" } }
      }
    },
    "/imports": {
      post: {
        summary: "Validate and preview CSV, TSV, GeoJSON, KML, or GPX imports",
        security: [{ session: [] }],
        requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } } },
        responses: { "200": { description: "Import summary" } }
      }
    },
    "/exports": {
      get: {
        summary: "Export dataset objects as CSV, GeoJSON, JSON, KML, or GPX",
        parameters: [
          { name: "datasetId", in: "query", required: true, schema: { type: "string", format: "uuid" } },
          { name: "format", in: "query", schema: { enum: ["csv", "geojson", "json", "kml", "gpx"] } }
        ],
        responses: { "200": { description: "Export file" } }
      }
    }
  },
  components: {
    securitySchemes: {
      session: { type: "apiKey", in: "cookie", name: "next-auth.session-token" }
    }
  }
};

