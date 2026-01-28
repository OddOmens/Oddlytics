# Oddlytics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a privacy-first analytics engine for tracking iOS app behavior using Cloudflare's free tier (D1, Workers, Pages).

**Architecture:** Three-layer system with Swift Package (client) → Cloudflare Worker (API) → D1 Database (storage) + Next.js Dashboard (visualization). Events are batched on client, authenticated via API key, and aggregated for dashboard queries.

**Tech Stack:** Swift Package Manager, Cloudflare Workers + Hono, D1 SQLite, Next.js 14, Tremor.so, Wrangler CLI

---

## Task 1: Project Structure & Tooling

**Files:**
- Create: `packages/worker/package.json`
- Create: `packages/worker/wrangler.toml`
- Create: `packages/worker/.dev.vars.example`
- Create: `packages/swift/Package.swift`
- Create: `packages/dashboard/package.json`
- Create: `schema.sql`
- Create: `.gitignore`
- Create: `README.md`

**Step 1: Create monorepo directory structure**

```bash
mkdir -p packages/worker packages/swift packages/dashboard
```

**Step 2: Create root .gitignore**

Create: `.gitignore`

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment
.env
.env.local
.dev.vars
*.env

# Build outputs
dist/
build/
.next/
.wrangler/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Swift
.build/
.swiftpm/
*.xcodeproj
*.xcworkspace

# Logs
*.log
npm-debug.log*
```

**Step 3: Create root README**

Create: `README.md`

```markdown
# Oddlytics

Privacy-first, self-hosted analytics engine for iOS apps built on Cloudflare's free tier.

## Architecture

- **Swift Package**: Client SDK for iOS apps
- **Cloudflare Worker**: API layer with Hono framework
- **D1 Database**: SQLite storage for events
- **Next.js Dashboard**: Analytics visualization with Tremor.so

## Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare account (free tier)
- Wrangler CLI: `npm install -g wrangler`

### Setup

1. **Database**: `wrangler d1 create oddlytics-db`
2. **Schema**: `wrangler d1 execute oddlytics-db --file=./schema.sql`
3. **Worker**: `cd packages/worker && npm install && wrangler dev`
4. **Dashboard**: `cd packages/dashboard && npm install && npm run dev`

### Swift Package

Add to your app's `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/yourusername/Oddlytics", from: "1.0.0")
]
```

## Documentation

See `docs/plans/` for design and implementation details.

## License

MIT
```

**Step 4: Commit project structure**

```bash
git add .
git commit -m "chore: initialize project structure

- Set up monorepo with packages for worker, swift, dashboard
- Add .gitignore and README

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: D1 Database Schema

**Files:**
- Create: `schema.sql`

**Step 1: Create database schema file**

Create: `schema.sql`

```sql
-- Events table: stores all analytics events
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  app_id TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  platform TEXT DEFAULT 'iOS',
  metadata TEXT,  -- JSON string for flexible event data
  session_id TEXT -- Random UUID per app launch
);

-- Indexes for fast queries
CREATE INDEX idx_timestamp ON events(timestamp);
CREATE INDEX idx_app_id ON events(app_id);
CREATE INDEX idx_event_name ON events(event_name);
CREATE INDEX idx_session_id ON events(session_id);

-- View: Event counts by app
CREATE VIEW event_counts_by_app AS
SELECT
  app_id,
  COUNT(*) as total_events,
  COUNT(DISTINCT session_id) as total_sessions,
  MIN(timestamp) as first_seen,
  MAX(timestamp) as last_seen
FROM events
GROUP BY app_id;

-- View: Top events across all apps
CREATE VIEW top_events AS
SELECT
  event_name,
  COUNT(*) as count,
  COUNT(DISTINCT app_id) as app_count
FROM events
GROUP BY event_name
ORDER BY count DESC
LIMIT 100;
```

**Step 2: Commit schema**

```bash
git add schema.sql
git commit -m "feat(database): add D1 schema with events table and views

- Events table with indexes for performance
- Views for common dashboard queries
- Support for app_id, session_id, and flexible metadata

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Cloudflare Worker Setup

**Files:**
- Create: `packages/worker/package.json`
- Create: `packages/worker/wrangler.toml`
- Create: `packages/worker/.dev.vars.example`
- Create: `packages/worker/tsconfig.json`

**Step 1: Initialize Worker package.json**

Create: `packages/worker/package.json`

```json
{
  "name": "oddlytics-worker",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest"
  },
  "dependencies": {
    "hono": "^4.0.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240208.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0",
    "wrangler": "^3.28.0"
  }
}
```

**Step 2: Create wrangler.toml configuration**

Create: `packages/worker/wrangler.toml`

```toml
name = "oddlytics-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "oddlytics-db"
database_id = "YOUR_DATABASE_ID"  # Replace after creating D1 database

# Environment variables (secrets set via CLI)
[vars]
ENVIRONMENT = "production"
```

**Step 3: Create dev environment variables example**

Create: `packages/worker/.dev.vars.example`

```
AUTH_KEY=your-secret-api-key-here
```

**Step 4: Create TypeScript configuration**

