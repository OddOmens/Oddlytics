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

## Documentation

See `docs/plans/` for design and implementation details.

## License

MIT
