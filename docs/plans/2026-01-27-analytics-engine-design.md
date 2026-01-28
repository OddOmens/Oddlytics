# Oddlytics - Self-Hosted Analytics Engine Design

**Date:** 2026-01-27
**Status:** Approved
**Purpose:** Track user behavior across multiple iOS/SwiftUI apps using Cloudflare's free tier

## Overview

Oddlytics is a privacy-first, self-hosted analytics engine for tracking lifecycle events and user actions across a suite of iOS apps. Built entirely on Cloudflare's free tier, it provides beautiful dashboards while remaining completely open-source ready.

## Use Case

Track behavior across multiple iOS/SwiftUI apps with:
- Basic app lifecycle events (app opens, closes, screens viewed)
- User actions (button taps, feature usage, interactions)
- Dashboard with overview + drill-down capabilities
- Complete privacy (no device identifiers, no PII)

## Architecture

### Three-Layer System

#### 1. Data Layer - Cloudflare D1
Single SQLite database storing all events from all apps.

**Schema:**
```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  app_id TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  platform TEXT DEFAULT 'iOS',
  metadata TEXT,  -- JSON for flexible data
  session_id TEXT -- Random UUID for grouping
);

CREATE INDEX idx_timestamp ON events(timestamp);
CREATE INDEX idx_app_id ON events(app_id);
CREATE INDEX idx_event_name ON events(event_name);
```

**Rationale:**
- `app_id`: Differentiates which app sent the event
- `session_id`: Random UUID generated per app launch for grouping related events
- `metadata`: Flexible JSON for event-specific data
- Indexes optimize dashboard queries by time, app, and event type

#### 2. API Layer - Cloudflare Worker + Hono

**Framework:** Hono (Express-like for Edge)

**Endpoints:**
- `POST /track` - Receives events (single or batch array)
- `GET /stats/overview` - Total counts, apps list
- `GET /stats/events` - Event breakdown with filters (app, date range)
- `GET /stats/timeline` - Events over time for charts

**Security:**
- API key authentication via `X-API-KEY` header
- Stored in Cloudflare Secrets (production) and `.dev.vars` (local)
- CORS configured for SwiftUI apps
- Rate limiting via Cloudflare (1000 req/min default)

**Example `/track` handler:**
```javascript
app.post('/track', async (c) => {
  const auth = c.req.header('X-API-KEY');
  if (auth !== c.env.AUTH_KEY) return c.json({ error: 'Unauthorized' }, 401);

  const { event, app_id, platform, metadata, session_id } = await c.req.json();

  await c.env.DB.prepare(
    "INSERT INTO events (event_name, app_id, platform, metadata, session_id) VALUES (?, ?, ?, ?, ?)"
  ).bind(event, app_id, platform || 'iOS', JSON.stringify(metadata), session_id).run();

  return c.json({ success: true });
});
```

#### 3. Client Layer - Swift Package

**Package Name:** `Oddlytics`

**Structure:**
```
Oddlytics/
├── Package.swift
└── Sources/
    └── Oddlytics/
        ├── Analytics.swift          # Main interface
        ├── EventBatcher.swift       # Batching logic
        └── Configuration.swift      # Endpoint + API key
```

**API:**
```swift
// Configure once in AppDelegate/App
Analytics.configure(
  endpoint: "https://your-worker.workers.dev",
  apiKey: "your-secret-key",
  appId: "MyAwesomeApp"
)

// Track events anywhere
Analytics.track("screen_view", metadata: ["screen": "Home"])
Analytics.track("button_tap", metadata: ["button": "Login"])
```

**Features:**
- Automatic batching (sends every 10 seconds or 20 events)
- Local queueing in UserDefaults on network failure
- Retry with exponential backoff
- Silent failures in production, logging in debug
- Session ID auto-generated per app launch

**Target:** iOS 15+ (modern async/await support)

#### 4. Dashboard - Next.js on Cloudflare Pages

**Framework:** Next.js 14+ with App Router

**UI Library:** Tremor.so (Stripe-like charts and components)

**Pages:**
- `/` - Overview (total events, events per app, top events)
- `/apps/[id]` - Per-app detailed view
- `/events/[name]` - Drill-down for specific event

**Security:** Cloudflare Access
- Free GitHub/Google login (< 50 users)
- Zero-trust authentication
- No custom auth code needed

**Data Fetching:**
- Server components call Worker `/stats/*` endpoints
- Client components for interactive filtering
- Real-time updates optional (polling or webhooks)

## Error Handling

### Swift Client
- Network failures: Queue locally, retry on next launch
- Invalid responses: Log in debug, silent in production
- Missing configuration: Fail gracefully, no crashes
- All analytics wrapped in `do-catch` blocks

### Worker
- Invalid API key → 401
- Malformed JSON → 400 with error details
- D1 failures → 503 (client retries)
- Rate limiting → Cloudflare handles automatically

### Dashboard
- Failed stats fetch → Show cached data or "Unable to load"
- Cloudflare Access handles all auth errors

## Privacy Principles

- **No device identifiers:** No IDFA, IDFV, or unique hardware IDs
- **Session ID:** Random UUID, regenerated each app launch
- **No IP logging:** Cloudflare Workers don't expose client IPs
- **Metadata opt-in:** Developers choose what to send per event
- **Open source:** Fully auditable by anyone

## Testing Strategy

### Swift Package
- XCTest unit tests for batching logic
- Mock URLSession for network tests
- Test with/without network connectivity

### Worker
- Local testing with `wrangler dev`
- Integration tests against local D1
- Test auth failures, rate limiting

### Dashboard
- Vercel preview deployments for UI
- E2E tests with Playwright (optional)

## Deployment

### Swift Package
- Host on GitHub as public repo
- Developers add via SPM: `.package(url: "https://github.com/you/Oddlytics", from: "1.0.0")`

### Worker
- `npx wrangler deploy`
- Secrets: `wrangler secret put AUTH_KEY`
- D1 binding in `wrangler.toml`

### Dashboard
- Connect GitHub to Cloudflare Pages
- Auto-deploy on push to `main`
- Environment variables in Cloudflare dashboard

## Costs

Everything fits in Cloudflare Free Tier:
- D1: 5GB storage, 5M reads/day
- Workers: 100k requests/day
- Pages: Unlimited static hosting
- Access: Free for < 50 users

## Repository Structure

```
Oddlytics/
├── docs/
│   └── plans/
│       └── 2026-01-27-analytics-engine-design.md
├── packages/
│   ├── swift/              # Swift Package
│   ├── worker/             # Cloudflare Worker
│   └── dashboard/          # Next.js dashboard
├── schema.sql              # D1 schema
├── wrangler.toml           # Worker config
└── README.md
```

## Success Criteria

- [ ] Track events from multiple iOS apps
- [ ] Dashboard shows overview + drill-down
- [ ] 100% free (within Cloudflare limits)
- [ ] Open-source ready (no secrets in code)
- [ ] Privacy-first (no PII collection)

## Next Steps

1. Set up Cloudflare Worker project with Hono
2. Create D1 database and schema
3. Build Swift Package with batching logic
4. Build Next.js dashboard with Tremor
5. Test end-to-end flow
6. Document deployment process