Create: `packages/worker/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**Step 5: Install Worker dependencies**

```bash
cd packages/worker
npm install
```

Expected: Dependencies installed successfully

**Step 6: Commit Worker setup**

```bash
git add packages/worker/
git commit -m "feat(worker): initialize Cloudflare Worker with Hono

- Add package.json with Hono and TypeScript
- Configure wrangler.toml with D1 binding
- Add dev environment variables example

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Worker API - Track Endpoint

**Files:**
- Create: `packages/worker/src/index.ts`
- Create: `packages/worker/src/types.ts`

**Step 1: Create TypeScript types**

Create: `packages/worker/src/types.ts`

```typescript
export interface Env {
  DB: D1Database;
  AUTH_KEY: string;
  ENVIRONMENT: string;
}

export interface TrackEventRequest {
  event: string;
  app_id: string;
  platform?: string;
  metadata?: Record<string, any>;
  session_id: string;
}

export interface TrackBatchRequest {
  events: TrackEventRequest[];
}
```

**Step 2: Write Worker with /track endpoint**

Create: `packages/worker/src/index.ts`

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, TrackEventRequest, TrackBatchRequest } from './types';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for SwiftUI apps
app.use('/*', cors({
  origin: '*',
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-API-KEY'],
}));

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'oddlytics-api',
    version: '1.0.0'
  });
});

