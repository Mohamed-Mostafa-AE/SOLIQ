# SOLIQ evidence API v1

Contract owner: backend (#4). Base: `feat/omni-earth-prototypes-20261115`.
All paths below are same-origin. JSON UTF-8; errors are `{error:{code,message}}`.
No client-supplied owner, metrics, raw bytes or provider URLs are trusted.

## Identity, privacy and retention

`POST /api/sessions` with `{}` creates an anonymous session (201), sets signed
HttpOnly SameSite=Strict cookie `soliq_session` (Secure in production), returns
`{csrfToken,expiresAt}`. `GET /api/sessions` restores that response.
Every mutation after creation requires `X-CSRF-Token` and the session cookie.
All mutations require an exact configured Origin (`SOLIQ_ORIGIN`, localhost in dev).
`DELETE /api/sessions` destroys all owned farms, jobs, evidence, snapshots, runs,
raw bytes and idempotency records, then clears the cookie (204).
Sessions have a fixed 24-hour maximum lifetime; access never extends it.
Expiry denies access immediately; local startup/request sweep deletes expired data.
Operators must schedule `store.sweep()` at least hourly for inactive servers.
Missing/expired identity: 401; another session's ID: indistinguishable 404.
All private responses are `Cache-Control: no-store`. Never log request bodies/cookies.

## Routes

| Method/path | Request | Response |
| --- | --- | --- |
| POST /api/farms | `{geometry,saveLocation:true}` | 201 `{id,geometry,createdAt}` |
| POST /api/evidence/jobs | `{farmId,timeRange,products:[{product,version,qa}]}` | 202 job |
| GET /api/evidence/jobs/:id | none | 200 job |
| DELETE /api/evidence/jobs/:id | none | 200 cancelled job; terminal jobs: 409 |
| POST /api/runs | `{jobId}`; job must be terminal | 201 run |
| GET /api/runs/:id | none | 200 run |
| POST /api/runs/:id/replay | `{}` | 201 new run from verified original snapshot |
| GET /api/receipts/:id?format=json\|csv\|html | run ID | 200 deterministic receipt |

No geometry is persisted without literal `saveLocation:true` (403 otherwise).
Geometry is GeoJSON Point or one-ring Polygon, WGS84 longitude/latitude, at most
100 vertices and a bounding box no larger than 2 degrees per axis. No holes.
timeRange is `{start,end}` in YYYY-MM-DD UTC, inclusive, ordered, max 366 days.
Products: 1-8 distinct registered product/version pairs; qa is a JSON object.
Identifiers are server UUIDs. Unsupported fields are rejected (400).
Body limit 20,000 bytes; malformed JSON 400, wrong content type 415, excess 413.
Unknown routes 404, methods 405. Store not configured 503 `storage_unavailable`.

POST farms/jobs/runs/replay accepts optional `Idempotency-Key` (1-128 ASCII
letters/digits/._:-). Same session + route + key + canonical body returns original
status/body; changed body gives 409. Keys are isolated and expire with session.

## Jobs and adapter handoff (Gemini EO/science #5; SAR #6)

Jobs: `{id,state,createdAt,updatedAt,evidence:[manifest],errors:[{product,code}]}`.
States: queued -> running -> succeeded/partial/failed; queued/running -> cancelled.
No terminal-to-running transition. Local dispatcher executes in the request
(202 may already contain a terminal job); no unawaited serverless work.
Success means every requested source delivered usable evidence; partial means at
least one usable and at least one unavailable/failed; none usable means failed.
Cancellation is cooperative; late provider results are discarded.

Backend `createEvidenceService({store,adapters})` accepts a registry keyed by
`product@version`. Each adapter is an async function receiving only
`{geometry,timeRange,product,version,qa,signal}`. It returns `{manifest,rawBytes}`
where rawBytes is Buffer/Uint8Array, the exact source response bytes (max 8 MiB).
Never reconstruct bytes from parsed values. Credentials, auth headers, signed
URLs and arbitrary fetch URLs must not enter manifests. Provider modules must be
registered on the server; browser requests cannot register adapters.

Required manifest keys:

```json
{
  "product":"NASA/product-id", "version":"provider-version",
  "kind":"observed", "delivery":"live",
  "geometry":{"type":"Point","coordinates":[31,30]},
  "timeRange":{"start":"2026-01-01","end":"2026-01-02"},
  "spatialSupport":{"nativeGrid":"provider grid", "resolution":null},
  "units":{"rainfall":"mm"}, "qa":{"usable":true},
  "coverage":{"fraction":1}, "rawSha256":"computed by backend",
  "missingReason":null,
  "provider":"NASA", "retrievedAt":"2026-01-03T00:00:00.000Z"
}
```

`kind`: observed/derived/assumed/simulated. `delivery`: live/cached/unavailable.
Unavailable requires nonempty missingReason, null rawSha256, no raw bytes,
qa.usable=false. Missing quantities remain null/absent, never numeric zero.
Every available response requires provider/version/date/units/native grid/QA,
coverage fraction 0-1, and backend-verified SHA256. Backend pins geometry,
timeRange and product/version to request. Raw requests retain only those fields.
Cache identity includes owner, geometry, time, product, version and QA; no region
name keys or cross-session caches. Existing catalogue adapters are not raster
observations. Until #5/#6 supply compliant adapters, sources return unavailable
with `adapter_not_configured`; there is no invented scientific fallback.

## Immutable runs and receipts

Snapshot contains canonical request, complete manifests and content hashes.
Snapshot SHA256 and engine version `evidence-summary-v1` pin the computation.
Run `{id,snapshotSha256,engineVersion,metrics,replayOf}` is immutable; replay
verifies every raw hash and snapshot hash and recomputes with the pinned engine,
creates a new ID, and never fetches newer source data. Corruption: 409
`checksum_mismatch`. Unsupported engine: 409 `engine_unavailable`.
Metrics are only evidence counts and coverage by source, with
`decisionStatus:"comparison_only"`; no agricultural efficacy certificate.
JSON/CSV/HTML expose identical metrics and provenance. Receipt bytes are stable
for one run, independent of wall clock, contain no owner/token/raw request URLs.
CSV formula prefixes are neutralized; HTML is escaped and CSP sandboxed.

## Storage and deployment gate

Local implementation uses private session directories, atomic metadata writes,
content-addressed raw blobs, append-only snapshots/runs and serialized mutations.
Single Node process only; no SQLite or local disk production claim. Keep data
outside public assets and outside the repository. Permissions 0700/0600 where
supported; encrypt the host disk and restrict backups; deletion covers active
store, operator backups require separate documented retention.
Vercel/serverless startup fails closed with 503 until a durable transactional
store + private object storage adapter and signing secret are provisioned.
Production durable provider integration is BLOCKED by provider/configuration.
Do not select `/tmp` as durable storage or silently fall back to memory.

## Acceptance

Run `npm test` and `node --test backend-evidence.test.mjs`. Fixtures are explicitly
simulated. Tests cover ownership/exports, CSRF, consent, TTL/delete, invalid
inputs, concurrency/idempotency, immutable replay, corrupted bytes/snapshots,
partial/unavailable jobs, deterministic exports and fail-closed deployment.
Live EO/SAR acceptance remains with provider owners and release integration.

