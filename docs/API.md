# API Design

The OpenAPI document is served at `/api/openapi`. Run `npm run openapi` to write a static copy to `docs/openapi.json`.

## Endpoints

- `GET /api/datasets`: list public datasets with `q`, `category`, `tag`, `featured`, `limit`, and `offset`.
- `POST /api/datasets`: create a draft dataset. Requires a signed-in registered user.
- `GET /api/locations`: list map objects. Supports `datasetIds`, `bbox`, `q`, `limit`, and `format=geojson`.
- `POST /api/locations`: create a point, line, or polygon object. Requires auth.
- `GET /api/search`: ranked global search across datasets, locations, and users.
- `GET /api/users`: list users or fetch `?id=...`.
- `GET /api/revisions`: list dataset or location revision history.
- `POST /api/revisions`: restore a revision. Requires moderator role.
- `GET /api/comments`: list comments for a dataset or location.
- `POST /api/comments`: create a comment. Requires auth.
- `POST /api/imports`: validate and preview CSV, TSV, GeoJSON, KML, or GPX uploads.
- `GET /api/exports`: export a dataset as `geojson`, `csv`, `json`, `kml`, or `gpx`.
- `GET /api/health`: deployment health check.

## Response Shape

Successful JSON endpoints return:

```json
{ "data": {} }
```

Errors return:

```json
{ "error": "Message", "details": {} }
```

## Performance Notes

Use `bbox` and `datasetIds` for map viewport requests. The MVP returns GeoJSON, while the schema and repository boundary are designed to add MVT/vector tile routes without changing dataset or revision contracts.