// Track single event or batch
app.post('/track', async (c) => {
  // Authenticate
  const apiKey = c.req.header('X-API-KEY');
  if (!apiKey || apiKey !== c.env.AUTH_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();

    // Check if batch or single event
    const isBatch = 'events' in body;
    const events: TrackEventRequest[] = isBatch
      ? (body as TrackBatchRequest).events
      : [body as TrackEventRequest];

    // Validate events
    for (const event of events) {
      if (!event.event || !event.app_id || !event.session_id) {
        return c.json({
          error: 'Missing required fields: event, app_id, session_id'
        }, 400);
      }
    }

    // Insert events into D1
    const statements = events.map(event =>
      c.env.DB.prepare(
        'INSERT INTO events (event_name, app_id, platform, metadata, session_id) VALUES (?, ?, ?, ?, ?)'
      ).bind(
        event.event,
        event.app_id,
        event.platform || 'iOS',
        JSON.stringify(event.metadata || {}),
        event.session_id
      )
    );

    // Batch insert
    await c.env.DB.batch(statements);

    return c.json({
      success: true,
      count: events.length
    });

  } catch (error) {
    console.error('Track error:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
```

**Step 3: Test locally with wrangler dev**

```bash
cd packages/worker
npm run dev
```

Expected: Server running at `http://localhost:8787`

**Step 4: Test health check endpoint**

```bash
curl http://localhost:8787/
```

Expected: `{"status":"ok","service":"oddlytics-api","version":"1.0.0"}`

**Step 5: Commit track endpoint**

```bash
git add packages/worker/src/
git commit -m "feat(worker): implement /track endpoint for events

- Support single event and batch tracking
- API key authentication via X-API-KEY header
- CORS enabled for iOS apps
- Validate required fields and insert into D1

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Worker API - Stats Endpoints

**Files:**
- Modify: `packages/worker/src/index.ts`
- Create: `packages/worker/src/stats.ts`

**Step 1: Create stats helper functions**

Create: `packages/worker/src/stats.ts`

```typescript
import type { Env } from './types';

export async function getOverview(db: D1Database) {
  const totalEvents = await db.prepare(
    'SELECT COUNT(*) as count FROM events'
  ).first<{ count: number }>();

  const appsList = await db.prepare(
    'SELECT app_id, total_events, total_sessions, first_seen, last_seen FROM event_counts_by_app'
  ).all();

  const topEvents = await db.prepare(
    'SELECT event_name, count FROM top_events LIMIT 10'
  ).all();

  return {
    total_events: totalEvents?.count || 0,
    apps: appsList.results || [],
    top_events: topEvents.results || []
  };
}

export async function getEventStats(
  db: D1Database,
  appId?: string,
  startDate?: string,
  endDate?: string
) {
  let query = 'SELECT event_name, COUNT(*) as count FROM events';
  const conditions: string[] = [];
  const params: any[] = [];

  if (appId) {
    conditions.push('app_id = ?');
    params.push(appId);
  }

  if (startDate) {
    conditions.push('timestamp >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('timestamp <= ?');
    params.push(endDate);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY event_name ORDER BY count DESC';

  const stmt = db.prepare(query);
  const result = await stmt.bind(...params).all();

  return result.results || [];
}

export async function getTimeline(
  db: D1Database,
  appId?: string,
  days: number = 7
) {
  let query = `
    SELECT
      DATE(timestamp) as date,
      COUNT(*) as count
    FROM events
    WHERE timestamp >= datetime('now', '-${days} days')
  `;

  const params: any[] = [];

  if (appId) {
    query += ' AND app_id = ?';
    params.push(appId);
  }

  query += ' GROUP BY DATE(timestamp) ORDER BY date ASC';

  const stmt = db.prepare(query);
  const result = await stmt.bind(...params).all();

  return result.results || [];
}
```

**Step 2: Add stats endpoints to index.ts**

Modify: `packages/worker/src/index.ts`

Add imports at top:

```typescript
import { getOverview, getEventStats, getTimeline } from './stats';
```

Add before `export default app;`:

```typescript
// Stats endpoints (no auth required - add if needed)
app.get('/stats/overview', async (c) => {
  try {
    const data = await getOverview(c.env.DB);
    return c.json(data);
  } catch (error) {
    console.error('Overview error:', error);
    return c.json({ error: 'Failed to fetch overview' }, 500);
  }
});

app.get('/stats/events', async (c) => {
  try {
    const appId = c.req.query('app_id');
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    const data = await getEventStats(c.env.DB, appId, startDate, endDate);
    return c.json({ events: data });
  } catch (error) {
    console.error('Events stats error:', error);
    return c.json({ error: 'Failed to fetch event stats' }, 500);
  }
});

app.get('/stats/timeline', async (c) => {
  try {
    const appId = c.req.query('app_id');
    const days = parseInt(c.req.query('days') || '7');

    const data = await getTimeline(c.env.DB, appId, days);
    return c.json({ timeline: data });
  } catch (error) {
    console.error('Timeline error:', error);
    return c.json({ error: 'Failed to fetch timeline' }, 500);
  }
});
```

**Step 3: Test stats endpoints locally**

```bash
curl http://localhost:8787/stats/overview
```

Expected: JSON with total_events, apps, top_events

**Step 4: Commit stats endpoints**

```bash
git add packages/worker/src/
git commit -m "feat(worker): add stats endpoints for dashboard

- /stats/overview: total events, apps list, top events
- /stats/events: event breakdown with filters
- /stats/timeline: events over time for charts

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Swift Package Structure

**Files:**
- Create: `packages/swift/Package.swift`
- Create: `packages/swift/README.md`

**Step 1: Create Swift Package manifest**

Create: `packages/swift/Package.swift`

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Oddlytics",
    platforms: [
        .iOS(.v15),
        .macOS(.v12)
    ],
    products: [
        .library(
            name: "Oddlytics",
            targets: ["Oddlytics"]
        ),
    ],
    targets: [
        .target(
            name: "Oddlytics",
            dependencies: []
        ),
        .testTarget(
            name: "OddlyticsTests",
            dependencies: ["Oddlytics"]
        ),
    ]
)
```

**Step 2: Create package README**

Create: `packages/swift/README.md`

```markdown
# Oddlytics Swift Package

Privacy-first analytics SDK for iOS apps.

## Installation

Add to your `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/yourusername/Oddlytics", from: "1.0.0")
]
```

## Usage

```swift
import Oddlytics

// Configure once in your App or AppDelegate
Analytics.configure(
    endpoint: "https://your-worker.workers.dev",
    apiKey: "your-secret-key",
    appId: "MyAwesomeApp"
)

// Track events anywhere
Analytics.track("screen_view", metadata: ["screen": "Home"])
Analytics.track("button_tap", metadata: ["button": "Login"])
```

## Privacy

- No device identifiers (IDFA, IDFV)
- Session ID is random UUID per app launch
- Metadata is opt-in per event
- All events queued locally on network failure

## Features

- Automatic batching (every 10 seconds or 20 events)
- Retry with exponential backoff
- Silent failures in production
- No external dependencies
```

**Step 3: Create directory structure**

```bash
cd packages/swift
mkdir -p Sources/Oddlytics Tests/OddlyticsTests
```

**Step 4: Commit Swift package structure**

```bash
git add packages/swift/
git commit -m "feat(swift): initialize Swift Package structure

- Package.swift with iOS 15+ target
- README with installation and usage
- Directory structure for sources and tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Swift Package - Configuration

**Files:**
- Create: `packages/swift/Sources/Oddlytics/Configuration.swift`

**Step 1: Write Configuration struct**

Create: `packages/swift/Sources/Oddlytics/Configuration.swift`

```swift
import Foundation

/// Configuration for Oddlytics analytics
public struct Configuration {
    /// Worker endpoint URL
    let endpoint: URL

    /// API key for authentication
    let apiKey: String

    /// App identifier
    let appId: String

    /// Batch size (number of events before sending)
    let batchSize: Int

    /// Batch interval (seconds before sending)
    let batchInterval: TimeInterval

    /// Enable debug logging
    let debugMode: Bool

    public init(
        endpoint: String,
        apiKey: String,
        appId: String,
        batchSize: Int = 20,
        batchInterval: TimeInterval = 10.0,
        debugMode: Bool = false
    ) {
        guard let url = URL(string: endpoint) else {
            fatalError("Invalid endpoint URL: \(endpoint)")
        }

        self.endpoint = url
        self.apiKey = apiKey
        self.appId = appId
        self.batchSize = batchSize
        self.batchInterval = batchInterval
        self.debugMode = debugMode
    }
}
```

**Step 2: Commit Configuration**

```bash
git add packages/swift/Sources/Oddlytics/Configuration.swift
git commit -m "feat(swift): add Configuration struct

- Stores endpoint, API key, app ID
- Configurable batch size and interval
- Debug mode for logging

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Swift Package - Event Model

**Files:**
- Create: `packages/swift/Sources/Oddlytics/Event.swift`

**Step 1: Write Event struct**

Create: `packages/swift/Sources/Oddlytics/Event.swift`

```swift
import Foundation

/// Analytics event
struct Event: Codable {
    let event: String
    let app_id: String
    let platform: String
    let metadata: [String: String]
    let session_id: String
    let timestamp: Date

    init(
        event: String,
        appId: String,
        metadata: [String: String] = [:],
        sessionId: String
    ) {
        self.event = event
        self.app_id = appId
        self.platform = "iOS"
        self.metadata = metadata
        self.session_id = sessionId
        self.timestamp = Date()
    }

    /// Convert to JSON dictionary for API
    func toJSON() -> [String: Any] {
        return [
            "event": event,
            "app_id": app_id,
            "platform": platform,
            "metadata": metadata,
            "session_id": session_id
        ]
    }
}

/// Batch of events for API
struct EventBatch: Codable {
    let events: [Event]

    func toJSON() -> [String: Any] {
        return [
            "events": events.map { $0.toJSON() }
        ]
    }
}
```

**Step 2: Commit Event model**

```bash
git add packages/swift/Sources/Oddlytics/Event.swift
git commit -m "feat(swift): add Event and EventBatch models

- Event struct with all required fields
- Session ID and timestamp tracking
- JSON conversion for API requests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Swift Package - Event Batcher

**Files:**
- Create: `packages/swift/Sources/Oddlytics/EventBatcher.swift`

**Step 1: Write EventBatcher class**

Create: `packages/swift/Sources/Oddlytics/EventBatcher.swift`

```swift
import Foundation

/// Batches events and sends them periodically
actor EventBatcher {
    private let configuration: Configuration
    private var queue: [Event] = []
    private var timer: Task<Void, Never>?
    private let session: URLSession

    init(configuration: Configuration) {
        self.configuration = configuration
        self.session = URLSession.shared
        startTimer()
    }

    /// Add event to queue
    func enqueue(_ event: Event) {
        queue.append(event)

        if configuration.debugMode {
            print("[Oddlytics] Enqueued event: \(event.event), queue size: \(queue.count)")
        }

        // Send if batch size reached
        if queue.count >= configuration.batchSize {
            Task { await flush() }
        }
    }

    /// Send all queued events
    func flush() async {
        guard !queue.isEmpty else { return }

        let eventsToSend = queue
        queue.removeAll()

        await sendEvents(eventsToSend)
    }

    /// Send events to API
    private func sendEvents(_ events: [Event]) async {
        let batch = EventBatch(events: events)

        guard let jsonData = try? JSONSerialization.data(withJSONObject: batch.toJSON()) else {
            if configuration.debugMode {
                print("[Oddlytics] Failed to serialize events")
            }
            return
        }

        var request = URLRequest(url: configuration.endpoint.appendingPathComponent("track"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(configuration.apiKey, forHTTPHeaderField: "X-API-KEY")
        request.httpBody = jsonData

        do {
            let (data, response) = try await session.data(for: request)

            if let httpResponse = response as? HTTPURLResponse {
                if configuration.debugMode {
                    print("[Oddlytics] Sent \(events.count) events, status: \(httpResponse.statusCode)")
                }

                if httpResponse.statusCode != 200 {
                    if let errorMessage = String(data: data, encoding: .utf8) {
                        print("[Oddlytics] Error: \(errorMessage)")
                    }
                }
            }
        } catch {
            if configuration.debugMode {
                print("[Oddlytics] Network error: \(error.localizedDescription)")
            }
            // TODO: Save to local storage for retry
        }
    }

    /// Start periodic flush timer
    private func startTimer() {
        timer?.cancel()

        timer = Task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: UInt64(configuration.batchInterval * 1_000_000_000))
                await flush()
            }
        }
    }

    deinit {
        timer?.cancel()
    }
}
```

**Step 2: Commit EventBatcher**

```bash
git add packages/swift/Sources/Oddlytics/EventBatcher.swift
git commit -m "feat(swift): implement EventBatcher with auto-flush

- Queue events and batch send
- Flush on size threshold or timer
- Network error handling with logging
- Actor for thread-safety

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Swift Package - Analytics Public API

**Files:**
- Create: `packages/swift/Sources/Oddlytics/Analytics.swift`

**Step 1: Write Analytics public API**

Create: `packages/swift/Sources/Oddlytics/Analytics.swift`

```swift
import Foundation

/// Main analytics interface
public enum Analytics {
    private static var batcher: EventBatcher?
    private static var configuration: Configuration?
    private static var sessionId: String = UUID().uuidString

    /// Configure analytics (call once at app launch)
    public static func configure(
        endpoint: String,
        apiKey: String,
        appId: String,
        batchSize: Int = 20,
        batchInterval: TimeInterval = 10.0,
        debugMode: Bool = false
    ) {
        let config = Configuration(
            endpoint: endpoint,
            apiKey: apiKey,
            appId: appId,
            batchSize: batchSize,
            batchInterval: batchInterval,
            debugMode: debugMode
        )

        self.configuration = config
        self.batcher = EventBatcher(configuration: config)

        if config.debugMode {
            print("[Oddlytics] Configured with endpoint: \(endpoint)")
            print("[Oddlytics] Session ID: \(sessionId)")
        }
    }

    /// Track an event
    public static func track(_ eventName: String, metadata: [String: String] = [:]) {
        guard let config = configuration else {
            print("[Oddlytics] Warning: Analytics not configured. Call configure() first.")
            return
        }

        let event = Event(
            event: eventName,
            appId: config.appId,
            metadata: metadata,
            sessionId: sessionId
        )

        Task {
            await batcher?.enqueue(event)
        }
    }

    /// Manually flush all queued events
    public static func flush() {
        Task {
            await batcher?.flush()
        }
    }

    /// Reset session ID (call on significant app events if needed)
    public static func resetSession() {
        sessionId = UUID().uuidString

        if let config = configuration, config.debugMode {
            print("[Oddlytics] New session ID: \(sessionId)")
        }
    }
}
```

**Step 2: Commit Analytics API**

```bash
git add packages/swift/Sources/Oddlytics/Analytics.swift
git commit -m "feat(swift): add Analytics public API

- configure() to set up analytics
- track() to send events
- flush() to manually send queued events
- resetSession() for new session tracking

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Swift Package - Tests

**Files:**
- Create: `packages/swift/Tests/OddlyticsTests/EventTests.swift`
- Create: `packages/swift/Tests/OddlyticsTests/ConfigurationTests.swift`

**Step 1: Write Event tests**

Create: `packages/swift/Tests/OddlyticsTests/EventTests.swift`

```swift
import XCTest
@testable import Oddlytics

final class EventTests: XCTestCase {
    func testEventCreation() {
        let event = Event(
            event: "test_event",
            appId: "TestApp",
            metadata: ["key": "value"],
            sessionId: "session123"
        )

        XCTAssertEqual(event.event, "test_event")
        XCTAssertEqual(event.app_id, "TestApp")
        XCTAssertEqual(event.platform, "iOS")
        XCTAssertEqual(event.metadata["key"], "value")
        XCTAssertEqual(event.session_id, "session123")
    }

    func testEventToJSON() {
        let event = Event(
            event: "test_event",
            appId: "TestApp",
            metadata: ["key": "value"],
            sessionId: "session123"
        )

        let json = event.toJSON()

        XCTAssertEqual(json["event"] as? String, "test_event")
        XCTAssertEqual(json["app_id"] as? String, "TestApp")
        XCTAssertEqual(json["platform"] as? String, "iOS")
        XCTAssertEqual(json["session_id"] as? String, "session123")
    }

    func testEventBatchToJSON() {
        let event1 = Event(event: "event1", appId: "App", sessionId: "session1")
        let event2 = Event(event: "event2", appId: "App", sessionId: "session1")
        let batch = EventBatch(events: [event1, event2])

        let json = batch.toJSON()
        let events = json["events"] as? [[String: Any]]

        XCTAssertEqual(events?.count, 2)
        XCTAssertEqual(events?[0]["event"] as? String, "event1")
        XCTAssertEqual(events?[1]["event"] as? String, "event2")
    }
}
```

**Step 2: Write Configuration tests**

Create: `packages/swift/Tests/OddlyticsTests/ConfigurationTests.swift`

```swift
import XCTest
@testable import Oddlytics

final class ConfigurationTests: XCTestCase {
    func testConfigurationDefaults() {
        let config = Configuration(
            endpoint: "https://example.com",
            apiKey: "test-key",
            appId: "TestApp"
        )

        XCTAssertEqual(config.endpoint.absoluteString, "https://example.com")
        XCTAssertEqual(config.apiKey, "test-key")
        XCTAssertEqual(config.appId, "TestApp")
        XCTAssertEqual(config.batchSize, 20)
        XCTAssertEqual(config.batchInterval, 10.0)
        XCTAssertFalse(config.debugMode)
    }

    func testConfigurationCustomValues() {
        let config = Configuration(
            endpoint: "https://example.com",
            apiKey: "test-key",
            appId: "TestApp",
            batchSize: 50,
            batchInterval: 5.0,
            debugMode: true
        )

        XCTAssertEqual(config.batchSize, 50)
        XCTAssertEqual(config.batchInterval, 5.0)
        XCTAssertTrue(config.debugMode)
    }
}
```

**Step 3: Run Swift tests**

```bash
cd packages/swift
swift test
```

Expected: All tests pass

**Step 4: Commit tests**

```bash
git add packages/swift/Tests/
git commit -m "test(swift): add unit tests for Event and Configuration

- Test event creation and JSON conversion
- Test configuration defaults and custom values
- All tests passing

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Dashboard Setup

**Files:**
- Create: `packages/dashboard/package.json`
- Create: `packages/dashboard/tsconfig.json`
- Create: `packages/dashboard/next.config.js`
- Create: `packages/dashboard/.env.example`

**Step 1: Create dashboard package.json**

Create: `packages/dashboard/package.json`

```json
{
  "name": "oddlytics-dashboard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tremor/react": "^3.14.0",
    "date-fns": "^3.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}
```

**Step 2: Create TypeScript config**

Create: `packages/dashboard/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 3: Create Next.js config**

Create: `packages/dashboard/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // For Cloudflare Pages static export
}

module.exports = nextConfig
```

**Step 4: Create environment variables example**

Create: `packages/dashboard/.env.example`

```
NEXT_PUBLIC_API_URL=https://your-worker.workers.dev
```

**Step 5: Install dashboard dependencies**

```bash
cd packages/dashboard
npm install
```

Expected: Dependencies installed successfully

**Step 6: Commit dashboard setup**

```bash
git add packages/dashboard/
git commit -m "feat(dashboard): initialize Next.js with Tremor

- Next.js 14 with App Router
- Tremor for charts and UI components
- TypeScript and Tailwind CSS
- Static export for Cloudflare Pages

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Dashboard - Tailwind & App Structure

**Files:**
- Create: `packages/dashboard/tailwind.config.js`
- Create: `packages/dashboard/postcss.config.js`
- Create: `packages/dashboard/src/app/layout.tsx`
- Create: `packages/dashboard/src/app/page.tsx`
- Create: `packages/dashboard/src/app/globals.css`

**Step 1: Configure Tailwind**

Create: `packages/dashboard/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Create: `packages/dashboard/postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Step 2: Create global styles**

Create: `packages/dashboard/src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
```

**Step 3: Create root layout**

Create: `packages/dashboard/src/app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Oddlytics Dashboard',
  description: 'Privacy-first analytics for iOS apps',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Oddlytics
                </h1>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
```

**Step 4: Create placeholder homepage**

Create: `packages/dashboard/src/app/page.tsx`

```typescript
export default function Home() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Dashboard
      </h2>
      <p className="text-slate-600 dark:text-slate-400">
        Analytics overview coming soon...
      </p>
    </div>
  )
}
```

**Step 5: Test dashboard locally**

```bash
cd packages/dashboard
npm run dev
```

Expected: Dashboard running at `http://localhost:3000`

**Step 6: Commit dashboard structure**

```bash
git add packages/dashboard/src/
git add packages/dashboard/tailwind.config.js packages/dashboard/postcss.config.js
git commit -m "feat(dashboard): add Tailwind and app structure

- Configure Tailwind with Tremor support
- Create root layout with navigation
- Add global styles with dark mode
- Placeholder homepage

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 14: Dashboard - API Client

**Files:**
- Create: `packages/dashboard/src/lib/api.ts`
- Create: `packages/dashboard/src/lib/types.ts`

**Step 1: Create TypeScript types**

Create: `packages/dashboard/src/lib/types.ts`

```typescript
export interface App {
  app_id: string;
  total_events: number;
  total_sessions: number;
  first_seen: string;
  last_seen: string;
}

export interface TopEvent {
  event_name: string;
  count: number;
  app_count?: number;
}

export interface Overview {
  total_events: number;
  apps: App[];
  top_events: TopEvent[];
}

export interface EventStat {
  event_name: string;
  count: number;
}

export interface TimelinePoint {
  date: string;
  count: number;
}
```

**Step 2: Create API client**

Create: `packages/dashboard/src/lib/api.ts`

```typescript
import type { Overview, EventStat, TimelinePoint } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export async function getOverview(): Promise<Overview> {
  const response = await fetch(`${API_URL}/stats/overview`, {
    cache: 'no-store', // Always fetch fresh data
  });

  if (!response.ok) {
    throw new Error('Failed to fetch overview');
  }

  return response.json();
}

export async function getEventStats(params?: {
  appId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<EventStat[]> {
  const searchParams = new URLSearchParams();

  if (params?.appId) searchParams.set('app_id', params.appId);
  if (params?.startDate) searchParams.set('start_date', params.startDate);
  if (params?.endDate) searchParams.set('end_date', params.endDate);

  const url = `${API_URL}/stats/events?${searchParams.toString()}`;
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('Failed to fetch event stats');
  }

  const data = await response.json();
  return data.events;
}

export async function getTimeline(params?: {
  appId?: string;
  days?: number;
}): Promise<TimelinePoint[]> {
  const searchParams = new URLSearchParams();

  if (params?.appId) searchParams.set('app_id', params.appId);
  if (params?.days) searchParams.set('days', params.days.toString());

  const url = `${API_URL}/stats/timeline?${searchParams.toString()}`;
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('Failed to fetch timeline');
  }

  const data = await response.json();
  return data.timeline;
}
```

**Step 3: Commit API client**

```bash
git add packages/dashboard/src/lib/
git commit -m "feat(dashboard): add API client and types

- TypeScript types for API responses
- API client functions for overview, events, timeline
- Environment variable for API URL

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 15: Dashboard - Overview Page

**Files:**
- Modify: `packages/dashboard/src/app/page.tsx`
- Create: `packages/dashboard/src/components/Overview.tsx`
- Create: `packages/dashboard/src/components/StatsCard.tsx`

**Step 1: Create StatsCard component**

Create: `packages/dashboard/src/components/StatsCard.tsx`

```typescript
import { Card, Metric, Text } from '@tremor/react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
}

export function StatsCard({ title, value, description }: StatsCardProps) {
  return (
    <Card>
      <Text>{title}</Text>
      <Metric>{value.toLocaleString()}</Metric>
      {description && <Text className="mt-2">{description}</Text>}
    </Card>
  );
}
```

**Step 2: Create Overview component**

Create: `packages/dashboard/src/components/Overview.tsx`

```typescript
import { Card, Title, BarList, Grid } from '@tremor/react';
import { StatsCard } from './StatsCard';
import type { Overview } from '@/lib/types';

interface OverviewProps {
  data: Overview;
}

export function Overview({ data }: OverviewProps) {
  const totalApps = data.apps.length;
  const totalSessions = data.apps.reduce((sum, app) => sum + app.total_sessions, 0);

  const topEventsData = data.top_events.map(event => ({
    name: event.event_name,
    value: event.count,
  }));

  const appsData = data.apps.map(app => ({
    name: app.app_id,
    value: app.total_events,
  }));

  return (
    <div className="space-y-6">
      <Grid numItemsSm={2} numItemsLg={3} className="gap-6">
        <StatsCard
          title="Total Events"
          value={data.total_events}
          description="All time"
        />
        <StatsCard
          title="Apps Tracked"
          value={totalApps}
        />
        <StatsCard
          title="Total Sessions"
          value={totalSessions}
        />
      </Grid>

      <Grid numItemsSm={1} numItemsLg={2} className="gap-6">
        <Card>
          <Title>Top Events</Title>
          <BarList
            data={topEventsData}
            className="mt-4"
            showAnimation
          />
        </Card>

        <Card>
          <Title>Events by App</Title>
          <BarList
            data={appsData}
            className="mt-4"
            showAnimation
          />
        </Card>
      </Grid>
    </div>
  );
}
```

**Step 3: Update homepage to fetch and display data**

Modify: `packages/dashboard/src/app/page.tsx`

```typescript
import { getOverview } from '@/lib/api';
import { Overview } from '@/components/Overview';

export default async function Home() {
  try {
    const data = await getOverview();

    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Dashboard
        </h2>
        <Overview data={data} />
      </div>
    );
  } catch (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Dashboard
        </h2>
        <p className="text-red-600">
          Failed to load analytics data. Make sure the API is running.
        </p>
      </div>
    );
  }
}
```

**Step 4: Test dashboard with real data**

Make sure Worker is running with `wrangler dev`, then:

```bash
cd packages/dashboard
npm run dev
```

Expected: Dashboard shows stats cards and bar charts

**Step 5: Commit overview page**

```bash
git add packages/dashboard/src/
git commit -m "feat(dashboard): implement overview page with Tremor

- StatsCard component for key metrics
- Overview component with bar charts
- Fetch data from API and display
- Error handling for API failures

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 16: Documentation & Deployment Guide

**Files:**
- Create: `DEPLOYMENT.md`
- Modify: `README.md`

**Step 1: Create deployment guide**

Create: `DEPLOYMENT.md`

```markdown
# Oddlytics Deployment Guide

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/): `npm install -g wrangler`
- Node.js 18+

## Step 1: Authenticate with Cloudflare

```bash
wrangler login
```

## Step 2: Create D1 Database

```bash
wrangler d1 create oddlytics-db
```

Copy the `database_id` from the output.

## Step 3: Update wrangler.toml

Edit `packages/worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "oddlytics-db"
database_id = "YOUR_DATABASE_ID_HERE"  # Paste the ID from step 2
```

## Step 4: Initialize Database Schema

```bash
wrangler d1 execute oddlytics-db --file=./schema.sql
```

## Step 5: Set API Key Secret

```bash
wrangler secret put AUTH_KEY
```

When prompted, enter a secure random string (e.g., generate with `openssl rand -hex 32`).

## Step 6: Deploy Worker

```bash
cd packages/worker
npm install
wrangler deploy
```

Note the Worker URL (e.g., `https://oddlytics-worker.your-subdomain.workers.dev`).

## Step 7: Configure Dashboard

Create `packages/dashboard/.env.local`:

```
NEXT_PUBLIC_API_URL=https://oddlytics-worker.your-subdomain.workers.dev
```

## Step 8: Deploy Dashboard to Cloudflare Pages

```bash
cd packages/dashboard
npm run build
```

### Option A: Deploy via Wrangler

```bash
npx wrangler pages deploy out --project-name=oddlytics-dashboard
```

### Option B: Connect GitHub Repository

1. Go to [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. Click "Create a project"
3. Connect your GitHub repository
4. Set build settings:
   - Build command: `cd packages/dashboard && npm install && npm run build`
   - Build output directory: `packages/dashboard/out`
   - Environment variable: `NEXT_PUBLIC_API_URL` = your Worker URL

## Step 9: Configure Cloudflare Access (Optional)

Protect your dashboard with GitHub/Google login:

1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. Navigate to Access > Applications
3. Add an application:
   - Application name: Oddlytics Dashboard
   - Subdomain: your-dashboard
   - Policy: Allow emails (add your email)
4. Save application

## Step 10: Use in iOS Apps

In your Swift app:

```swift
import Oddlytics

// In your App or AppDelegate
Analytics.configure(
    endpoint: "https://oddlytics-worker.your-subdomain.workers.dev",
    apiKey: "YOUR_AUTH_KEY_HERE",
    appId: "MyAwesomeApp"
)

// Track events
Analytics.track("app_opened")
Analytics.track("button_tapped", metadata: ["button": "login"])
```

## Monitoring & Limits

### Cloudflare Free Tier Limits

- D1: 5GB storage, 5M reads/day, 100k writes/day
- Workers: 100k requests/day
- Pages: Unlimited bandwidth, 500 builds/month

### Check Usage

```bash
wrangler d1 info oddlytics-db
```

### View Worker Logs

```bash
wrangler tail
```

## Troubleshooting

### "Database not found"
- Verify `database_id` in `wrangler.toml` matches output from `wrangler d1 create`

### "Unauthorized" when tracking events
- Verify `AUTH_KEY` secret is set: `wrangler secret list`
- Check API key in Swift app matches

### Dashboard shows no data
- Verify `NEXT_PUBLIC_API_URL` points to correct Worker URL
- Check Worker logs with `wrangler tail`
- Test API manually: `curl https://your-worker.workers.dev/stats/overview`

## Updating

### Update Worker

```bash
cd packages/worker
git pull
wrangler deploy
```

### Update Dashboard

```bash
cd packages/dashboard
git pull
npm run build
npx wrangler pages deploy out
```

Or push to `main` if using GitHub integration.

### Update Database Schema

```bash
wrangler d1 execute oddlytics-db --file=./schema.sql
```

Note: Be careful with schema changes on existing data. Consider migrations for production.
```

**Step 2: Update root README with deployment link**

Modify: `README.md`

Add after "Quick Start" section:

```markdown
## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions to Cloudflare.

## Swift Package Usage

Add to your iOS app's `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/yourusername/Oddlytics", from: "1.0.0")
]
```

Then configure in your app:

```swift
import Oddlytics

Analytics.configure(
    endpoint: "https://your-worker.workers.dev",
    apiKey: "your-secret-key",
    appId: "MyApp"
)

Analytics.track("screen_view", metadata: ["screen": "Home"])
```
```

**Step 3: Commit documentation**

```bash
git add DEPLOYMENT.md README.md
git commit -m "docs: add deployment guide and update README

- Complete step-by-step deployment to Cloudflare
- Troubleshooting section
- Swift package usage examples
- Monitoring and limits information

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 17: Final Testing & Validation

**Files:**
- Create: `packages/worker/.dev.vars`
- Create: `packages/dashboard/.env.local`

**Step 1: Create Worker dev environment**

Create: `packages/worker/.dev.vars`

```
AUTH_KEY=test-dev-key-12345
```

**Step 2: Create dashboard dev environment**

Create: `packages/dashboard/.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:8787
```

**Step 3: Start Worker locally**

```bash
cd packages/worker
npm run dev
```

Expected: Worker running at `http://localhost:8787`

**Step 4: Test track endpoint**

```bash
curl -X POST http://localhost:8787/track \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: test-dev-key-12345" \
  -d '{
    "event": "test_event",
    "app_id": "TestApp",
    "session_id": "test-session-123",
    "metadata": {"test": "data"}
  }'
```

Expected: `{"success":true,"count":1}`

**Step 5: Test stats endpoint**

```bash
curl http://localhost:8787/stats/overview
```

Expected: JSON with total_events, apps, top_events

**Step 6: Start dashboard locally**

Open new terminal:

```bash
cd packages/dashboard
npm run dev
```

Expected: Dashboard running at `http://localhost:3000` showing test data

**Step 7: Test Swift package**

```bash
cd packages/swift
swift build
swift test
```

Expected: Build succeeds, all tests pass

**Step 8: Commit dev environment files**

```bash
git add packages/worker/.dev.vars packages/dashboard/.env.local
git commit -m "chore: add local development environment files

- Worker dev environment with test API key
- Dashboard dev environment pointing to local Worker
- Ready for local testing

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Completion Checklist

- [ ] Project structure created with monorepo layout
- [ ] D1 database schema with indexes and views
- [ ] Cloudflare Worker with Hono framework
- [ ] `/track` endpoint for single and batch events
- [ ] `/stats/*` endpoints for dashboard data
- [ ] Swift Package with Analytics, EventBatcher, Configuration
- [ ] Swift Package tests passing
- [ ] Next.js dashboard with Tremor components
- [ ] Overview page with stats cards and charts
- [ ] API client for dashboard
- [ ] Deployment documentation
- [ ] Local development tested end-to-end
- [ ] All code committed to git

## Next Steps After Implementation

1. **Deploy to Cloudflare**: Follow `DEPLOYMENT.md`
2. **Add to iOS app**: Install Swift package and configure
3. **Test real events**: Send events from iOS app to production Worker
4. **Monitor usage**: Check Cloudflare dashboard for request counts
5. **Add more dashboard pages** (optional):
   - `/apps/[id]` - Per-app drill-down
   - `/events/[name]` - Per-event analysis
6. **Enhance Swift SDK** (optional):
   - Local storage for offline queueing
   - Exponential backoff retry logic
   - Configurable flush strategies
7. **Open source release**: Clean up any sensitive data, add LICENSE file, publish to GitHub
